# Steel Trade Intelligence Platform (STIP)

Commercial-grade platform for managing worldwide steel suppliers, customers, supply-demand matching, and freight intelligence.

## Project Structure

```
steel-trade-intelligence/
├── frontend/     # React + TypeScript + MUI + Mapbox GL JS
├── backend/      # Node.js + Express API
├── database/     # PostgreSQL migrations, seeds, and schema docs
├── packages/     # Shared types and validation
├── infra/        # Docker and deployment configuration
├── docs/         # Architecture and API documentation
└── scripts/      # Development and deployment scripts
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

## Getting Started

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up -d
pnpm db:setup
pnpm dev
```

## Production deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel (frontend) and Railway (API + PostgreSQL).

```bash
pnpm run build:check   # verify production build locally
```
