import { z } from "zod";

// Shared Zod schemas — to be expanded during implementation

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export {
  companyTypeSchema,
  createCompanySchema,
  updateCompanySchema,
  companyIdParamSchema,
  listCompaniesQuerySchema,
} from "./company.js";
export type {
  CreateCompanyBody,
  UpdateCompanyBody,
  ListCompaniesQuery,
} from "./company.js";

export {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  listProductsQuerySchema,
} from "./product.js";
export type {
  CreateProductBody,
  UpdateProductBody,
  ListProductsQuery,
} from "./product.js";

export { createPortSchema, updatePortSchema, portIdParamSchema, listPortsQuerySchema } from "./port.js";
export type { CreatePortBody, UpdatePortBody, ListPortsQuery } from "./port.js";

export { matchSearchSchema } from "./matching.js";
export type { MatchSearchBody } from "./matching.js";

export { competitorAnalysisSchema } from "./competitor.js";
export type { CompetitorAnalysisBody } from "./competitor.js";

export { freightEstimateSchema, vesselTypeSchema } from "./freight.js";
export type { FreightEstimateBody } from "./freight.js";
