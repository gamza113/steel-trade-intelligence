import type {
  FreightEstimateInput,
  FreightEstimateResult,
  VesselType,
} from "@stip/shared-types";
import * as freightRepository from "./freight.repository.js";

const EARTH_RADIUS_NM = 3440.065;
const SEA_ROUTE_FACTOR = 1.08;

const VESSEL_DEFAULTS: Record<
  VesselType,
  {
    vessel_speed_knots: number;
    daily_fuel_consumption_mt: number;
    daily_charter_rate_usd: number;
  }
> = {
  Handysize: {
    vessel_speed_knots: 12,
    daily_fuel_consumption_mt: 15,
    daily_charter_rate_usd: 8000,
  },
  Handymax: {
    vessel_speed_knots: 13,
    daily_fuel_consumption_mt: 20,
    daily_charter_rate_usd: 10000,
  },
  Supramax: {
    vessel_speed_knots: 13,
    daily_fuel_consumption_mt: 25,
    daily_charter_rate_usd: 12000,
  },
  Panamax: {
    vessel_speed_knots: 14,
    daily_fuel_consumption_mt: 35,
    daily_charter_rate_usd: 15000,
  },
  Capesize: {
    vessel_speed_knots: 14,
    daily_fuel_consumption_mt: 55,
    daily_charter_rate_usd: 22000,
  },
};

const DEFAULT_BUNKER_PRICE_USD_PER_MT = 550;
const DEFAULT_PORT_CHARGES_USD = 35000;

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function haversineNm(
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
  const greatCircleNm = EARTH_RADIUS_NM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return greatCircleNm * SEA_ROUTE_FACTOR;
}

function resolveParameters(input: FreightEstimateInput) {
  const defaults = VESSEL_DEFAULTS[input.vessel_type];

  return {
    vessel_speed_knots:
      input.vessel_speed_knots ?? defaults.vessel_speed_knots,
    daily_fuel_consumption_mt:
      input.daily_fuel_consumption_mt ?? defaults.daily_fuel_consumption_mt,
    bunker_price_usd_per_mt:
      input.bunker_price_usd_per_mt ?? DEFAULT_BUNKER_PRICE_USD_PER_MT,
    daily_charter_rate_usd:
      input.daily_charter_rate_usd ?? defaults.daily_charter_rate_usd,
    port_charges_usd: input.port_charges_usd ?? DEFAULT_PORT_CHARGES_USD,
  };
}

export async function estimateFreight(
  input: FreightEstimateInput,
): Promise<FreightEstimateResult> {
  const supplier = await freightRepository.findCompanyPortLocation(
    input.supplier_company_id,
  );
  if (!supplier) {
    throw new Error("SUPPLIER_NOT_FOUND");
  }
  if (supplier.company_type !== "Supplier") {
    throw new Error("SUPPLIER_INVALID_TYPE");
  }

  const customer = await freightRepository.findCompanyPortLocation(
    input.customer_company_id,
  );
  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }
  if (customer.company_type !== "Customer") {
    throw new Error("CUSTOMER_INVALID_TYPE");
  }

  const params = resolveParameters(input);

  const distanceNm = haversineNm(
    supplier.latitude,
    supplier.longitude,
    customer.latitude,
    customer.longitude,
  );
  const voyageDays = distanceNm / params.vessel_speed_knots / 24;
  const bunkerCostUsd =
    voyageDays * params.daily_fuel_consumption_mt * params.bunker_price_usd_per_mt;
  const charterCostUsd = voyageDays * params.daily_charter_rate_usd;
  const totalEstimatedFreightUsd =
    bunkerCostUsd + charterCostUsd + params.port_charges_usd;
  const freightPerMtUsd = totalEstimatedFreightUsd / input.cargo_weight_mt;

  return {
    supplier_company_id: supplier.company_id,
    supplier_company_name: supplier.company_name,
    customer_company_id: customer.company_id,
    customer_company_name: customer.company_name,
    origin_port: supplier.port_name,
    destination_port: customer.port_name,
    distance_nm: round(distanceNm, 1),
    voyage_days: round(voyageDays, 2),
    vessel_type: input.vessel_type,
    vessel_speed_knots: params.vessel_speed_knots,
    daily_fuel_consumption_mt: params.daily_fuel_consumption_mt,
    bunker_price_usd_per_mt: params.bunker_price_usd_per_mt,
    daily_charter_rate_usd: params.daily_charter_rate_usd,
    bunker_cost_usd: round(bunkerCostUsd, 2),
    charter_cost_usd: round(charterCostUsd, 2),
    port_charges_usd: round(params.port_charges_usd, 2),
    total_estimated_freight_usd: round(totalEstimatedFreightUsd, 2),
    cargo_weight_mt: input.cargo_weight_mt,
    freight_per_mt_usd: round(freightPerMtUsd, 2),
  };
}
