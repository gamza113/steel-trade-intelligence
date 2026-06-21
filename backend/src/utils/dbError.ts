export function formatDbError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const pg = error as { code: string; message: string; column?: string };
    switch (pg.code) {
      case "42703":
        return `Database schema mismatch: column "${pg.column ?? "unknown"}" is missing. Run pnpm db:migrate`;
      case "23514":
        return `Data constraint violation: ${pg.message}`;
      case "23503":
        return `Foreign key violation: ${pg.message}`;
      case "23505":
        return `Duplicate key violation: ${pg.message}`;
      case "25P02":
        return "Database transaction was aborted for this row";
      default:
        return `Database insert failed (${pg.code}): ${pg.message}`;
    }
  }

  return error instanceof Error ? error.message : "Import failed";
}
