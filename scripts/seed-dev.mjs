import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), "../backend/package.json"));
const pg = require("pg");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const seedsDir = path.join(rootDir, "database/seeds");

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://stip:stip@localhost:5432/stip_dev";

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const files = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(seedsDir, file), "utf8").trim();
      if (!sql || sql.startsWith("--")) {
        continue;
      }

      console.log(`Running seed: ${file}`);
      await client.query(sql);
    }

    console.log("Seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
