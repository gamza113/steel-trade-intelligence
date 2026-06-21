import type { Port } from "@stip/shared-types";

export interface PortRow {
  id: string;
  port_name: string;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  un_locode: string | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ListPortsFilters {
  country?: string;
  search?: string;
  limit: number;
  offset: number;
}

export interface ListPortsResult {
  items: Port[];
  total: number;
}
