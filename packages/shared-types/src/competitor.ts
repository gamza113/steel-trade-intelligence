export interface CompetitorSimilarityBreakdown {
  product_category: number;
  steel_grade: number;
  dimension_overlap: number;
  geographic: number;
  remarks: number;
  total: number;
}

export interface DimensionOverlapDetail {
  dimension_type: "thickness" | "width" | "length";
  overlap_score: number;
  reference_values: number[];
  competitor_values: number[];
  overlapping_values: number[];
}

export interface CompetitorAnalysisResult {
  competitor_id: string;
  competitor_name: string;
  country: string | null;
  port_name: string | null;
  reference_product_id: string;
  reference_product_category: string;
  reference_steel_grade: string;
  competitor_product_id: string;
  competitor_product_category: string;
  competitor_steel_grade: string;
  product_similarity: string;
  dimension_overlap: DimensionOverlapDetail[];
  dimension_overlap_score: number;
  score: number;
  score_breakdown: CompetitorSimilarityBreakdown;
  reason: string;
}

export interface CompetitorAnalysisInput {
  supplier_id: string;
  product_category?: string;
  steel_grade?: string;
}

export interface CompetitorAnalysisResponse {
  supplier_id: string;
  supplier_name: string;
  analysis_summary: string;
  results: CompetitorAnalysisResult[];
}
