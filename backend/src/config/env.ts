import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(configDir, "../../");
const rootDir = path.resolve(backendDir, "../");

// Load monorepo root first, then backend overrides (skipped in production on PaaS).
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(rootDir, ".env") });
  dotenv.config({ path: path.join(backendDir, ".env") });

  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.join(backendDir, ".env.example") });
  }
}

function parseCorsOrigins(): string[] {
  const origins = new Set<string>();

  const list = process.env.CORS_ORIGINS?.split(",").map((value) => value.trim());
  if (list) {
    for (const origin of list) {
      if (origin) {
        origins.add(origin);
      }
    }
  }

  const single = process.env.CORS_ORIGIN?.trim();
  if (single) {
    origins.add(single);
  }

  if (origins.size === 0) {
    origins.add("http://localhost:5173");
  }

  return [...origins];
}

function resolveDatabaseSsl(): boolean {
  if (process.env.DATABASE_SSL === "true") {
    return true;
  }
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  return (
    process.env.NODE_ENV === "production" ||
    databaseUrl.includes("railway.app") ||
    databaseUrl.includes("sslmode=require")
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  API_PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 3001),
  API_HOST: process.env.API_HOST ?? "0.0.0.0",
  CORS_ORIGINS: parseCorsOrigins(),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DATABASE_SSL: resolveDatabaseSsl(),
  REDIS_URL: process.env.REDIS_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
} as const;
