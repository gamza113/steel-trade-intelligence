import type { Request, Response } from "express";
import type { FreightEstimateBody } from "@stip/validation";
import { AppError } from "../../errors/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as freightService from "./freight.service.js";

export const estimateFreight = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as FreightEstimateBody;

  try {
    const result = await freightService.estimateFreight(body);
    res.json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "SUPPLIER_NOT_FOUND":
          throw new AppError(404, "NOT_FOUND", "Supplier company not found");
        case "SUPPLIER_INVALID_TYPE":
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            "supplier_company_id must reference a Supplier company",
          );
        case "CUSTOMER_NOT_FOUND":
          throw new AppError(404, "NOT_FOUND", "Customer company not found");
        case "CUSTOMER_INVALID_TYPE":
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            "customer_company_id must reference a Customer company",
          );
        default:
          break;
      }
    }
    throw error;
  }
});
