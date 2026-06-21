# Database

PostgreSQL schema, migrations, and seed data for the Steel Trade Intelligence Platform.

## Structure

```
database/
├── schema/       # Reference SQL schema documentation
├── migrations/   # Versioned migration files
└── seeds/        # Development and reference seed data
```

Migrations are versioned SQL files in `database/migrations/`. The runner tracks applied versions in `schema_migrations`.

## Usage

Start PostgreSQL (e.g. via Docker Compose):

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres
```

Run migrations:

```bash
./scripts/migrate.sh
```

Seed development data:

```bash
./scripts/seed-dev.sh
```

Set `DATABASE_URL` in `.env` or rely on the default `postgresql://stip:stip@localhost:5432/stip_dev`.

Migrations require the `psql` client.
