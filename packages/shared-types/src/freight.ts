export type VesselType =
  | "Handysize"
  | "Handymax"
  | "Supramax"
  | "Panamax"
  | "Capesize";

export interface FreightEstimateInput {
  supplier_company_id: string;
  customer_company_id: string;
  cargo_weight_mt: number;
  vessel_type: VesselType;
  vessel_speed_knots?: number;
  daily_fuel_consumption_mt?: number;
  bunker_price_usd_per_mt?: number;
  daily_charter_rate_usd?: number;
  port_charges_usd?: number;
}

export interface FreightEstimateResult {
  supplier_company_id: string;
  supplier_company_name: string;
  customer_company_id: string;
  customer_company_name: string;
  origin_port: string;
  destination_port: string;
  distance_nm: number;
  voyage_days: number;
  vessel_type: VesselType;
  vessel_speed_knots: number;
  daily_fuel_consumption_mt: number;
  bunker_price_usd_per_mt: number;
  daily_charter_rate_usd: number;
  bunker_cost_usd: number;
  charter_cost_usd: number;
  port_charges_usd: number;
  total_estimated_freight_usd: number;
  cargo_weight_mt: number;
  freight_per_mt_usd: number;
}
