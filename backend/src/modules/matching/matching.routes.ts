import { Router } from "express";
import { matchSearchSchema } from "@stip/validation";
import { validate } from "../../middleware/validate.js";
import * as matchingController from "./matching.controller.js";

export const matchingRouter = Router();

matchingRouter.post(
  "/search",
  validate({ body: matchSearchSchema }),
  matchingController.searchMatches,
);
