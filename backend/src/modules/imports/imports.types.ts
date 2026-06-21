export interface ImportFailedRow {
  sheet: string;
  row: number;
  reason: string;
}

export interface ImportSummary {
  supplier_rows_imported: number;
  customer_rows_imported: number;
  product_rows_imported: number;
  failed_rows: ImportFailedRow[];
  warnings: string[];
}

export interface CompanyInsertInput {
  company_name: string;
  company_type: "Supplier" | "Customer";
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  port_id: string | null;
  port_name: string | null;
  website: string | null;
  remarks: string | null;
}

export interface ProductInsertInput {
  company_id: string;
  product_category: string;
  steel_grade: string;
  thickness_min: number | null;
  thickness_max: number | null;
  width_min: number | null;
  width_max: number | null;
  length_min: number | null;
  length_max: number | null;
  thickness_raw: string | null;
  width_raw: string | null;
  length_raw: string | null;
  remarks: string | null;
}

export interface PortUpsertInput {
  port_name: string;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}
