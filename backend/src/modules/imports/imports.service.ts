import type { ParsedDimension } from "../../utils/dimensionParser.js";
import { formatDbError } from "../../utils/dbError.js";
import { getPool } from "../../db/index.js";
import type { ParsedCompanyRow } from "./excelMaster.parser.js";
import type { ImportSummary } from "./imports.types.js";
import * as importsRepository from "./imports.repository.js";

function companyKey(row: ParsedCompanyRow): string {
  return `${row.company_type}:${row.company_name}:${row.country ?? ""}`;
}

function buildCompanyRemarks(row: ParsedCompanyRow): string | null {
  const parts = [
    row.category_code ? `구분코드: ${row.category_code}` : null,
    row.factory_name ? `공장명: ${row.factory_name}` : null,
    row.remarks,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("; ") : null;
}

function buildProductRemarks(row: ParsedCompanyRow): string | null {
  return row.extra_notes;
}

function normalizeDimensionForInsert(
  dimension: ParsedDimension,
  label: string,
): {
  min: number | null;
  max: number | null;
  raw: string | null;
  options: number[];
  warnings: string[];
} {
  const warnings: string[] = [];
  let min = dimension.min;
  let max = dimension.max;

  if (min !== null && max !== null && min > max) {
    warnings.push(`${label}: inverted range swapped (${min} > ${max})`);
    min = Math.min(dimension.min!, dimension.max!);
    max = Math.max(dimension.min!, dimension.max!);
  }

  const raw =
    dimension.ambiguous || dimension.isDiscrete ? dimension.raw : null;
  if (dimension.warning) {
    warnings.push(`${label}: ${dimension.warning}`);
  }

  const options =
    dimension.options.length > 0
      ? dimension.options
      : min !== null && max !== null
        ? min === max
          ? [min]
          : [min, max]
        : min !== null
          ? [min]
          : max !== null
            ? [max]
            : [];

  return { min, max, raw, options, warnings };
}

async function importSingleRow(
  row: ParsedCompanyRow,
  companyCache: Map<string, string>,
): Promise<{
  imported: boolean;
  companyType: ParsedCompanyRow["company_type"] | null;
  warnings: string[];
  failure: ImportSummary["failed_rows"][number] | null;
}> {
  const pool = getPool();
  const client = await pool.connect();
  const rowWarnings: string[] = [];

  try {
    await client.query("BEGIN");

    const key = companyKey(row);
    let companyId =
      companyCache.get(key) ??
      (await importsRepository.findCompanyByKey(
        client,
        row.company_name,
        row.company_type,
        row.country,
      ));

    const portId = row.port_name
      ? await importsRepository.upsertPort(client, {
          port_name: row.port_name,
          country: row.country,
          city: row.region,
          latitude: row.port_latitude,
          longitude: row.port_longitude,
        })
      : null;

    if (!companyId) {
      companyId = await importsRepository.insertCompany(client, {
        company_name: row.company_name,
        company_type: row.company_type,
        country: row.country,
        city: row.region ?? row.factory_name,
        latitude: row.port_latitude,
        longitude: row.port_longitude,
        port_id: portId,
        port_name: row.port_name,
        website: row.website,
        remarks: buildCompanyRemarks(row),
      });
    }

    companyCache.set(key, companyId);

    const thickness = normalizeDimensionForInsert(row.thickness, "thickness");
    const width = normalizeDimensionForInsert(row.width, "width");
    const length = normalizeDimensionForInsert(row.length, "length");
    rowWarnings.push(...thickness.warnings, ...width.warnings, ...length.warnings);

    const productId = await importsRepository.insertProduct(client, {
      company_id: companyId,
      product_category: row.product_category,
      steel_grade: row.steel_grade,
      thickness_min: thickness.min,
      thickness_max: thickness.max,
      width_min: width.min,
      width_max: width.max,
      length_min: length.min,
      length_max: length.max,
      thickness_raw: thickness.raw,
      width_raw: width.raw,
      length_raw: length.raw,
      remarks: buildProductRemarks(row),
    });

    await importsRepository.insertDimensionOptions(
      client,
      productId,
      "thickness",
      thickness.options,
    );
    await importsRepository.insertDimensionOptions(
      client,
      productId,
      "width",
      width.options,
    );
    await importsRepository.insertDimensionOptions(
      client,
      productId,
      "length",
      length.options,
    );

    await client.query("COMMIT");

    return {
      imported: true,
      companyType: row.company_type,
      warnings: rowWarnings,
      failure: null,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }

    return {
      imported: false,
      companyType: null,
      warnings: rowWarnings,
      failure: {
        sheet: row.sheet,
        row: row.rowNumber,
        reason: formatDbError(error),
      },
    };
  } finally {
    client.release();
  }
}

export async function importMasterRows(
  rows: ParsedCompanyRow[],
  parseFailures: ImportSummary["failed_rows"],
  parseWarnings: string[],
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    supplier_rows_imported: 0,
    customer_rows_imported: 0,
    product_rows_imported: 0,
    failed_rows: [...parseFailures],
    warnings: [...parseWarnings],
  };

  const companyCache = new Map<string, string>();

  for (const row of rows) {
    const result = await importSingleRow(row, companyCache);

    if (result.warnings.length > 0) {
      summary.warnings.push(
        ...result.warnings.map(
          (warning) => `${row.sheet} row ${row.rowNumber}: ${warning}`,
        ),
      );
    }

    if (result.failure) {
      summary.failed_rows.push(result.failure);
      continue;
    }

    if (result.imported) {
      summary.product_rows_imported += 1;
      if (result.companyType === "Supplier") {
        summary.supplier_rows_imported += 1;
      } else if (result.companyType === "Customer") {
        summary.customer_rows_imported += 1;
      }
    }
  }

  return summary;
}
