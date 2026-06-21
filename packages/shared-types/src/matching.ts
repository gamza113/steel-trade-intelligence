export type DimensionMatchType =
  | "exact"
  | "nearest"
  | "range"
  | "flexible"
  | "no_match"
  | "not_requested";

export interface MatchedDimensionDetail {
  dimension_type: "thickness" | "width" | "length";
  requested: number | null;
  matched_value: number | null;
  match_type: DimensionMatchType;
  score: number;
}

export interface MatchScoreBreakdown {
  dimension: number;
  steel_grade: number;
  product_category: number;
  geographic: number;
  remarks: number;
  total: number;
}

export interface SupplierMatchResult {
  supplier_id: string;
  supplier_name: string;
  country: string | null;
  port_name: string | null;
  product_id: string;
  product_category: string;
  steel_grade: string;
  matched_dimensions: MatchedDimensionDetail[];
  score: number;
  score_breakdown: MatchScoreBreakdown;
  reason: string;
}

export interface MatchSearchInput {
  customer_id?: string;
  product_category?: string;
  steel_grade?: string;
  thickness?: number;
  width?: number;
  length?: number;
}

export interface MatchSearchResponse {
  customer_id: string | null;
  customer_name: string | null;
  demand_summary: string;
  results: SupplierMatchResult[];
}
