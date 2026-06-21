import type { Company, PaginatedResponse } from "@stip/shared-types";
import { apiFetch } from "./api";

export interface CompanyListFilters {
  country?: string;
  search?: string;
}

export async function fetchAllCompanies(
  filters: CompanyListFilters = {},
): Promise<Company[]> {
  const companies: Company[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    if (filters.country) {
      params.set("country", filters.country);
    }

    if (filters.search) {
      params.set("search", filters.search);
    }

    const response = await apiFetch<PaginatedResponse<Company>>(
      `/companies?${params.toString()}`,
    );

    companies.push(...response.data);
    hasMore = response.pagination.hasMore;
    offset += limit;
  }

  return companies;
}
