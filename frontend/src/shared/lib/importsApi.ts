import type { ImportSummary } from "@stip/shared-types";
import { getApiBaseUrl } from "./api";

export async function importExcelMaster(file: File): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/imports/excel`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Import failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        error?: { message?: string };
      };
      message = body.error?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as { data: ImportSummary };
  return payload.data;
}
