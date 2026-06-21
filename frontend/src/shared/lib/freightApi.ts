import type {
  ApiResponse,
  FreightEstimateInput,
  FreightEstimateResult,
} from "@stip/shared-types";
import { apiFetch } from "./api";

export async function estimateFreight(
  input: FreightEstimateInput,
): Promise<FreightEstimateResult> {
  const response = await apiFetch<ApiResponse<FreightEstimateResult>>(
    "/freight/estimate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
