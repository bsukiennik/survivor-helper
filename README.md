# GéoEmploi

A map-first job board. This repo is a pnpm monorepo: `apps/backend` (NestJS,
hexagonal architecture) and `apps/frontend` (Vite + React SPA).

## Prerequisites

- Docker + Docker Compose
- Node.js 22+ and [pnpm](https://pnpm.io/) (via `corepack enable`) if you want
  to run things outside Docker (tests, `db:*` scripts, etc.)

## Quick start (Docker Compose)

```bash
docker compose up -d
```

This starts three services, all local, no external account of any kind:

- `db` — PostgreSQL 18.6
- `backend` — NestJS API on `http://localhost:3000`. On boot it runs the
  Drizzle migrations, then seeds a handful of realistic French listings
  (idempotently — safe to restart), then starts the server.
- `frontend` — Vite dev server on `http://localhost:5173`

Check it worked:

```bash
curl -s http://localhost:3000/listings
```

Then open `http://localhost:5173` in a browser — you should see a map of
France with markers for the seeded listings, no login required.

Stop everything with `docker compose down` (add `-v` to also drop the
Postgres volume and start clean next time).

## Running things outside Docker

Install dependencies once from the repo root:

```bash
pnpm install
```

Copy the env templates and adjust as needed:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

With a Postgres reachable at `DATABASE_URL` (e.g. `docker compose up -d db`
for just the database):

```bash
pnpm --filter backend db:migrate   # apply migrations
pnpm --filter backend db:seed      # seed sample listings (idempotent)
pnpm dev:backend                   # start the API with watch mode
pnpm dev:frontend                  # in another shell: start the Vite dev server
```

## Tests

```bash
pnpm --filter backend test
pnpm --filter frontend test
```

The backend's repository-layer test
(`src/infrastructure/persistence/drizzle/listing.repository.spec.ts`) is an
integration test against a real Postgres — it needs a reachable database
with the schema migrated (`docker compose up -d` handles both). It falls
back to `postgres://geoemploi:geoemploi@localhost:5432/geoemploi` if
`DATABASE_URL` isn't already set in your shell, which matches what
`docker compose up` exposes.

## Layout

```
apps/
  backend/   NestJS, hexagonal: domain/ application/ infrastructure/ interfaces/
  frontend/  Vite + React SPA
```

See `_bmad-output/planning-artifacts/architecture/` for the full
architecture spine and its invariants (AD-1..AD-15).
