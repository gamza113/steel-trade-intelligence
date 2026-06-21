import type {
  MatchedDimensionDetail,
  MatchScoreBreakdown,
  MatchSearchInput,
  MatchSearchResponse,
  SupplierMatchResult,
} from "@stip/shared-types";
import {
  isSizeAgnosticRaw,
  optionsFromStoredDimension,
} from "../../utils/dimensionParser.js";
import type {
  CustomerMatchContext,
  CustomerProductDemandRow,
  GeoPoint,
  MatchDemand,
  SupplierProductCandidate,
} from "./matching.types.js";
import * as matchingRepository from "./matching.repository.js";

const WEIGHTS = {
  dimension: 0.35,
  steel_grade: 0.25,
  product_category: 0.2,
  geographic: 0.15,
  remarks: 0.05,
};

const MAX_GEO_DISTANCE_KM = 12000;

type DimensionKey = "thickness" | "width" | "length";

const DIMENSION_KEYS: DimensionKey[] = ["thickness", "width", "length"];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function textMatchScore(requested: string | undefined, candidate: string): number {
  if (!requested) {
    return 1;
  }

  const req = normalizeText(requested);
  const cand = normalizeText(candidate);

  if (req === cand) {
    return 1;
  }

  if (cand.includes(req) || req.includes(cand)) {
    return 0.75;
  }

  const reqTokens = req.split(/[\s,/+-]+/).filter(Boolean);
  const matchedTokens = reqTokens.filter((token) => cand.includes(token));
  if (reqTokens.length > 0 && matchedTokens.length > 0) {
    return 0.5 * (matchedTokens.length / reqTokens.length);
  }

  return 0;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geographicScore(
  supplierGeo: GeoPoint,
  customerGeo: GeoPoint | null,
): number {
  if (!customerGeo) {
    return 0.5;
  }

  const sLat = supplierGeo.latitude;
  const sLon = supplierGeo.longitude;
  const cLat = customerGeo.latitude;
  const cLon = customerGeo.longitude;

  if (
    sLat === null ||
    sLon === null ||
    cLat === null ||
    cLon === null
  ) {
    return 0.5;
  }

  const distance = haversineKm(sLat, sLon, cLat, cLon);
  return Math.max(0, 1 - distance / MAX_GEO_DISTANCE_KM);
}

function nearestOptionScore(
  requested: number,
  options: number[],
): { score: number; matched: number } {
  let nearest = options[0];
  let minDistance = Math.abs(options[0] - requested);

  for (const option of options) {
    const distance = Math.abs(option - requested);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = option;
    }
  }

  const reference = Math.max(requested, nearest, 1);
  return {
    score: Math.max(0, 1 - minDistance / reference),
    matched: nearest,
  };
}

function scoreDimension(
  dimensionType: DimensionKey,
  requested: number | undefined,
  candidate: SupplierProductCandidate,
): MatchedDimensionDetail {
  if (requested === undefined || requested === null) {
    return {
      dimension_type: dimensionType,
      requested: null,
      matched_value: null,
      match_type: "not_requested",
      score: 1,
    };
  }

  const rawKey = `${dimensionType}_raw` as const;
  const minKey = `${dimensionType}_min` as const;
  const maxKey = `${dimensionType}_max` as const;
  const raw = candidate[rawKey];
  const min = candidate[minKey];
  const max = candidate[maxKey];

  if (isSizeAgnosticRaw(raw)) {
    return {
      dimension_type: dimensionType,
      requested,
      matched_value: null,
      match_type: "flexible",
      score: 1,
    };
  }

  const options = candidate.dimension_options
    .filter((option) => option.dimension_type === dimensionType)
    .map((option) => option.value);

  if (options.length > 0) {
    const exact = options.find((option) => option === requested);
    if (exact !== undefined) {
      return {
        dimension_type: dimensionType,
        requested,
        matched_value: exact,
        match_type: "exact",
        score: 1,
      };
    }

    const nearest = nearestOptionScore(requested, options);
    return {
      dimension_type: dimensionType,
      requested,
      matched_value: nearest.matched,
      match_type: "nearest",
      score: nearest.score,
    };
  }

  const fallbackOptions = optionsFromStoredDimension(min, max, raw);
  if (fallbackOptions.length > 0) {
    const exact = fallbackOptions.find((option) => option === requested);
    if (exact !== undefined) {
      return {
        dimension_type: dimensionType,
        requested,
        matched_value: exact,
        match_type: "exact",
        score: 1,
      };
    }

    const nearest = nearestOptionScore(requested, fallbackOptions);
    return {
      dimension_type: dimensionType,
      requested,
      matched_value: nearest.matched,
      match_type: "nearest",
      score: nearest.score,
    };
  }

  if (min !== null || max !== null) {
    const lower = min ?? max!;
    const upper = max ?? min!;

    if (requested >= lower && requested <= upper) {
      return {
        dimension_type: dimensionType,
        requested,
        matched_value: requested,
        match_type: "range",
        score: 1,
      };
    }

    const boundary = requested < lower ? lower : upper;
    const distance = Math.abs(requested - boundary);
    const reference = Math.max(requested, boundary, 1);

    return {
      dimension_type: dimensionType,
      requested,
      matched_value: boundary,
      match_type: "nearest",
      score: Math.max(0, 1 - distance / reference),
    };
  }

  return {
    dimension_type: dimensionType,
    requested,
    matched_value: null,
    match_type: "no_match",
    score: 0,
  };
}

