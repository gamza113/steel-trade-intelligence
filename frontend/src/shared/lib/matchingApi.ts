import type { ApiResponse, MatchSearchInput, MatchSearchResponse } from "@stip/shared-types";
import { apiFetch } from "./api";

export async function searchSupplierMatches(
  input: MatchSearchInput,
): Promise<MatchSearchResponse> {
  const response = await apiFetch<ApiResponse<MatchSearchResponse>>(
    "/matching/search",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
