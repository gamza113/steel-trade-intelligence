import type {
  CompetitorAnalysisInput,
  CompetitorAnalysisResponse,
  CompetitorAnalysisResult,
  CompetitorSimilarityBreakdown,
  DimensionOverlapDetail,
} from "@stip/shared-types";
import {
  isSizeAgnosticRaw,
  optionsFromStoredDimension,
} from "../../utils/dimensionParser.js";
import type {
  GeoPoint,
  SupplierContext,
  SupplierProductProfile,
} from "./competitors.types.js";
import * as competitorsRepository from "./competitors.repository.js";

const WEIGHTS = {
  product_category: 0.3,
  steel_grade: 0.25,
  dimension_overlap: 0.3,
  geographic: 0.1,
  remarks: 0.05,
};

const MAX_GEO_DISTANCE_KM = 12000;

type DimensionKey = "thickness" | "width" | "length";

const DIMENSION_KEYS: DimensionKey[] = ["thickness", "width", "length"];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function textSimilarityScore(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (left === right) {
    return 1;
  }

  if (left.includes(right) || right.includes(left)) {
    return 0.75;
  }

  const leftTokens = left.split(/[\s,/+-]+/).filter(Boolean);
  const matchedTokens = leftTokens.filter((token) => right.includes(token));
  if (leftTokens.length > 0 && matchedTokens.length > 0) {
    return 0.5 * (matchedTokens.length / leftTokens.length);
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

function geographicSimilarity(
  referenceGeo: GeoPoint,
  competitorGeo: GeoPoint,
): number {
  const refLat = referenceGeo.latitude;
  const refLon = referenceGeo.longitude;
  const compLat = competitorGeo.latitude;
  const compLon = competitorGeo.longitude;

  if (
    refLat === null ||
    refLon === null ||
    compLat === null ||
    compLon === null
  ) {
    return 0.5;
  }

  const distance = haversineKm(refLat, refLon, compLat, compLon);
  return Math.max(0, 1 - distance / MAX_GEO_DISTANCE_KM);
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function getDimensionValues(
  product: SupplierProductProfile,
  dimensionType: DimensionKey,
): number[] {
  const rawKey = `${dimensionType}_raw` as const;
  const minKey = `${dimensionType}_min` as const;
  const maxKey = `${dimensionType}_max` as const;

  const options = product.dimension_options
    .filter((option) => option.dimension_type === dimensionType)
    .map((option) => option.value);

  if (options.length > 0) {
    return uniqueSorted(options);
  }

  return optionsFromStoredDimension(
    product[minKey],
    product[maxKey],
    product[rawKey],
  );
}

function isDimensionFlexible(
  product: SupplierProductProfile,
  dimensionType: DimensionKey,
): boolean {
  const rawKey = `${dimensionType}_raw` as const;
  return isSizeAgnosticRaw(product[rawKey]);
}

function rangeBounds(values: number[]): { lower: number; upper: number } | null {
  if (values.length === 0) {
    return null;
  }
  return {
    lower: Math.min(...values),
    upper: Math.max(...values),
  };
}

function intervalOverlapScore(
  left: { lower: number; upper: number },
  right: { lower: number; upper: number },
): number {
  const intersection = Math.max(
    0,
    Math.min(left.upper, right.upper) - Math.max(left.lower, right.lower),
  );
  const unionSpan =
    Math.max(left.upper, right.upper) - Math.min(left.lower, right.lower);

  if (unionSpan <= 0) {
    return left.lower === right.lower ? 1 : 0;
  }

  return intersection / unionSpan;
}

function setOverlapScore(left: number[], right: number[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((value) => rightSet.has(value));
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.length / union.size;
}

function valuesInRangeScore(values: number[], range: { lower: number; upper: number }): number {
  if (values.length === 0) {
    return 0;
  }

  const matches = values.filter(
    (value) => value >= range.lower && value <= range.upper,
  );
  return matches.length / values.length;
}

function compareDimensionOverlap(
  reference: SupplierProductProfile,
  competitor: SupplierProductProfile,
  dimensionType: DimensionKey,
): DimensionOverlapDetail {
  const referenceFlexible = isDimensionFlexible(reference, dimensionType);
  const competitorFlexible = isDimensionFlexible(competitor, dimensionType);

  if (referenceFlexible || competitorFlexible) {
    return {
      dimension_type: dimensionType,
      overlap_score: 1,
      reference_values: getDimensionValues(reference, dimensionType),
      competitor_values: getDimensionValues(competitor, dimensionType),
      overlapping_values: [],
    };
  }

  const referenceValues = getDimensionValues(reference, dimensionType);
  const competitorValues = getDimensionValues(competitor, dimensionType);
  const referenceRange = rangeBounds(referenceValues);
  const competitorRange = rangeBounds(competitorValues);

  let overlapScore = 0;
  let overlappingValues: number[] = [];

  if (referenceValues.length > 0 && competitorValues.length > 0) {
    overlappingValues = referenceValues.filter((value) =>
      competitorValues.includes(value),
    );
    overlapScore = setOverlapScore(referenceValues, competitorValues);
  } else if (referenceRange && competitorRange) {
    overlapScore = intervalOverlapScore(referenceRange, competitorRange);
    overlappingValues = overlappingValues;
  } else if (referenceRange && competitorValues.length > 0) {
    overlapScore = valuesInRangeScore(competitorValues, referenceRange);
    overlappingValues = competitorValues.filter(
      (value) =>
        value >= referenceRange.lower && value <= referenceRange.upper,
    );
  } else if (competitorRange && referenceValues.length > 0) {
    overlapScore = valuesInRangeScore(referenceValues, competitorRange);
    overlappingValues = referenceValues.filter(
      (value) =>
        value >= competitorRange.lower && value <= competitorRange.upper,
    );
  }

  return {
    dimension_type: dimensionType,
    overlap_score: overlapScore,
    reference_values: referenceValues,
    competitor_values: competitorValues,
    overlapping_values: uniqueSorted(overlappingValues),
  };
}

function aggregateDimensionOverlap(
  details: DimensionOverlapDetail[],
): number {
  const scored = details.filter(
    (detail) =>
      detail.reference_values.length > 0 ||
      detail.competitor_values.length > 0 ||
      detail.overlap_score === 1,
  );

  if (scored.length === 0) {
    return 0.5;
  }

  const total = scored.reduce((sum, detail) => sum + detail.overlap_score, 0);
  return total / scored.length;
}

function remarksSimilarity(
  reference: SupplierProductProfile,
  competitor: SupplierProductProfile,
  referenceSupplier: SupplierContext,
): number {
  const referenceText = [
    referenceSupplier.remarks,
    reference.supplier_remarks,
    reference.product_remarks,
    reference.product_category,
    reference.steel_grade,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const competitorText = [
    competitor.supplier_remarks,
    competitor.product_remarks,
    competitor.product_category,
    competitor.steel_grade,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!referenceText || !competitorText) {
    return 0;
  }

  const tokens = referenceText.split(/[\s,;/+-]+/).filter((token) => token.length > 2);
  if (tokens.length === 0) {
    return 0;
  }

  const matched = tokens.filter((token) => competitorText.includes(token));
  return matched.length / tokens.length;
}

function formatProductSimilarity(
  categoryScore: number,
  gradeScore: number,
  reference: SupplierProductProfile,
  competitor: SupplierProductProfile,
): string {
  return `Category ${Math.round(categoryScore * 100)}% (${reference.product_category} ↔ ${competitor.product_category}) · Grade ${Math.round(gradeScore * 100)}% (${reference.steel_grade} ↔ ${competitor.steel_grade})`;
}

function formatDimensionOverlap(details: DimensionOverlapDetail[]): string {
  return details
    .map((detail) => {
      if (detail.overlapping_values.length > 0) {
        return `${detail.dimension_type}: ${detail.overlapping_values.join(", ")}`;
      }
      if (detail.overlap_score === 1 && detail.reference_values.length === 0) {
        return `${detail.dimension_type}: flexible`;
      }
      return `${detail.dimension_type}: ${Math.round(detail.overlap_score * 100)}%`;
    })
    .join(" · ");
}

function buildReason(
  breakdown: CompetitorSimilarityBreakdown,
  dimensionDetails: DimensionOverlapDetail[],
): string {
  const parts = [
    `Category ${Math.round(breakdown.product_category * 100)}%`,
    `Grade ${Math.round(breakdown.steel_grade * 100)}%`,
    formatDimensionOverlap(dimensionDetails),
    `Geo ${Math.round(breakdown.geographic * 100)}%`,
  ];

  if (breakdown.remarks > 0) {
    parts.push(`Remarks ${Math.round(breakdown.remarks * 100)}%`);
  }

  return parts.join(" · ");
}

function scoreProductPair(
  reference: SupplierProductProfile,
  competitor: SupplierProductProfile,
  referenceSupplier: SupplierContext,
): CompetitorAnalysisResult {
  const categoryScore = textSimilarityScore(
    reference.product_category,
    competitor.product_category,
  );
  const gradeScore = textSimilarityScore(
    reference.steel_grade,
    competitor.steel_grade,
  );
  const dimensionDetails = DIMENSION_KEYS.map((key) =>
    compareDimensionOverlap(reference, competitor, key),
  );
  const dimensionScore = aggregateDimensionOverlap(dimensionDetails);
  const geoScore = geographicSimilarity(referenceSupplier.geo, competitor.geo);
  const remarksScore = remarksSimilarity(
    reference,
    competitor,
    referenceSupplier,
  );

  const breakdown: CompetitorSimilarityBreakdown = {
    product_category: categoryScore,
    steel_grade: gradeScore,
    dimension_overlap: dimensionScore,
    geographic: geoScore,
    remarks: remarksScore,
    total:
      categoryScore * WEIGHTS.product_category +
      gradeScore * WEIGHTS.steel_grade +
      dimensionScore * WEIGHTS.dimension_overlap +
      geoScore * WEIGHTS.geographic +
      remarksScore * WEIGHTS.remarks,
  };

  return {
    competitor_id: competitor.supplier_id,
    competitor_name: competitor.supplier_name,
    country: competitor.country,
    port_name: competitor.port_name,
    reference_product_id: reference.product_id,
    reference_product_category: reference.product_category,
    reference_steel_grade: reference.steel_grade,
    competitor_product_id: competitor.product_id,
    competitor_product_category: competitor.product_category,
    competitor_steel_grade: competitor.steel_grade,
    product_similarity: formatProductSimilarity(
      categoryScore,
      gradeScore,
      reference,
      competitor,
    ),
    dimension_overlap: dimensionDetails,
    dimension_overlap_score: dimensionScore,
    score: Math.round(breakdown.total * 1000) / 1000,
    score_breakdown: {
      ...breakdown,
      total: Math.round(breakdown.total * 1000) / 1000,
    },
    reason: buildReason(breakdown, dimensionDetails),
  };
}

function buildAnalysisSummary(
  supplierName: string,
  referenceCount: number,
  filters: CompetitorAnalysisInput,
): string {
  const parts = [`Supplier: ${supplierName}`, `${referenceCount} reference product(s)`];

  if (filters.product_category) {
    parts.push(`category filter: ${filters.product_category}`);
  }

  if (filters.steel_grade) {
    parts.push(`grade filter: ${filters.steel_grade}`);
  }

  return parts.join(" · ");
}

function dedupeByCompetitor(
  results: CompetitorAnalysisResult[],
): CompetitorAnalysisResult[] {
  const bestByCompetitor = new Map<string, CompetitorAnalysisResult>();

  for (const result of results) {
    const existing = bestByCompetitor.get(result.competitor_id);
    if (!existing || result.score > existing.score) {
      bestByCompetitor.set(result.competitor_id, result);
    }
  }

  return [...bestByCompetitor.values()].sort((a, b) => b.score - a.score);
}

export async function analyzeCompetitors(
  input: CompetitorAnalysisInput,
): Promise<CompetitorAnalysisResponse> {
  const supplier = await competitorsRepository.findSupplierContext(
    input.supplier_id,
  );
  if (!supplier) {
    throw new Error("SUPPLIER_NOT_FOUND");
  }

  const referenceProducts = await competitorsRepository.findSupplierProducts(
    input.supplier_id,
    {
      product_category: input.product_category,
      steel_grade: input.steel_grade,
    },
  );

  if (referenceProducts.length === 0) {
    return {
      supplier_id: supplier.id,
      supplier_name: supplier.company_name,
      analysis_summary: buildAnalysisSummary(
        supplier.company_name,
        0,
        input,
      ),
      results: [],
    };
  }

  const competitorProducts =
    await competitorsRepository.findOtherSupplierProducts(input.supplier_id);

  const pairResults: CompetitorAnalysisResult[] = [];

  for (const reference of referenceProducts) {
    for (const competitor of competitorProducts) {
      const result = scoreProductPair(reference, competitor, supplier);

      if (result.score_breakdown.product_category === 0 && result.score_breakdown.steel_grade === 0) {
        continue;
      }

      pairResults.push(result);
    }
  }

  const results = dedupeByCompetitor(pairResults).slice(0, 100);

  return {
    supplier_id: supplier.id,
    supplier_name: supplier.company_name,
    analysis_summary: buildAnalysisSummary(
      supplier.company_name,
      referenceProducts.length,
      input,
    ),
    results,
  };
}
