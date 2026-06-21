import { z } from "zod";

const optionalText = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().trim().min(1).nullable().optional(),
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
const unLocodeSchema = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{2}[A-Z0-9]{3}$/,
      "un_locode must be a 5-character UN/LOCODE (e.g. DEHAM)",
    )
    .nullable()
    .optional(),
);

export const createPortSchema = z.object({
  port_name: z.string().trim().min(1).max(500),
  country: optionalText,
  city: optionalText,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  un_locode: unLocodeSchema,
  remarks: optionalRemarks,
});

export const updatePortSchema = createPortSchema.partial();

export const portIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listPortsQuerySchema = z.object({
  country: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreatePortBody = z.infer<typeof createPortSchema>;
export type UpdatePortBody = z.infer<typeof updatePortSchema>;
export type ListPortsQuery = z.infer<typeof listPortsQuerySchema>;
