import { z } from "zod";

const optionalDimension = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().min(0).optional(),
);

const emptyToUndefined = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return value;
}, z.string().optional());

export const matchSearchSchema = z.object({
  customer_id: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional(),
  ),
  product_category: emptyToUndefined.pipe(z.string().trim().max(200).optional()),
  steel_grade: emptyToUndefined.pipe(z.string().trim().max(100).optional()),
  thickness: optionalDimension,
  width: optionalDimension,
  length: optionalDimension,
});

export type MatchSearchBody = z.infer<typeof matchSearchSchema>;
