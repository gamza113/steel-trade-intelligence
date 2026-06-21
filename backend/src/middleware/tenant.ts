import type { Request, Response, NextFunction } from "express";

// Tenant context middleware — organization_id scoping to be implemented.

export function tenant(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
