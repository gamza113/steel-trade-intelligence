import type {
  ApiResponse,
  CompetitorAnalysisInput,
  CompetitorAnalysisResponse,
} from "@stip/shared-types";
import { apiFetch } from "./api";

export async function analyzeCompetitors(
  input: CompetitorAnalysisInput,
): Promise<CompetitorAnalysisResponse> {
  const response = await apiFetch<ApiResponse<CompetitorAnalysisResponse>>(
    "/competitors/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
