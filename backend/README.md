# Backend (@stip/api)

Node.js + Express REST API.

## Structure

```
src/
├── config/       # Environment and configuration
├── middleware/   # Auth, RBAC, tenant, validation, errors
├── modules/      # Domain modules (routes → controller → service → repository)
├── jobs/         # Background workers (imports, matching, freight sync)
├── integrations/ # External APIs (Mapbox, freight providers, FX)
├── db/           # Database client
└── utils/        # Shared utilities
```

## Commands

```bash
pnpm dev        # Start API with hot reload (port 3001)
pnpm build      # Compile TypeScript
pnpm start      # Run compiled server
```

## Health Check

```
GET http://localhost:3001/health
```
