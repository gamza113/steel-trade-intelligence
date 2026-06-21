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
