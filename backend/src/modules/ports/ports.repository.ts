import type { CreatePortInput, Port, UpdatePortInput } from "@stip/shared-types";
import { getPool } from "../../db/index.js";
import type { ListPortsFilters, ListPortsResult, PortRow } from "./ports.types.js";

export function mapPortRow(row: PortRow): Port {
  return {
    id: row.id,
    port_name: row.port_name,
    country: row.country,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    un_locode: row.un_locode,
    remarks: row.remarks,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function listPorts(filters: ListPortsFilters): Promise<ListPortsResult> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.country) {
    conditions.push(`country ILIKE $${paramIndex++}`);
    params.push(`%${filters.country}%`);
  }

  if (filters.search) {
    conditions.push(
      `(port_name ILIKE $${paramIndex} OR city ILIKE $${paramIndex} OR un_locode ILIKE $${paramIndex})`,
    );
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ports ${whereClause}`,
    params,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const listParams = [...params, filters.limit, filters.offset];
  const result = await pool.query<PortRow>(
    `SELECT *
     FROM ports
     ${whereClause}
     ORDER BY port_name ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    listParams,
  );

  return {
    items: result.rows.map(mapPortRow),
    total,
  };
}

export async function findPortById(id: string): Promise<Port | null> {
  const pool = getPool();
  const result = await pool.query<PortRow>("SELECT * FROM ports WHERE id = $1", [id]);
  const row = result.rows[0];
  return row ? mapPortRow(row) : null;
}

export async function createPort(input: CreatePortInput): Promise<Port> {
  const pool = getPool();
  const result = await pool.query<PortRow>(
    `INSERT INTO ports (
      port_name,
      country,
      city,
      latitude,
      longitude,
      un_locode,
      remarks
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      input.port_name,
      input.country ?? null,
      input.city ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.un_locode ?? null,
      input.remarks ?? null,
    ],
  );
  return mapPortRow(result.rows[0]);
}

export async function updatePort(
  id: string,
  input: UpdatePortInput,
): Promise<Port | null> {
  const pool = getPool();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const entries: Array<[keyof UpdatePortInput, unknown]> = [
    ["port_name", input.port_name],
    ["country", input.country],
    ["city", input.city],
    ["latitude", input.latitude],
    ["longitude", input.longitude],
    ["un_locode", input.un_locode],
    ["remarks", input.remarks],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return findPortById(id);
  }

  values.push(id);
  const result = await pool.query<PortRow>(
    `UPDATE ports SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );
  const row = result.rows[0];
  return row ? mapPortRow(row) : null;
}

export async function deletePort(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query("DELETE FROM ports WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function portExists(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM ports WHERE id = $1) AS exists",
    [id],
  );
  return result.rows[0]?.exists ?? false;
}
