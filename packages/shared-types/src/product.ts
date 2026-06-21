import type { ProductDimensionOption } from "./product-dimension.js";

export interface Product {
  id: string;
  company_id: string;
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
  remarks: string | null;
  dimension_options: ProductDimensionOption[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  company_id: string;
  product_category: string;
  steel_grade: string;
  thickness_min?: number | null;
  thickness_max?: number | null;
  width_min?: number | null;
  width_max?: number | null;
  length_min?: number | null;
  length_max?: number | null;
}

export interface UpdateProductInput {
  company_id?: string;
  product_category?: string;
  steel_grade?: string;
  thickness_min?: number | null;
  thickness_max?: number | null;
  width_min?: number | null;
  width_max?: number | null;
  length_min?: number | null;
  length_max?: number | null;
}
