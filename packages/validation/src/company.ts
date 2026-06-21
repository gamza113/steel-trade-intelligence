import { z } from "zod";

export const companyTypeSchema = z.enum(["Supplier", "Customer"]);

const optionalText = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().trim().min(1).nullable().optional(),
);
const optionalUrl = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().trim().url().nullable().optional(),
);
const optionalRemarks = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().trim().nullable().optional(),
);
const latitudeSchema = z
  .number()
  .min(-90)
  .max(90)
  .optional()
  .nullable();
const longitudeSchema = z
  .number()
  .min(-180)
  .max(180)
  .optional()
  .nullable();

const optionalPortId = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().uuid().nullable().optional(),
);

export const createCompanySchema = z.object({
  company_name: z.string().trim().min(1).max(500),
  company_type: companyTypeSchema,
  country: optionalText,
  city: optionalText,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  port_id: optionalPortId,
  port_name: optionalText,
  website: optionalUrl,
  remarks: optionalRemarks,
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listCompaniesQuerySchema = z.object({
  company_type: companyTypeSchema.optional(),
  country: z.string().trim().min(1).optional(),
  port_id: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateCompanyBody = z.infer<typeof createCompanySchema>;
export type UpdateCompanyBody = z.infer<typeof updateCompanySchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
