import type { CompanyType } from "@stip/shared-types";
import { parseDimension, type ParsedDimension } from "../../utils/dimensionParser.js";
import * as XLSX from "xlsx";

export const SUPPLIER_SHEET = "tblSuppliers";
export const CUSTOMER_SHEET = "tblCustomers";

export interface ParsedCompanyRow {
  sheet: string;
  rowNumber: number;
  company_type: CompanyType;
  company_name: string;
  region: string | null;
  country: string | null;
  factory_name: string | null;
  category_code: string | null;
  port_name: string | null;
  port_latitude: number | null;
  port_longitude: number | null;
  website: string | null;
  remarks: string | null;
  product_category: string;
  steel_grade: string;
  thickness: ParsedDimension;
  width: ParsedDimension;
  length: ParsedDimension;
  extra_notes: string | null;
}

export interface ExcelParseResult {
  rows: ParsedCompanyRow[];
  warnings: string[];
  failed_rows: Array<{ sheet: string; row: number; reason: string }>;
}

const SUPPLIER_REQUIRED_COLUMNS = ["공급선명"];
const SUPPLIER_OPTIONAL_GROUPS: string[][] = [
  ["구분코드"],
  ["지역"],
  ["국가"],
  ["공장명"],
  ["조강 CAPA"],
  ["슬라브 외판량"],
  ["두께 thickness", "두께"],
  ["폭 width", "폭"],
  ["길이 length", "길이"],
  ["선적항"],
  ["선적항 위도"],
  ["선적항 경도"],
  ["용도"],
  ["Remarks"],
  ["Website"],
];

const CUSTOMER_REQUIRED_COLUMNS = ["고객사"];
const CUSTOMER_OPTIONAL_GROUPS: string[][] = [
  ["구분코드"],
  ["지역"],
  ["국가"],
  ["압연 CAPA"],
  ["하역항"],
  ["하역항 위도"],
  ["하역항 경도"],
  ["슬라브 구매 정보"],
  ["두께 범위", "두께"],
  ["폭 범위", "폭"],
  ["길이 범위", "길이"],
  ["평균 구매 수량"],
  ["주요 공급선"],
  ["구매용도"],
  ["REMARKS"],
];

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, " ");
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeHeader(String(key))] = value;
  }
  return normalized;
}

function resolveSheetName(
  workbook: XLSX.WorkBook,
  expectedName: string,
  keywords: string[],
): string | null {
  const target = expectedName.trim().toLowerCase();
  const exact = workbook.SheetNames.find(
    (name) => name.trim().toLowerCase() === target,
  );
  if (exact) {
    return exact;
  }

  return (
    workbook.SheetNames.find((name) => {
      const lower = name.trim().toLowerCase();
      return keywords.some((keyword) => lower.includes(keyword));
    }) ?? null
  );
}

function getSheetHeaders(sheet: XLSX.WorkSheet): string[] {
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as string[][];

  const headerRow = rows[0] ?? [];
  return headerRow
    .map((cell) => (cell == null ? "" : normalizeHeader(String(cell))))
    .filter(Boolean);
}

function hasColumn(headers: string[], candidates: string[]): boolean {
  const normalizedHeaders = headers.map((header) => header.toLowerCase());
  return candidates.some((candidate) =>
    normalizedHeaders.includes(candidate.toLowerCase()),
  );
}

function validateColumns(
  sheetName: string,
  headers: string[],
  required: string[],
  optionalGroups: string[][],
): { warnings: string[]; failed_rows: Array<{ sheet: string; row: number; reason: string }> } {
  const warnings: string[] = [];
  const failed_rows: Array<{ sheet: string; row: number; reason: string }> = [];

  for (const column of required) {
    if (!hasColumn(headers, [column])) {
      failed_rows.push({
        sheet: sheetName,
        row: 1,
        reason: `Missing required column "${column}"`,
      });
    }
  }

  for (const group of optionalGroups) {
    if (!hasColumn(headers, group)) {
      warnings.push(
        `${sheetName}: expected column not found (${group.join(" | ")})`,
      );
    }
  }

  return { warnings, failed_rows };
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text || null;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in row) {
      return row[key];
    }
    const lower = key.toLowerCase();
    const matchedKey = Object.keys(row).find(
      (candidate) => candidate.toLowerCase() === lower,
    );
    if (matchedKey) {
      return row[matchedKey];
    }
  }
  return null;
}

