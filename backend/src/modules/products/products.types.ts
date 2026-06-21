import type { Product } from "@stip/shared-types";

export interface ProductRow {
  id: string;
  company_id: string;
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
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ListProductsFilters {
  company_id?: string;
  product_category?: string;
  steel_grade?: string;
  limit: number;
  offset: number;
}

export interface ListProductsResult {
  items: Product[];
  total: number;
}
