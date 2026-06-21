export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Array<{ field: string; issue: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ field: string; issue: string }>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFoundError(resource: string): AppError {
  return new AppError(404, "NOT_FOUND", `${resource} not found`);
}

export function conflictError(message: string): AppError {
  return new AppError(409, "CONFLICT", message);
}
