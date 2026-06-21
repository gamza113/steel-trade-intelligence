import { Router } from "express";
import { competitorAnalysisSchema } from "@stip/validation";
import { validate } from "../../middleware/validate.js";
import * as competitorsController from "./competitors.controller.js";

export const competitorsRouter = Router();

competitorsRouter.post(
  "/analyze",
  validate({ body: competitorAnalysisSchema }),
  competitorsController.analyzeCompetitors,
);
