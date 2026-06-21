import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closePool, getPool } from "./db/index.js";

const app = createApp();

async function verifyDatabaseConnection(): Promise<void> {
  if (!env.DATABASE_URL) {
    console.warn(
      "DATABASE_URL is not configured. API database routes will fail until it is set.",
    );
    return;
  }

  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    console.log("Database connection established.");
  } catch (err) {
    console.error(
      "Database connection failed. Start PostgreSQL and run ./scripts/migrate.sh",
    );
    console.error(err);
  }
}

await verifyDatabaseConnection();

const server = app.listen(env.API_PORT, env.API_HOST, () => {
  console.log(`STIP API listening on http://${env.API_HOST}:${env.API_PORT}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
