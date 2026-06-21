import { z } from "zod";

export const vesselTypeSchema = z.enum([
  "Handysize",
  "Handymax",
  "Supramax",
  "Panamax",
  "Capesize",
]);

const optionalPositiveNumber = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().positive().optional(),
);

export const freightEstimateSchema = z.object({
  supplier_company_id: z.string().uuid(),
  customer_company_id: z.string().uuid(),
  cargo_weight_mt: z.coerce.number().positive(),
  vessel_type: vesselTypeSchema,
  vessel_speed_knots: optionalPositiveNumber,
  daily_fuel_consumption_mt: optionalPositiveNumber,
  bunker_price_usd_per_mt: optionalPositiveNumber,
  daily_charter_rate_usd: optionalPositiveNumber,
  port_charges_usd: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().min(0).optional(),
  ),
});

export type FreightEstimateBody = z.infer<typeof freightEstimateSchema>;
