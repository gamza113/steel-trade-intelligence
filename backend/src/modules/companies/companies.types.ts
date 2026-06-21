import type { Company, CompanyType, Port } from "@stip/shared-types";

export interface CompanyRow {
  id: string;
  company_name: string;
  company_type: CompanyType;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  port_id: string | null;
  port_name: string | null;
  website: string | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyRowWithJoin extends CompanyRow {
  join_port_id: string | null;
  join_port_name: string | null;
  join_port_country: string | null;
  join_port_city: string | null;
  join_port_latitude: number | null;
  join_port_longitude: number | null;
  join_port_un_locode: string | null;
  join_port_remarks: string | null;
  join_port_created_at: Date | null;
  join_port_updated_at: Date | null;
}

export interface ListCompaniesFilters {
  company_type?: CompanyType;
  country?: string;
  port_id?: string;
  search?: string;
  limit: number;
  offset: number;
}

export interface ListCompaniesResult {
  items: Company[];
  total: number;
}

export function mapJoinedPort(row: CompanyRowWithJoin): Port | null {
  if (!row.join_port_id) {
    return null;
  }

  return {
    id: row.join_port_id,
    port_name: row.join_port_name ?? "",
    country: row.join_port_country,
    city: row.join_port_city,
    latitude: row.join_port_latitude,
    longitude: row.join_port_longitude,
    un_locode: row.join_port_un_locode,
    remarks: row.join_port_remarks,
    created_at: row.join_port_created_at?.toISOString() ?? "",
    updated_at: row.join_port_updated_at?.toISOString() ?? "",
  };
}
