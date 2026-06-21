import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@stip/shared-types";
import { AppError, notFoundError } from "../../errors/AppError.js";
import { portExists } from "../ports/ports.repository.js";
import type { ListCompaniesFilters } from "./companies.types.js";
import * as companiesRepository from "./companies.repository.js";

async function validatePortId(portId: string | null | undefined): Promise<void> {
  if (portId && !(await portExists(portId))) {
    throw new AppError(400, "VALIDATION_ERROR", "port_id does not exist", [
      { field: "port_id", issue: "Referenced port does not exist" },
    ]);
  }
}

export async function listCompanies(filters: ListCompaniesFilters) {
  return companiesRepository.listCompanies(filters);
}

export async function getCompanyById(id: string) {
  const company = await companiesRepository.findCompanyById(id);
  if (!company) {
    throw notFoundError("Company");
  }
  return company;
}

export async function createCompany(input: CreateCompanyInput) {
  await validatePortId(input.port_id);
  return companiesRepository.createCompany(input);
}

export async function updateCompany(id: string, input: UpdateCompanyInput) {
  await validatePortId(input.port_id);
  const company = await companiesRepository.updateCompany(id, input);
  if (!company) {
    throw notFoundError("Company");
  }
  return company;
}

export async function deleteCompany(id: string) {
  const deleted = await companiesRepository.deleteCompany(id);
  if (!deleted) {
    throw notFoundError("Company");
  }
}
