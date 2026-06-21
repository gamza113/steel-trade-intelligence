import { Router } from "express";
import { freightEstimateSchema } from "@stip/validation";
import { validate } from "../../middleware/validate.js";
import * as freightController from "./freight.controller.js";

export const freightRouter = Router();

freightRouter.post(
  "/estimate",
  validate({ body: freightEstimateSchema }),
  freightController.estimateFreight,
);
