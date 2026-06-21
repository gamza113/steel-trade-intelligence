import type { Request, Response } from "express";
import type { CompetitorAnalysisBody } from "@stip/validation";
import { AppError } from "../../errors/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as competitorsService from "./competitors.service.js";

export const analyzeCompetitors = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CompetitorAnalysisBody;

    try {
      const result = await competitorsService.analyzeCompetitors(body);
      res.json({ data: result });
    } catch (error) {
      if (error instanceof Error && error.message === "SUPPLIER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Supplier not found");
      }
      throw error;
    }
  },
);
