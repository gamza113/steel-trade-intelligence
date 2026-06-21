import type { DimensionType } from "@stip/shared-types";

export interface GeoPoint {
  latitude: number | null;
  longitude: number | null;
}

export interface CustomerMatchContext {
  id: string;
  company_name: string;
  geo: GeoPoint;
}

export interface SupplierProductCandidateRow {
  supplier_id: string;
  supplier_name: string;
  country: string | null;
  port_name: string | null;
  company_latitude: number | null;
  company_longitude: number | null;
  port_latitude: number | null;
  port_longitude: number | null;
  supplier_remarks: string | null;
  product_id: string;
  product_category: string;
  steel_grade: string;
  thickness_min: string | null;
  thickness_max: string | null;
  width_min: string | null;
  width_max: string | null;
  length_min: string | null;
  length_max: string | null;
  thickness_raw: string | null;
  width_raw: string | null;
  length_raw: string | null;
  product_remarks: string | null;
}

export interface SupplierProductCandidate {
  supplier_id: string;
  supplier_name: string;
  country: string | null;
  port_name: string | null;
  geo: GeoPoint;
  supplier_remarks: string | null;
  product_id: string;
  product_category: string;
  steel_grade: string;
  thickness_min: number | null;
  thickness_max: number | null;
  width_min: number | null;
  width_max: number | null;
  length_min: number | null;
  length_max: number | null;
  thickness_raw: string | null;
  width_raw: string | null;
  length_raw: string | null;
  product_remarks: string | null;
  dimension_options: Array<{ dimension_type: DimensionType; value: number }>;
}

export interface CustomerProductDemandRow {
  product_category: string;
  steel_grade: string;
  thickness_min: string | null;
  thickness_max: string | null;
  width_min: string | null;
  width_max: string | null;
  length_min: string | null;
  length_max: string | null;
  thickness_raw: string | null;
  width_raw: string | null;
  length_raw: string | null;
}

export interface MatchDemand {
  product_category?: string;
  steel_grade?: string;
  thickness?: number;
  width?: number;
  length?: number;
}