function aggregateDimensionScore(
  details: MatchedDimensionDetail[],
): number {
  const scored = details.filter(
    (detail) => detail.match_type !== "not_requested",
  );
  if (scored.length === 0) {
    return 1;
  }

  const total = scored.reduce((sum, detail) => sum + detail.score, 0);
  return total / scored.length;
}

function remarksScore(
  demand: MatchDemand,
  candidate: SupplierProductCandidate,
): number {
  const remarks = [
    candidate.supplier_remarks,
    candidate.product_remarks,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!remarks) {
    return 0;
  }

  let signals = 0;
  let matches = 0;

  if (demand.steel_grade) {
    signals += 1;
    if (remarks.includes(normalizeText(demand.steel_grade))) {
      matches += 1;
    }
  }

  if (demand.product_category) {
    signals += 1;
    if (remarks.includes(normalizeText(demand.product_category))) {
      matches += 1;
    }
  }

  if (signals === 0) {
    return remarks.length > 0 ? 0.25 : 0;
  }

  return matches / signals;
}

function buildReason(
  breakdown: MatchScoreBreakdown,
  dimensionDetails: MatchedDimensionDetail[],
  demand: MatchDemand,
): string {
  const parts: string[] = [];

  if (demand.product_category) {
    parts.push(
      `Category ${Math.round(breakdown.product_category * 100)}%`,
    );
  }

  if (demand.steel_grade) {
    parts.push(`Grade ${Math.round(breakdown.steel_grade * 100)}%`);
  }

  const dimensionParts = dimensionDetails
    .filter((detail) => detail.match_type !== "not_requested")
    .map((detail) => {
      const label = detail.dimension_type;
      if (detail.match_type === "flexible") {
        return `${label}: flexible (size agnostic)`;
      }
      if (detail.match_type === "exact") {
        return `${label}: exact ${detail.matched_value}`;
      }
      if (detail.match_type === "range") {
        return `${label}: within range (${detail.matched_value})`;
      }
      if (detail.match_type === "nearest" && detail.matched_value !== null) {
        return `${label}: nearest ${detail.matched_value} (requested ${detail.requested})`;
      }
      if (detail.match_type === "no_match") {
        return `${label}: no match`;
      }
      return `${label}: ${Math.round(detail.score * 100)}%`;
    });

  if (dimensionParts.length > 0) {
    parts.push(dimensionParts.join("; "));
  }

  parts.push(`Geo ${Math.round(breakdown.geographic * 100)}%`);

  if (breakdown.remarks > 0) {
    parts.push(`Remarks signal ${Math.round(breakdown.remarks * 100)}%`);
  }

  return parts.join(" · ");
}

function scoreCandidate(
  demand: MatchDemand,
  candidate: SupplierProductCandidate,
  customerGeo: GeoPoint | null,
): SupplierMatchResult {
  const dimensionDetails = DIMENSION_KEYS.map((key) =>
    scoreDimension(key, demand[key], candidate),
  );
  const dimensionScore = aggregateDimensionScore(dimensionDetails);
  const categoryScore = textMatchScore(
    demand.product_category,
    candidate.product_category,
  );
  const gradeScore = textMatchScore(demand.steel_grade, candidate.steel_grade);
  const geoScore = geographicScore(candidate.geo, customerGeo);
  const remarksSignal = remarksScore(demand, candidate);

  const breakdown: MatchScoreBreakdown = {
    dimension: dimensionScore,
    steel_grade: gradeScore,
    product_category: categoryScore,
    geographic: geoScore,
    remarks: remarksSignal,
    total:
      dimensionScore * WEIGHTS.dimension +
      gradeScore * WEIGHTS.steel_grade +
      categoryScore * WEIGHTS.product_category +
      geoScore * WEIGHTS.geographic +
      remarksSignal * WEIGHTS.remarks,
  };

  return {
    supplier_id: candidate.supplier_id,
    supplier_name: candidate.supplier_name,
    country: candidate.country,
    port_name: candidate.port_name,
    product_id: candidate.product_id,
    product_category: candidate.product_category,
    steel_grade: candidate.steel_grade,
    matched_dimensions: dimensionDetails,
    score: Math.round(breakdown.total * 1000) / 1000,
    score_breakdown: {
      ...breakdown,
      total: Math.round(breakdown.total * 1000) / 1000,
    },
    reason: buildReason(breakdown, dimensionDetails, demand),
  };
}

