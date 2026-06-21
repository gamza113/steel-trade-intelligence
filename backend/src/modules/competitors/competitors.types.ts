import type { DimensionType } from "@stip/shared-types";

export interface GeoPoint {
  latitude: number | null;
  longitude: number | null;
}

export interface SupplierContext {
  id: string;
  company_name: string;
  country: string | null;
  port_name: string | null;
  geo: GeoPoint;
  remarks: string | null;
}

export interface SupplierProductRow {
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

export interface SupplierProductProfile {
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

export interface ProductFilter {
  product_category?: string;
  steel_grade?: string;
}
