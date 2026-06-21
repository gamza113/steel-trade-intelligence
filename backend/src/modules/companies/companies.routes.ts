import { Router } from "express";
import {
  companyIdParamSchema,
  createCompanySchema,
  listCompaniesQuerySchema,
  updateCompanySchema,
} from "@stip/validation";
import { validate } from "../../middleware/validate.js";
import * as companiesController from "./companies.controller.js";

export const companiesRouter = Router();

companiesRouter.get(
  "/",
  validate({ query: listCompaniesQuerySchema }),
  companiesController.listCompanies,
);

companiesRouter.get(
  "/:id",
  validate({ params: companyIdParamSchema }),
  companiesController.getCompany,
);

companiesRouter.post(
  "/",
  validate({ body: createCompanySchema }),
  companiesController.createCompany,
);

companiesRouter.put(
  "/:id",
  validate({ params: companyIdParamSchema, body: updateCompanySchema }),
  companiesController.updateCompany,
);

companiesRouter.delete(
  "/:id",
  validate({ params: companyIdParamSchema }),
  companiesController.deleteCompany,
);
