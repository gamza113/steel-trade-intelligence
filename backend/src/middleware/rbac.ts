import type { Request, Response, NextFunction } from "express";

// Role-based access control middleware — to be implemented.

export function rbac(_roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}
