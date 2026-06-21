import type { PoolClient } from "pg";
import { getPool } from "../../db/index.js";
import type {
  CompanyInsertInput,
  PortUpsertInput,
  ProductInsertInput,
} from "./imports.types.js";

export async function upsertPort(
  client: PoolClient,
  input: PortUpsertInput,
): Promise<string | null> {
  if (!input.port_name) {
    return null;
  }

  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM ports
     WHERE port_name = $1
       AND COALESCE(country, '') = COALESCE($2, '')
     ORDER BY created_at ASC
     LIMIT 1`,
    [input.port_name, input.country],
  );

  if (existing.rows[0]) {
    const portId = existing.rows[0].id;
    await client.query(
      `UPDATE ports
       SET city = COALESCE($2, city),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude)
       WHERE id = $1`,
      [portId, input.city, input.latitude, input.longitude],
    );
    return portId;
  }

  const created = await client.query<{ id: string }>(
    `INSERT INTO ports (
      port_name,
      country,
      city,
      latitude,
      longitude
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [
      input.port_name,
      input.country,
      input.city,
      input.latitude,
      input.longitude,
    ],
  );

  return created.rows[0]?.id ?? null;
}

export async function findCompanyByKey(
  client: PoolClient,
  companyName: string,
  companyType: string,
  country: string | null,
): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    `SELECT id
     FROM companies
     WHERE company_name = $1
       AND company_type = $2
       AND COALESCE(country, '') = COALESCE($3, '')
     LIMIT 1`,
    [companyName, companyType, country],
  );

  return result.rows[0]?.id ?? null;
}

export async function insertCompany(
  client: PoolClient,
  input: CompanyInsertInput,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO companies (
      company_name,
      company_type,
      country,
      city,
      latitude,
      longitude,
      port_id,
      port_name,
      website,
      remarks
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id`,
    [
      input.company_name,
      input.company_type,
      input.country,
      input.city,
      input.latitude,
      input.longitude,
      input.port_id,
      input.port_name,
      input.website,
      input.remarks,
    ],
  );

  const id = result.rows[0]?.id;
  if (!id) {
    throw new Error("Failed to insert company");
  }
  return id;
}

export async function insertProduct(
  client: PoolClient,
  input: ProductInsertInput,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO products (
      company_id,
      product_category,
      steel_grade,
      thickness_min,
      thickness_max,
      width_min,
      width_max,
      length_min,
      length_max,
      thickness_raw,
      width_raw,
      length_raw,
      remarks
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id`,
    [
      input.company_id,
      input.product_category,
      input.steel_grade,
      input.thickness_min,
      input.thickness_max,
      input.width_min,
      input.width_max,
      input.length_min,
      input.length_max,
      input.thickness_raw,
      input.width_raw,
      input.length_raw,
      input.remarks,
    ],
  );

  const id = result.rows[0]?.id;
  if (!id) {
    throw new Error("Failed to insert product");
  }
  return id;
}

export async function insertDimensionOptions(
  client: PoolClient,
  productId: string,
  dimensionType: "thickness" | "width" | "length",
  values: number[],
): Promise<void> {
  if (values.length === 0) {
    return;
  }

  for (const value of values) {
    await client.query(
      `INSERT INTO product_dimension_options (product_id, dimension_type, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, dimension_type, value) DO NOTHING`,
      [productId, dimensionType, value],
    );
  }
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}
