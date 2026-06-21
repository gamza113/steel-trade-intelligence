import type { Request, Response, NextFunction } from "express";

// Authentication middleware — JWT validation to be implemented.

export function auth(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
