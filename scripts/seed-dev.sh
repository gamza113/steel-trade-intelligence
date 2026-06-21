#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -f "$ROOT_DIR/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/backend/.env"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-postgresql://stip:stip@localhost:5432/stip_dev}"
export DATABASE_URL

echo "Seeding development database: $DATABASE_URL"

if command -v psql >/dev/null 2>&1; then
  for seed in "$ROOT_DIR/database/seeds"/*.sql; do
    if [[ ! -f "$seed" ]]; then
      continue
    fi

    echo "Running seed: $(basename "$seed")"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$seed"
  done
else
  echo "psql not found; using Node seed runner."
  node "$ROOT_DIR/scripts/seed-dev.mjs"
fi

echo "Seed complete."
