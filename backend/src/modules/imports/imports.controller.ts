import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseExcelMaster } from "./excelMaster.parser.js";
import * as importsService from "./imports.service.js";

export const importExcelMaster = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Excel file is required. Upload an .xlsx master file.",
      },
    });
    return;
  }

  if (!req.file.buffer?.length) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Uploaded Excel file is empty.",
      },
    });
    return;
  }

  const parsed = parseExcelMaster(req.file.buffer);

  if (parsed.rows.length === 0 && parsed.failed_rows.length > 0) {
    const summary = await importsService.importMasterRows(
      [],
      parsed.failed_rows,
      parsed.warnings,
    );
    res.status(200).json({ data: summary });
    return;
  }

  const summary = await importsService.importMasterRows(
    parsed.rows,
    parsed.failed_rows,
    parsed.warnings,
  );

  res.status(200).json({ data: summary });
});
