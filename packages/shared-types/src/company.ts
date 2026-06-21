import type { Port } from "./port.js";

export type CompanyType = "Supplier" | "Customer";

export interface Company {
  id: string;
  company_name: string;
  company_type: CompanyType;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  port_id: string | null;
  port_name: string | null;
  port: Port | null;
  website: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyInput {
  company_name: string;
  company_type: CompanyType;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  port_id?: string | null;
  port_name?: string | null;
  website?: string | null;
  remarks?: string | null;
}

export interface UpdateCompanyInput {
  company_name?: string;
  company_type?: CompanyType;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  port_id?: string | null;
  port_name?: string | null;
  website?: string | null;
  remarks?: string | null;
}
