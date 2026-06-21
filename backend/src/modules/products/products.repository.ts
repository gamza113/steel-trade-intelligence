import type {
  CreateProductInput,
  DimensionType,
  Product,
  ProductDimensionOption,
  UpdateProductInput,
} from "@stip/shared-types";
import { getPool } from "../../db/index.js";
import { companyExists } from "../companies/companies.repository.js";
import type {
  ListProductsFilters,
  ListProductsResult,
  ProductRow,
} from "./products.types.js";

interface DimensionOptionRow {
  id: string;
  product_id: string;
  dimension_type: DimensionType;
  value: string;
  created_at: Date;
}

function toNumberOrNull(value: string | null): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapDimensionOptionRow(row: DimensionOptionRow): ProductDimensionOption {
  return {
    id: row.id,
    product_id: row.product_id,
    dimension_type: row.dimension_type,
    value: Number(row.value),
    created_at: row.created_at.toISOString(),
  };
}

function mapRow(
  row: ProductRow,
  dimensionOptions: ProductDimensionOption[] = [],
): Product {
  return {
    id: row.id,
    company_id: row.company_id,
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
    remarks: row.remarks,
    dimension_options: dimensionOptions,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

async function loadDimensionOptionsByProductIds(
  productIds: string[],
): Promise<Map<string, ProductDimensionOption[]>> {
  const map = new Map<string, ProductDimensionOption[]>();
  if (productIds.length === 0) {
    return map;
  }

  const pool = getPool();
  const result = await pool.query<DimensionOptionRow>(
    `SELECT id, product_id, dimension_type, value, created_at
     FROM product_dimension_options
     WHERE product_id = ANY($1::uuid[])
     ORDER BY dimension_type, value`,
    [productIds],
  );

  for (const row of result.rows) {
    const options = map.get(row.product_id) ?? [];
    options.push(mapDimensionOptionRow(row));
    map.set(row.product_id, options);
  }

  return map;
}

function attachDimensionOptions(
  products: Product[],
  optionsMap: Map<string, ProductDimensionOption[]>,
): Product[] {
  return products.map((product) => ({
    ...product,
    dimension_options: optionsMap.get(product.id) ?? [],
  }));
}

export async function listProducts(
  filters: ListProductsFilters,
): Promise<ListProductsResult> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.company_id) {
    conditions.push(`company_id = $${paramIndex++}`);
    params.push(filters.company_id);
  }

  if (filters.product_category) {
    conditions.push(`product_category ILIKE $${paramIndex++}`);
    params.push(`%${filters.product_category}%`);
  }

  if (filters.steel_grade) {
    conditions.push(`steel_grade ILIKE $${paramIndex++}`);
    params.push(`%${filters.steel_grade}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products ${whereClause}`,
    params,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const listParams = [...params, filters.limit, filters.offset];
  const result = await pool.query<ProductRow>(
    `SELECT *
     FROM products
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    listParams,
  );

  const items = result.rows.map((row) => mapRow(row));
  const optionsMap = await loadDimensionOptionsByProductIds(
    items.map((item) => item.id),
  );

  return {
    items: attachDimensionOptions(items, optionsMap),
    total,
  };
}

export async function findProductById(id: string): Promise<Product | null> {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "SELECT * FROM products WHERE id = $1",
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const optionsMap = await loadDimensionOptionsByProductIds([row.id]);
  return mapRow(row, optionsMap.get(row.id) ?? []);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  if (!(await companyExists(input.company_id))) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const pool = getPool();
  const result = await pool.query<ProductRow>(
    `INSERT INTO products (
      company_id,
      product_category,
      steel_grade,
      thickness_min,
      thickness_max,
      width_min,
      width_max,
      length_min,
      length_max
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      input.company_id,
      input.product_category,
      input.steel_grade,
      input.thickness_min ?? null,
      input.thickness_max ?? null,
      input.width_min ?? null,
      input.width_max ?? null,
      input.length_min ?? null,
      input.length_max ?? null,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product | null> {
  if (input.company_id && !(await companyExists(input.company_id))) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const pool = getPool();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const entries: Array<[keyof UpdateProductInput, unknown]> = [
    ["company_id", input.company_id],
    ["product_category", input.product_category],
    ["steel_grade", input.steel_grade],
    ["thickness_min", input.thickness_min],
    ["thickness_max", input.thickness_max],
    ["width_min", input.width_min],
    ["width_max", input.width_max],
    ["length_min", input.length_min],
    ["length_max", input.length_max],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return findProductById(id);
  }

  values.push(id);
  const result = await pool.query<ProductRow>(
    `UPDATE products SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );
  const row = result.rows[0];
  return row ? findProductById(row.id) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
