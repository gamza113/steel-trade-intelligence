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

echo "Running database migrations against: $DATABASE_URL"

if command -v psql >/dev/null 2>&1; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

  for migration in "$ROOT_DIR/database/migrations"/*.sql; do
    if [[ ! -f "$migration" ]]; then
      continue
    fi

    version="$(basename "$migration" .sql)"
    applied="$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version'" | tr -d '[:space:]')"

    if [[ "$applied" == "1" ]]; then
      echo "Skipping already applied migration: $version"
      continue
    fi

    echo "Applying migration: $version"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (version) VALUES ('$version')"
  done
else
  echo "psql not found; using Node migration runner."
  node "$ROOT_DIR/scripts/migrate.mjs"
fi

echo "Migrations complete."