function joinNotes(parts: Array<string | null | undefined>): string | null {
  const joined = parts.filter((part) => part && part.trim()).join("; ");
  return joined || null;
}

function parseSupplierRow(
  row: Record<string, unknown>,
  rowNumber: number,
): ParsedCompanyRow | null {
  const normalized = normalizeRow(row);
  const companyName = asText(pick(normalized, "공급선명"));
  if (!companyName) {
    return null;
  }

  const categoryCode = asText(pick(normalized, "구분코드"));
  const thickness = parseDimension(
    pick(normalized, "두께 thickness", "두께", "thickness"),
  );
  const width = parseDimension(pick(normalized, "폭 width", "폭", "width"));
  const length = parseDimension(pick(normalized, "길이 length", "길이", "length"));

  return {
    sheet: SUPPLIER_SHEET,
    rowNumber,
    company_type: "Supplier",
    company_name: companyName,
    region: asText(pick(normalized, "지역")),
    country: asText(pick(normalized, "국가")),
    factory_name: asText(pick(normalized, "공장명")),
    category_code: categoryCode,
    port_name: asText(pick(normalized, "선적항")),
    port_latitude: asNumber(pick(normalized, "선적항 위도")),
    port_longitude: asNumber(pick(normalized, "선적항 경도")),
    website: asText(pick(normalized, "Website", "website")),
    remarks: asText(pick(normalized, "Remarks", "remarks")),
    product_category: asText(pick(normalized, "용도")) ?? "Steel Product",
    steel_grade: categoryCode ?? "General",
    thickness,
    width,
    length,
    extra_notes: joinNotes([
      asText(pick(normalized, "조강 CAPA")),
      asText(pick(normalized, "슬라브 외판량")),
    ]),
  };
}

function parseCustomerRow(
  row: Record<string, unknown>,
  rowNumber: number,
): ParsedCompanyRow | null {
  const normalized = normalizeRow(row);
  const companyName = asText(pick(normalized, "고객사"));
  if (!companyName) {
    return null;
  }

  const categoryCode = asText(pick(normalized, "구분코드"));
  const thickness = parseDimension(
    pick(normalized, "두께 범위", "두께", "thickness"),
  );
  const width = parseDimension(pick(normalized, "폭 범위", "폭", "width"));
  const length = parseDimension(pick(normalized, "길이 범위", "길이", "length"));

  return {
    sheet: CUSTOMER_SHEET,
    rowNumber,
    company_type: "Customer",
    company_name: companyName,
    region: asText(pick(normalized, "지역")),
    country: asText(pick(normalized, "국가")),
    factory_name: null,
    category_code: categoryCode,
    port_name: asText(pick(normalized, "하역항")),
    port_latitude: asNumber(pick(normalized, "하역항 위도")),
    port_longitude: asNumber(pick(normalized, "하역항 경도")),
    website: null,
    remarks: asText(pick(normalized, "REMARKS", "Remarks", "remarks")),
    product_category: asText(pick(normalized, "구매용도")) ?? "Steel Purchase",
    steel_grade: categoryCode ?? "General",
    thickness,
    width,
    length,
    extra_notes: joinNotes([
      asText(pick(normalized, "압연 CAPA")),
      asText(pick(normalized, "슬라브 구매 정보")),
      asText(pick(normalized, "평균 구매 수량")),
      asText(pick(normalized, "주요 공급선")),
    ]),
  };
}

function collectDimensionWarnings(
  sheetName: string,
  rowNumber: number,
  dimensions: ParsedDimension[],
): string[] {
  const warnings: string[] = [];
  for (const dimension of dimensions) {
    if (dimension.warning) {
      warnings.push(
        `${sheetName} row ${rowNumber}: ${dimension.warning} (${dimension.raw ?? "empty"})`,
      );
    }
  }
  return warnings;
}

function parseSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  parser: (row: Record<string, unknown>, rowNumber: number) => ParsedCompanyRow | null,
  requiredColumns: string[],
  optionalColumns: string[][],
): {
  rows: ParsedCompanyRow[];
  failed_rows: Array<{ sheet: string; row: number; reason: string }>;
  warnings: string[];
} {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      rows: [],
      failed_rows: [
        {
          sheet: sheetName,
          row: 0,
          reason: `Sheet "${sheetName}" was not found in the workbook`,
        },
      ],
      warnings: [],
    };
  }

  const headers = getSheetHeaders(sheet);
  const columnValidation = validateColumns(
    sheetName,
    headers,
    requiredColumns,
    optionalColumns,
  );

  if (columnValidation.failed_rows.length > 0) {
    return {
      rows: [],
      failed_rows: columnValidation.failed_rows,
      warnings: columnValidation.warnings,
    };
  }

  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  const rows: ParsedCompanyRow[] = [];
  const failed_rows: Array<{ sheet: string; row: number; reason: string }> = [];
  const warnings = [...columnValidation.warnings];

  jsonRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const hasContent = Object.values(row).some(
      (value) => value !== null && String(value).trim() !== "",
    );

    if (!hasContent) {
      return;
    }

    try {
      const parsed = parser(row, rowNumber);
      if (!parsed) {
        failed_rows.push({
          sheet: sheetName,
          row: rowNumber,
          reason: "Missing required company name",
        });
        return;
      }

      warnings.push(
        ...collectDimensionWarnings(sheetName, rowNumber, [
          parsed.thickness,
          parsed.width,
          parsed.length,
        ]),
      );

      rows.push(parsed);
    } catch (error) {
      failed_rows.push({
        sheet: sheetName,
        row: rowNumber,
        reason:
          error instanceof Error
            ? `Row parse error: ${error.message}`
            : "Row parse error",
      });
    }
  });

  return { rows, failed_rows, warnings };
}

export function parseExcelMaster(buffer: Buffer): ExcelParseResult {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch (error) {
    return {
      rows: [],
      warnings: [],
      failed_rows: [
        {
          sheet: "",
          row: 0,
          reason:
            error instanceof Error
              ? `Failed to read Excel file: ${error.message}`
              : "Failed to read Excel file",
        },
      ],
    };
  }

  if (workbook.SheetNames.length === 0) {
    return {
      rows: [],
      warnings: [],
      failed_rows: [
        {
          sheet: "",
          row: 0,
          reason: "Excel file contains no worksheets",
        },
      ],
    };
  }

  const supplierSheetName = resolveSheetName(workbook, SUPPLIER_SHEET, [
    "supplier",
    "tblsupplier",
  ]);
  const customerSheetName = resolveSheetName(workbook, CUSTOMER_SHEET, [
    "customer",
    "tblcustomer",
  ]);

  const supplierResult = supplierSheetName
    ? parseSheet(
        workbook,
        supplierSheetName,
        parseSupplierRow,
        SUPPLIER_REQUIRED_COLUMNS,
        SUPPLIER_OPTIONAL_GROUPS,
      )
    : {
        rows: [],
        failed_rows: [
          {
            sheet: SUPPLIER_SHEET,
            row: 0,
            reason: `Sheet "${SUPPLIER_SHEET}" was not found in the workbook`,
          },
        ],
        warnings: [],
      };

  const customerResult = customerSheetName
    ? parseSheet(
        workbook,
        customerSheetName,
        parseCustomerRow,
        CUSTOMER_REQUIRED_COLUMNS,
        CUSTOMER_OPTIONAL_GROUPS,
      )
    : {
        rows: [],
        failed_rows: [
          {
            sheet: CUSTOMER_SHEET,
            row: 0,
            reason: `Sheet "${CUSTOMER_SHEET}" was not found in the workbook`,
          },
        ],
        warnings: [],
      };

  return {
    rows: [...supplierResult.rows, ...customerResult.rows],
    warnings: [...supplierResult.warnings, ...customerResult.warnings],
    failed_rows: [...supplierResult.failed_rows, ...customerResult.failed_rows],
  };
}
