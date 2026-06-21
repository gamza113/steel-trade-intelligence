import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";

function isDatabaseConnectionError(err: Error): boolean {
  const pgCode = (err as { code?: string }).code;
  return (
    err.message === "DATABASE_URL is not configured" ||
    pgCode === "ECONNREFUSED" ||
    pgCode === "ENOTFOUND" ||
    pgCode === "ETIMEDOUT" ||
    pgCode === "57P01" ||
    pgCode === "57P03"
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        })),
      },
    });
    return;
  }

  if (err.message?.includes("invalid input syntax for type uuid")) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid UUID format",
      },
    });
    return;
  }

  if (isDatabaseConnectionError(err)) {
    res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message:
          "Database is not available. Start PostgreSQL and run ./scripts/migrate.sh",
      },
    });
    return;
  }

  if (err.message === "Only Excel .xlsx files are supported") {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
      },
    });
    return;
  }

  if (err.name === "MulterError") {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
      },
    });
    return;
  }

  console.error(err);

  const message =
    env.NODE_ENV === "development" ? err.message : "An unexpected error occurred";

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  });
}
