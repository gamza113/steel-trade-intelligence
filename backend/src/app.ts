import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { getPool } from "./db/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { apiRouter } from "./modules/index.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowedOrigins = env.CORS_ORIGINS;
        const isDevLocalhost =
          env.NODE_ENV === "development" &&
          /^http:\/\/localhost:\d+$/.test(origin);

        if (allowedOrigins.includes(origin) || isDevLocalhost) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", async (_req, res) => {
    const health: {
      status: string;
      service: string;
      database?: string;
    } = {
      status: "ok",
      service: "stip-api",
    };

    if (env.DATABASE_URL) {
      try {
        const pool = getPool();
        await pool.query("SELECT 1");
        health.database = "connected";
      } catch {
        health.status = "degraded";
        health.database = "disconnected";
      }
    } else {
      health.database = "not_configured";
    }

    res.status(health.status === "ok" ? 200 : 503).json(health);
  });

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
