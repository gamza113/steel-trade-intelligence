export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "trader"
  | "analyst"
  | "viewer";

export type SubscriptionTier = "starter" | "professional" | "enterprise";

export type {
  Company,
  CompanyType,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "./company.js";
export type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "./product.js";
export type {
  DimensionType,
  ProductDimensionOption,
} from "./product-dimension.js";
export type {
  Port,
  CreatePortInput,
  UpdatePortInput,
} from "./port.js";
export type {
  ImportSummary,
  ImportFailedRow,
} from "./import.js";
export type {
  DimensionMatchType,
  MatchedDimensionDetail,
  MatchScoreBreakdown,
  SupplierMatchResult,
  MatchSearchInput,
  MatchSearchResponse,
} from "./matching.js";
export type {
  CompetitorSimilarityBreakdown,
  DimensionOverlapDetail,
  CompetitorAnalysisResult,
  CompetitorAnalysisInput,
  CompetitorAnalysisResponse,
} from "./competitor.js";
export type {
  VesselType,
  FreightEstimateInput,
  FreightEstimateResult,
} from "./freight.js";
