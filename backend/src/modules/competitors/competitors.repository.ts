import type { DimensionType } from "@stip/shared-types";
import { getPool } from "../../db/index.js";
import type {
  GeoPoint,
  ProductFilter,
  SupplierContext,
  SupplierProductProfile,
  SupplierProductRow,
} from "./competitors.types.js";

interface DimensionOptionRow {
  product_id: string;
  dimension_type: DimensionType;
  value: string;
}

function toNumberOrNull(value: string | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

function mapGeo(
  portLat: number | null,
  portLon: number | null,
  companyLat: number | null,
  companyLon: number | null,
): GeoPoint {
  return {
    latitude: portLat ?? companyLat,
    longitude: portLon ?? companyLon,
  };
}

function mapProductRow(
  row: SupplierProductRow,
  optionsMap: Map<string, Array<{ dimension_type: DimensionType; value: number }>>,
): SupplierProductProfile {
  return {
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    country: row.country,
    port_name: row.port_name ?? null,
    geo: mapGeo(
      row.port_latitude,
      row.port_longitude,
      row.company_latitude,
      row.company_longitude,
    ),
    supplier_remarks: row.supplier_remarks,
    product_id: row.product_id,
    product_category: row.product_category,
    steel_grade: row.steel_grade,
    thickness_min: toNumberOrNull(row.thickness_min),
    thickness_max: toNumberOrNull(row.thickness_max),
    width_min: toNumberOrNull(row.width_min),
    width_max: toNumberOrNull(row.width_max),
    length_min: toNumberOrNull(row.length_min),
    length_max: toNumberOrNull(row.length_max),
    thickness_raw: row.thickness_raw,
    width_raw: row.width_raw,
    length_raw: row.length_raw,
    product_remarks: row.product_remarks,
    dimension_options: optionsMap.get(row.product_id) ?? [],
  };
}

async function loadDimensionOptions(
  productIds: string[],
): Promise<
  Map<string, Array<{ dimension_type: DimensionType; value: number }>>
> {
  const map = new Map<
    string,
    Array<{ dimension_type: DimensionType; value: number }>
  >();
  if (productIds.length === 0) {
    return map;
  }

  const pool = getPool();
  const result = await pool.query<DimensionOptionRow>(
    `SELECT product_id, dimension_type, value
     FROM product_dimension_options
     WHERE product_id = ANY($1::uuid[])
     ORDER BY dimension_type, value`,
    [productIds],
  );

  for (const row of result.rows) {
    const options = map.get(row.product_id) ?? [];
    options.push({
      dimension_type: row.dimension_type,
      value: Number(row.value),
    });
    map.set(row.product_id, options);
  }

  return map;
}

const SUPPLIER_PRODUCT_SELECT = `
  s.id AS supplier_id,
  s.company_name AS supplier_name,
  s.country,
  COALESCE(p.port_name, s.port_name) AS port_name,
  s.latitude AS company_latitude,
  s.longitude AS company_longitude,
  p.latitude AS port_latitude,
  p.longitude AS port_longitude,
  s.remarks AS supplier_remarks,
  prod.id AS product_id,
  prod.product_category,
  prod.steel_grade,
  prod.thickness_min,
  prod.thickness_max,
  prod.width_min,
  prod.width_max,
  prod.length_min,
  prod.length_max,
  prod.thickness_raw,
  prod.width_raw,
  prod.length_raw,
  prod.remarks AS product_remarks
`;

async function querySupplierProducts(
  conditions: string[],
  params: unknown[],
): Promise<SupplierProductProfile[]> {
  const pool = getPool();
  const whereClause =
    conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  const result = await pool.query<SupplierProductRow>(
    `SELECT ${SUPPLIER_PRODUCT_SELECT}
     FROM companies s
     INNER JOIN products prod ON prod.company_id = s.id
     LEFT JOIN ports p ON s.port_id = p.id
     WHERE s.company_type = 'Supplier'
     ${whereClause}
     ORDER BY s.company_name, prod.product_category, prod.steel_grade`,
    params,
  );

  const productIds = result.rows.map((row) => row.product_id);
  const optionsMap = await loadDimensionOptions(productIds);
  return result.rows.map((row) => mapProductRow(row, optionsMap));
}

export async function findSupplierContext(
  supplierId: string,
): Promise<SupplierContext | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    company_name: string;
    country: string | null;
    port_name: string | null;
    join_port_name: string | null;
    company_latitude: number | null;
    company_longitude: number | null;
    port_latitude: number | null;
    port_longitude: number | null;
    remarks: string | null;
  }>(
    `SELECT c.id,
            c.company_name,
            c.country,
            c.port_name,
            p.port_name AS join_port_name,
            c.latitude AS company_latitude,
            c.longitude AS company_longitude,
            p.latitude AS port_latitude,
            p.longitude AS port_longitude,
            c.remarks
     FROM companies c
     LEFT JOIN ports p ON c.port_id = p.id
     WHERE c.id = $1
       AND c.company_type = 'Supplier'`,
    [supplierId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    company_name: row.company_name,
    country: row.country,
    port_name: row.join_port_name ?? row.port_name,
    geo: mapGeo(
      row.port_latitude,
      row.port_longitude,
      row.company_latitude,
      row.company_longitude,
    ),
    remarks: row.remarks,
  };
}

export async function findSupplierProducts(
  supplierId: string,
  filters: ProductFilter = {},
): Promise<SupplierProductProfile[]> {
  const conditions: string[] = ["s.id = $1"];
  const params: unknown[] = [supplierId];
  let paramIndex = 2;

  if (filters.product_category) {
    conditions.push(`prod.product_category ILIKE $${paramIndex++}`);
    params.push(`%${filters.product_category}%`);
  }

  if (filters.steel_grade) {
    conditions.push(`prod.steel_grade ILIKE $${paramIndex++}`);
    params.push(`%${filters.steel_grade}%`);
  }

  return querySupplierProducts(conditions, params);
}

export async function findOtherSupplierProducts(
  excludeSupplierId: string,
): Promise<SupplierProductProfile[]> {
  return querySupplierProducts(["s.id <> $1"], [excludeSupplierId]);
}
