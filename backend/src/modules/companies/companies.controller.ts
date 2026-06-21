import type { Request, Response } from "express";
import type {
  CreateCompanyBody,
  ListCompaniesQuery,
  UpdateCompanyBody,
} from "@stip/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as companiesService from "./companies.service.js";

export const listCompanies = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListCompaniesQuery;
  const { items, total } = await companiesService.listCompanies(query);

  res.json({
    data: items,
    pagination: {
      hasMore: query.offset + items.length < total,
      total,
    },
  });
});

export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await companiesService.getCompanyById(String(req.params.id));
  res.json({ data: company });
});

export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateCompanyBody;
  const company = await companiesService.createCompany(body);
  res.status(201).json({ data: company });
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateCompanyBody;
  const company = await companiesService.updateCompany(String(req.params.id), body);
  res.json({ data: company });
});

export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  await companiesService.deleteCompany(String(req.params.id));
  res.status(204).send();
});