function representativeDimension(
  min: string | null,
  max: string | null,
  raw: string | null,
): number | undefined {
  const minNum = min !== null ? Number(min) : null;
  const maxNum = max !== null ? Number(max) : null;
  const options = optionsFromStoredDimension(minNum, maxNum, raw);
  if (options.length > 0) {
    return options[0];
  }
  if (minNum !== null && maxNum !== null) {
    return (minNum + maxNum) / 2;
  }
  return minNum ?? maxNum ?? undefined;
}

function demandFromCustomerProduct(row: CustomerProductDemandRow): MatchDemand {
  return {
    product_category: row.product_category,
    steel_grade: row.steel_grade,
    thickness: representativeDimension(
      row.thickness_min,
      row.thickness_max,
      row.thickness_raw,
    ),
    width: representativeDimension(
      row.width_min,
      row.width_max,
      row.width_raw,
    ),
    length: representativeDimension(
      row.length_min,
      row.length_max,
      row.length_raw,
    ),
  };
}

function demandFromInput(input: MatchSearchInput): MatchDemand {
  return {
    product_category: input.product_category,
    steel_grade: input.steel_grade,
    thickness: input.thickness,
    width: input.width,
    length: input.length,
  };
}

function hasExplicitDemand(demand: MatchDemand): boolean {
  return Boolean(
    demand.product_category ||
      demand.steel_grade ||
      demand.thickness !== undefined ||
      demand.width !== undefined ||
      demand.length !== undefined,
  );
}

function buildDemandSummary(demands: MatchDemand[]): string {
  if (demands.length === 0) {
    return "No demand criteria specified";
  }

  if (demands.length === 1) {
    const demand = demands[0];
    const parts = [
      demand.product_category,
      demand.steel_grade,
      demand.thickness !== undefined ? `T${demand.thickness}` : null,
      demand.width !== undefined ? `W${demand.width}` : null,
      demand.length !== undefined ? `L${demand.length}` : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }

  return `${demands.length} customer product demand(s)`;
}

function dedupeResults(results: SupplierMatchResult[]): SupplierMatchResult[] {
  const bestByKey = new Map<string, SupplierMatchResult>();

  for (const result of results) {
    const key = `${result.supplier_id}:${result.product_id}`;
    const existing = bestByKey.get(key);
    if (!existing || result.score > existing.score) {
      bestByKey.set(key, result);
    }
  }

  return [...bestByKey.values()].sort((a, b) => b.score - a.score);
}

export async function searchMatches(
  input: MatchSearchInput,
): Promise<MatchSearchResponse> {
  let customer: CustomerMatchContext | null = null;
  if (input.customer_id) {
    customer = await matchingRepository.findCustomerForMatching(
      input.customer_id,
    );
    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }
  }

  const explicitDemand = demandFromInput(input);
  const demands: MatchDemand[] = [];

  if (hasExplicitDemand(explicitDemand)) {
    demands.push(explicitDemand);
  } else if (customer) {
    const customerProducts = await matchingRepository.findCustomerProducts(
      customer.id,
    );
    if (customerProducts.length === 0) {
      demands.push({});
    } else {
      demands.push(...customerProducts.map(demandFromCustomerProduct));
    }
  } else {
    demands.push({});
  }

  const candidates = await matchingRepository.findSupplierProductCandidates();
  const customerGeo = customer?.geo ?? null;
  const allResults: SupplierMatchResult[] = [];

  for (const demand of demands) {
    for (const candidate of candidates) {
      const result = scoreCandidate(demand, candidate, customerGeo);

      if (demand.product_category && result.score_breakdown.product_category === 0) {
        continue;
      }
      if (demand.steel_grade && result.score_breakdown.steel_grade === 0) {
        continue;
      }

      const requestedDimensions = DIMENSION_KEYS.filter(
        (key) => demand[key] !== undefined,
      );
      if (
        requestedDimensions.length > 0 &&
        result.score_breakdown.dimension === 0
      ) {
        continue;
      }

      allResults.push(result);
    }
  }

  const results = dedupeResults(allResults).slice(0, 100);

  return {
    customer_id: customer?.id ?? null,
    customer_name: customer?.company_name ?? null,
    demand_summary: buildDemandSummary(demands),
    results,
  };
}
