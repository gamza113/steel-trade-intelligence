import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";

type ValidationTarget = "body" | "query" | "params";

type ValidationSchemas = Partial<Record<ValidationTarget, ZodSchema>>;

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const [target, schema] of Object.entries(schemas) as Array<
        [ValidationTarget, ZodSchema]
      >) {
        const parsed = schema.parse(req[target]);
        Object.assign(req[target], parsed);
      }
      next();
    } catch (err: unknown) {
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
      next(err);
    }
  };
}
