import type { Request, Response } from "express";
import type { MatchSearchBody } from "@stip/validation";
import { AppError } from "../../errors/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as matchingService from "./matching.service.js";

export const searchMatches = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as MatchSearchBody;

  try {
    const result = await matchingService.searchMatches(body);
    res.json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
      throw new AppError(404, "NOT_FOUND", "Customer not found");
    }
    throw error;
  }
});
