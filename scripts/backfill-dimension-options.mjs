import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.join(__dirname, "../backend/package.json"),
);
const pg = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://stip:stip@localhost:5432/stip_dev";

const DIMENSION_TYPES = ["thickness", "width", "length"];

function parseNumericToken(token) {
  const cleaned = token.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === ".") {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function isRangeIndicator(text) {
  return /[~～–—-]/.test(text) || /^max\.?\s*/i.test(text);
}

function extractSlashSeparatedOptions(text) {
  const trimmed = text.trim();
  if (!trimmed.includes("/") || isRangeIndicator(trimmed)) {
    return null;
  }

  const parts = trimmed.split("/").map((part) => part.trim());
  if (parts.length < 2) {
    return null;
  }

  const numbers = [];
  for (const part of parts) {
    if (!part) {
      return null;
    }
    const parsed = parseNumericToken(part);
    if (parsed === null) {
      return null;
    }
    numbers.push(parsed);
  }

  return uniqueSorted(numbers);
}

function parseDimensionText(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const slashOptions = extractSlashSeparatedOptions(trimmed);
  if (slashOptions && slashOptions.length >= 2) {
    return slashOptions;
  }

  let working = trimmed.replace(/^max\.?\s*/i, "").trim();

  const maxOnlyMatch = working.match(/^~+\s*([\d.,]+)\s*$/);
  if (maxOnlyMatch) {
    const max = parseNumericToken(maxOnlyMatch[1]);
    return max === null ? [] : [max];
  }

  const rangeMatch = working.match(
    /([\d.,]+)\s*(?:~|～|–|—|-)\s*([\d.,]+)/,
  );
  if (rangeMatch) {
    const min = parseNumericToken(rangeMatch[1]);
    const max = parseNumericToken(rangeMatch[2]);
    if (min !== null && max !== null) {
      return uniqueSorted([min, max]);
    }
  }

  const numbers = [...working.matchAll(/([\d.,]+)/g)]
    .map((match) => parseNumericToken(match[1]))
    .filter((value) => value !== null);

  if (
    numbers.length === 1 &&
    working.replace(/[\d.,\s~～–—\-]/g, "").length <= 2
  ) {
    return [numbers[0]];
  }

  return [];
}

function optionsFromStoredDimension(min, max, raw) {
  if (raw) {
    const reparsed = parseDimensionText(raw);
    if (reparsed.length > 0) {
      return reparsed;
    }
  }

  if (min !== null && max !== null) {
    return min === max ? [min] : uniqueSorted([min, max]);
  }

  if (min !== null) {
    return [min];
  }

  if (max !== null) {
    return [max];
  }

  return [];
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const products = await client.query(
      `SELECT id,
              thickness_min,
              thickness_max,
              width_min,
              width_max,
              length_min,
              length_max,
              thickness_raw,
              width_raw,
              length_raw
       FROM products`,
    );

    let inserted = 0;

    for (const product of products.rows) {
      for (const dimensionType of DIMENSION_TYPES) {
        const minKey = `${dimensionType}_min`;
        const maxKey = `${dimensionType}_max`;
        const rawKey = `${dimensionType}_raw`;

        const min =
          product[minKey] === null ? null : Number(product[minKey]);
        const max =
          product[maxKey] === null ? null : Number(product[maxKey]);
        const raw = product[rawKey];

        const options = optionsFromStoredDimension(min, max, raw);

        for (const value of options) {
          const result = await client.query(
            `INSERT INTO product_dimension_options (product_id, dimension_type, value)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, dimension_type, value) DO NOTHING`,
            [product.id, dimensionType, value],
          );
          if (result.rowCount > 0) {
            inserted += 1;
          }
        }
      }
    }

    console.log(
      `Backfill complete. Inserted ${inserted} dimension option row(s).`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
