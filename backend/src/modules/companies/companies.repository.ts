import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@stip/shared-types";
import { getPool } from "../../db/index.js";
import {
  type CompanyRowWithJoin,
  type ListCompaniesFilters,
  type ListCompaniesResult,
  mapJoinedPort,
} from "./companies.types.js";
import type { Company } from "@stip/shared-types";

const COMPANY_SELECT = `
  c.id,
  c.company_name,
  c.company_type,
  c.country,
  c.city,
  c.latitude,
  c.longitude,
  c.port_id,
  c.port_name,
  c.website,
  c.remarks,
  c.created_at,
  c.updated_at,
  p.id AS join_port_id,
  p.port_name AS join_port_name,
  p.country AS join_port_country,
  p.city AS join_port_city,
  p.latitude AS join_port_latitude,
  p.longitude AS join_port_longitude,
  p.un_locode AS join_port_un_locode,
  p.remarks AS join_port_remarks,
  p.created_at AS join_port_created_at,
  p.updated_at AS join_port_updated_at
`;

const COMPANY_FROM_JOIN = `
  FROM companies c
  LEFT JOIN ports p ON c.port_id = p.id
`;

function mapRow(row: CompanyRowWithJoin): Company {
  return {
    id: row.id,
    company_name: row.company_name,
    company_type: row.company_type,
    country: row.country,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    port_id: row.port_id,
    port_name: row.port_name,
    port: mapJoinedPort(row),
    website: row.website,
    remarks: row.remarks,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function listCompanies(
  filters: ListCompaniesFilters,
): Promise<ListCompaniesResult> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.company_type) {
    conditions.push(`c.company_type = $${paramIndex++}`);
    params.push(filters.company_type);
  }

  if (filters.country) {
    conditions.push(`c.country ILIKE $${paramIndex++}`);
    params.push(`%${filters.country}%`);
  }

  if (filters.port_id) {
    conditions.push(`c.port_id = $${paramIndex++}`);
    params.push(filters.port_id);
  }

  if (filters.search) {
    conditions.push(
      `(c.company_name ILIKE $${paramIndex} OR c.city ILIKE $${paramIndex} OR c.port_name ILIKE $${paramIndex} OR p.port_name ILIKE $${paramIndex})`,
    );
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count ${COMPANY_FROM_JOIN} ${whereClause}`,
    params,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const listParams = [...params, filters.limit, filters.offset];
  const result = await pool.query<CompanyRowWithJoin>(
    `SELECT ${COMPANY_SELECT}
     ${COMPANY_FROM_JOIN}
     ${whereClause}
     ORDER BY c.company_name ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    listParams,
  );

  return {
    items: result.rows.map(mapRow),
    total,
  };
}

export async function findCompanyById(id: string): Promise<Company | null> {
  const pool = getPool();
  const result = await pool.query<CompanyRowWithJoin>(
    `SELECT ${COMPANY_SELECT}
     ${COMPANY_FROM_JOIN}
     WHERE c.id = $1`,
    [id],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function createCompany(
  input: CreateCompanyInput,
): Promise<Company> {
  const pool = getPool();
  const result = await pool.query<{ id: string }>(
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
      input.country ?? null,
      input.city ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.port_id ?? null,
      input.port_name ?? null,
      input.website ?? null,
      input.remarks ?? null,
    ],
  );

  const insertedId = result.rows[0]?.id;
  if (!insertedId) {
    throw new Error("Failed to create company");
  }

  return (await findCompanyById(insertedId))!;
}

export async function updateCompany(
  id: string,
  input: UpdateCompanyInput,
): Promise<Company | null> {
  const pool = getPool();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const entries: Array<[keyof UpdateCompanyInput, unknown]> = [
    ["company_name", input.company_name],
    ["company_type", input.company_type],
    ["country", input.country],
    ["city", input.city],
    ["latitude", input.latitude],
    ["longitude", input.longitude],
    ["port_id", input.port_id],
    ["port_name", input.port_name],
    ["website", input.website],
    ["remarks", input.remarks],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return findCompanyById(id);
  }

  values.push(id);
  await pool.query(
    `UPDATE companies SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values,
  );

  return findCompanyById(id);
}

export async function deleteCompany(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query("DELETE FROM companies WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function companyExists(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM companies WHERE id = $1) AS exists",
    [id],
  );
  return result.rows[0]?.exists ?? false;
}
