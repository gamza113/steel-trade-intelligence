export type DimensionType = "thickness" | "width" | "length";

export interface ProductDimensionOption {
  id: string;
  product_id: string;
  dimension_type: DimensionType;
  value: number;
  created_at: string;
}
