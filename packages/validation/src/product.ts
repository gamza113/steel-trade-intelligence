import { z } from "zod";

const dimensionSchema = z.number().min(0).optional().nullable();

function rangeRefine(
  minKey: "thickness_min" | "width_min" | "length_min",
  maxKey: "thickness_max" | "width_max" | "length_max",
) {
  return (data: Record<string, unknown>) => {
    const min = data[minKey];
    const max = data[maxKey];
    if (
      min != null &&
      max != null &&
      typeof min === "number" &&
      typeof max === "number" &&
      min > max
    ) {
      return false;
    }
    return true;
  };
}

const productDimensionsBase = {
  thickness_min: dimensionSchema,
  thickness_max: dimensionSchema,
  width_min: dimensionSchema,
  width_max: dimensionSchema,
  length_min: dimensionSchema,
  length_max: dimensionSchema,
};

export const createProductSchema = z
  .object({
    company_id: z.string().uuid(),
    product_category: z.string().trim().min(1).max(200),
    steel_grade: z.string().trim().min(1).max(100),
    ...productDimensionsBase,
  })
  .refine(rangeRefine("thickness_min", "thickness_max"), {
    message: "thickness_min must be less than or equal to thickness_max",
    path: ["thickness_min"],
  })
  .refine(rangeRefine("width_min", "width_max"), {
    message: "width_min must be less than or equal to width_max",
    path: ["width_min"],
  })
  .refine(rangeRefine("length_min", "length_max"), {
    message: "length_min must be less than or equal to length_max",
    path: ["length_min"],
  });

export const updateProductSchema = z
  .object({
    company_id: z.string().uuid().optional(),
    product_category: z.string().trim().min(1).max(200).optional(),
    steel_grade: z.string().trim().min(1).max(100).optional(),
    ...productDimensionsBase,
  })
  .refine(rangeRefine("thickness_min", "thickness_max"), {
    message: "thickness_min must be less than or equal to thickness_max",
    path: ["thickness_min"],
  })
  .refine(rangeRefine("width_min", "width_max"), {
    message: "width_min must be less than or equal to width_max",
    path: ["width_min"],
  })
  .refine(rangeRefine("length_min", "length_max"), {
    message: "length_min must be less than or equal to length_max",
    path: ["length_min"],
  });

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listProductsQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  product_category: z.string().trim().min(1).optional(),
  steel_grade: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
