# Deployment Guide

Production deployment for the Steel Trade Intelligence Platform (STIP) using **Vercel** (frontend) and **Railway** (API + PostgreSQL).

## Architecture

| Component | Platform | URL pattern |
|-----------|----------|-------------|
| React frontend (`@stip/web`) | Vercel | `https://your-app.vercel.app` |
| Express API (`@stip/api`) | Railway | `https://your-api.up.railway.app` |
| PostgreSQL | Railway | Internal `DATABASE_URL` (SSL) |

The frontend calls the API via `VITE_API_BASE_URL`. The API allows browser requests from origins listed in `CORS_ORIGIN` / `CORS_ORIGINS`.

---

## Prerequisites

- GitHub repository connected to Vercel and Railway
- Node.js 20+ and pnpm 9+ (for local build verification)
- Mapbox access token (for the companies map)

---

## 1. Railway — PostgreSQL

1. Create a new **Railway** project.
2. Add a **PostgreSQL** plugin/service.
3. Note the **public** connection variables (or use Railway’s private networking when API and DB are in the same project).
4. Railway provides `DATABASE_URL` automatically when you link the database to the API service.

**Compatibility:** The app uses standard PostgreSQL via `pg`, migration tracking in `schema_migrations`, and SSL in production (enabled automatically for Railway URLs or when `DATABASE_SSL=true`).

---

## 2. Railway — API service

### Create the service

1. Add a new service from the same GitHub repo.
2. **Root directory:** repository root (not `backend/`).
3. Railway reads `railway.toml` at the repo root.

### Build & start (from `railway.toml`)

| Phase | Command |
|-------|---------|
| Build | `pnpm install --frozen-lockfile && pnpm run build:api` |
| Release | `node scripts/migrate.mjs` (runs migrations) |
| Start | `pnpm run start:api` → `node backend/dist/server.js` |
| Health | `GET /health` |

### Required environment variables

Set in Railway → Service → Variables:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Provided when PostgreSQL is linked |
| `CORS_ORIGIN` | Vercel production URL, e.g. `https://your-app.vercel.app` |
| `JWT_SECRET` | Long random secret |

### Optional environment variables

| Variable | Description |
|----------|-------------|
| `CORS_ORIGINS` | Comma-separated list for preview URLs |
| `DATABASE_SSL` | `true` / `false` (auto-detected for Railway) |
| `DATABASE_POOL_MAX` | Connection pool size (default `10`) |
| `API_HOST` | Default `0.0.0.0` |
| `REDIS_URL` | Future use |

**Note:** Railway sets `PORT` automatically. Do not set `API_PORT` in production.

Template: `backend/.env.production.example`

### Verify API

```bash
curl https://your-api.up.railway.app/health
```

Expected:

```json
{
  "status": "ok",
  "service": "stip-api",
  "database": "connected"
}
```

### Manual migrations (if needed)

```bash
DATABASE_URL="postgresql://..." node scripts/migrate.mjs
```

---

## 3. Vercel — Frontend

### Create the project

1. Import the GitHub repo in **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Vercel uses `frontend/vercel.json` for install/build settings.

### Build settings (from `vercel.json`)

| Setting | Value |
|---------|-------|
| Install | `cd .. && pnpm install --frozen-lockfile` |
| Build | `cd .. && pnpm run build:web` |
| Output | `dist` |
| SPA routing | All routes → `index.html` |

### Required environment variables

Set in Vercel → Settings → Environment Variables (Production):

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | `https://your-api.up.railway.app/api/v1` |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox public token |

Template: `frontend/.env.production.example`

**Important:** `VITE_*` variables are embedded at build time. Redeploy after changing them.

### Preview deployments

Add preview URLs to Railway `CORS_ORIGINS`:

```
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-git-branch.vercel.app
```

---

## 4. Local production smoke test

```bash
pnpm install
pnpm run build:check

# API
export NODE_ENV=production
export DATABASE_URL=postgresql://stip:stip@localhost:5432/stip_dev
export CORS_ORIGIN=http://localhost:4173
pnpm run start:api

# Frontend (separate terminal)
cd frontend && pnpm preview
```

Set `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

## 5. Build commands reference

| Command | Description |
|---------|-------------|
| `pnpm run build` | Full monorepo production build |
| `pnpm run build:api` | Shared packages + API |
| `pnpm run build:web` | Shared types + frontend |
| `pnpm run build:check` | Alias for full build (CI) |
| `pnpm run start:api` | Start compiled API |

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors in browser | Set `CORS_ORIGIN` to exact Vercel URL (no trailing slash) |
| `DATABASE_URL is not configured` | Link PostgreSQL to API service on Railway |
| SSL / connection errors | Ensure `DATABASE_SSL=true` or Railway URL is used |
| Map shows “Set VITE_MAPBOX_ACCESS_TOKEN” | Add token in Vercel env vars and redeploy |
| API 404 on Vercel | API runs on Railway; frontend must use full `VITE_API_BASE_URL` |
| Migrations not applied | Check Railway deploy logs for `releaseCommand` or run `migrate.mjs` manually |
| Health `degraded` | Database not reachable; verify `DATABASE_URL` and SSL |

---

## 7. Security checklist

- [ ] Strong `JWT_SECRET` on Railway
- [ ] `CORS_ORIGIN` restricted to your Vercel domain(s)
- [ ] Mapbox token restricted by URL referrer in Mapbox dashboard
- [ ] Do not commit `.env` files with secrets
- [ ] Railway PostgreSQL not exposed publicly unless required

---

## File reference

| File | Purpose |
|------|---------|
| `railway.toml` | Railway build, release, start, healthcheck |
| `frontend/vercel.json` | Vercel monorepo build + SPA rewrites |
| `backend/.env.production.example` | API production env template |
| `frontend/.env.production.example` | Frontend production env template |
| `scripts/migrate.mjs` | Node migration runner (Railway release) |
