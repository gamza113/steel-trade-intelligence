import { z } from "zod";

const emptyToUndefined = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return value;
}, z.string().optional());

export const competitorAnalysisSchema = z.object({
  supplier_id: z.string().uuid(),
  product_category: emptyToUndefined.pipe(
    z.string().trim().max(200).optional(),
  ),
  steel_grade: emptyToUndefined.pipe(z.string().trim().max(100).optional()),
});

export type CompetitorAnalysisBody = z.infer<typeof competitorAnalysisSchema>;
