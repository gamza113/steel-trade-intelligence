import type { ApiResponse, ImportSummary } from "@stip/shared-types";
import { apiUpload } from "./api";

export async function importExcelMaster(file: File): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiUpload<ApiResponse<ImportSummary>>(
    "/imports/excel",
    formData,
  );
  return response.data;
}
