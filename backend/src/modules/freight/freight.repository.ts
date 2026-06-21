import { getPool } from "../../db/index.js";
import type { CompanyPortLocation } from "./freight.types.js";

export async function findCompanyPortLocation(
  companyId: string,
): Promise<CompanyPortLocation | null> {
  const pool = getPool();
  const result = await pool.query<{
    company_id: string;
    company_name: string;
    company_type: string;
    port_name: string | null;
    join_port_name: string | null;
    port_latitude: number | null;
    port_longitude: number | null;
    company_latitude: number | null;
    company_longitude: number | null;
  }>(
    `SELECT c.id AS company_id,
            c.company_name,
            c.company_type,
            c.port_name,
            p.port_name AS join_port_name,
            p.latitude AS port_latitude,
            p.longitude AS port_longitude,
            c.latitude AS company_latitude,
            c.longitude AS company_longitude
     FROM companies c
     LEFT JOIN ports p ON c.port_id = p.id
     WHERE c.id = $1`,
    [companyId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const latitude = row.port_latitude ?? row.company_latitude;
  const longitude = row.port_longitude ?? row.company_longitude;

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    company_id: row.company_id,
    company_name: row.company_name,
    company_type: row.company_type,
    port_name: row.join_port_name ?? row.port_name ?? "Unknown port",
    latitude,
    longitude,
  };
}
