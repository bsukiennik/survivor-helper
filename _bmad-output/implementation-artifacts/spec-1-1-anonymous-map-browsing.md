---
title: 'Anonymous Map Browsing'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'ad18f274ddc8582c4ddbafca6f44207c044c781e'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GéoEmploi has no product yet — visitors have no way to browse job listings on a map without an account, which the ministry made a priority, free-browsing requirement (PRD FR1). This is also the first story: no monorepo, no backend, no frontend exist yet.

**Approach:** Bootstrap the hexagonal monorepo (NestJS backend, Vite+React frontend) with a minimal `Listing` domain entity, a public `GET /listings` endpoint, a backend tile-proxy endpoint (so the frontend never calls the map provider directly), and a Leaflet map on the frontend rendering markers from real seeded data — no authentication anywhere on this path.

## Boundaries & Constraints

**Always:**
- Follow the hexagonal layout from the architecture spine: `apps/backend/src/{domain,application,infrastructure,interfaces}`; `apps/frontend/src` for the Vite+React SPA.
- `Listing` is a domain entity with at least: `id` (UUID), `title`, `employerName`, `description`, `latitude`, `longitude`, `status` (`published|archived|lapsed|removed` — only `published` used yet).
- `GET /listings` (interfaces layer) requires no authentication and returns only `published` Listings.
- Frontend never calls the OSM tile provider directly — it requests tiles from a backend proxy endpoint (no caching/metrics logic yet, that's a later story).
- Stack: NestJS 12.0.1 (ESM), TypeScript 6.0.3 (not 7.x), Drizzle ORM 0.45.2 + PostgreSQL 18.6 via Docker Compose, Vite 8.2.2 + React 19.2.8 + Tailwind 4.3.3, Leaflet for the map.
- No secrets hardcoded; `.env.example` lists every required var from the start.

**Ask First:** none anticipated — this is scaffolding plus one well-defined read path.

**Never:**
- No authentication/JWT setup in this story (that's Story 2.1).
- No tile caching or hit/miss metrics (Epic 7).
- No consent gate / device geolocation request yet (Story 1.3) — the map defaults to a fixed France-wide center view.
- No Listing creation/write path (Epic 3) — seed data only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Unauthenticated GET `/listings` | 200, JSON array of `published` Listings | N/A |
| No listings yet | DB has zero `published` rows | 200, empty array — frontend shows map with no markers, not an error | N/A |
| Archived/removed excluded | DB has non-`published` rows | Those rows never appear in the response | N/A |
| Tile proxy failure | Backend tile proxy fails to reach OSM | Frontend map still renders (no crash); tile layer degrades gracefully | Proxy returns 502; frontend does not blank the whole page |

</frozen-after-approval>

## Code Map

- (none — greenfield repo, no existing code to reuse or investigate)

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `pnpm-workspace.yaml` (or npm workspaces) -- monorepo root with `apps/frontend`, `apps/backend` -- foundation for everything else
- [x] `docker-compose.yml` -- PostgreSQL 18.6 service, backend, frontend -- local-only run, no external account (sovereignty)
- [x] `apps/backend` -- NestJS 12 app scaffold (ESM), `.env.example` -- backend skeleton
- [x] `apps/backend/src/domain/listing/listing.entity.ts` -- `Listing` domain type -- core entity, no framework deps
- [x] `apps/backend/src/infrastructure/persistence/drizzle/listing.schema.ts` + migration -- Drizzle table for `listings` -- persistence adapter
- [x] `apps/backend/src/infrastructure/persistence/drizzle/seed.ts` -- seeds a handful of realistic Listings (France-wide) -- gives the map something to show
- [x] `apps/backend/src/interfaces/listings/listings.controller.ts` -- `GET /listings`, no auth guard -- realizes FR1/FR2 read path
- [x] `apps/backend/src/interfaces/tiles/tiles.controller.ts` -- `GET /tiles/:z/:x/:y` proxying to OSM, passthrough only -- keeps the tile provider off the frontend (AD-3)
- [x] `apps/frontend` -- Vite + React 19 + TypeScript + Tailwind scaffold -- frontend skeleton
- [x] `apps/frontend/src/map/MapView.tsx` -- Leaflet map, fixed France-wide default center, fetches `/listings`, renders markers, uses the backend tile proxy URL -- realizes FR1

**Acceptance Criteria:**
- Given `docker compose up`, when the stack starts, then Postgres, backend, and frontend all come up with no external account of any kind
- Given a visitor with no account, when they load the frontend, then they see a map with markers for every seeded `published` Listing, no login prompt
- Given the map is loading on a standard connection, when measured, then time to usable render is under 3 seconds
- Given the app runs on a mobile-width and a desktop-width viewport, when the map renders, then it is usable on both

## Design Notes

Keep the tile proxy a dumb passthrough (`fetch` the OSM tile, stream it back) — no cache, no headers logic beyond content-type. Epic 7 Story 7.5 adds caching and hit/miss counters on top of this same endpoint; don't build that now.

## Verification

**Commands:**
- `docker compose up -d && curl -s http://localhost:PORT/listings` -- expected: 200, JSON array with seeded Listings
- `pnpm --filter backend test` / `pnpm --filter frontend test` -- expected: passing (scaffold-level tests only at this stage)

**Manual checks (if no CLI):**
- Open the frontend in a browser, confirm markers render and the map is pannable/zoomable

## Suggested Review Order

**Domain & entry point**

- Single source of truth for Listing status, derived by the DTO instead of duplicated — start here to see the hexagonal core.
  [`listing.entity.ts:9`](../../apps/backend/src/domain/listing/listing.entity.ts#L9)

- The one use case this story exposes — no framework imports, calls the port only.
  [`get-published-listings.use-case.ts:14`](../../apps/backend/src/application/listing/get-published-listings.use-case.ts#L14)

**Persistence: the published-only guarantee**

- The actual filter enforcing "only published Listings are ever returned" — the line review flagged as untested.
  [`listing.repository.ts:14`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.repository.ts#L14)

- New real-Postgres test proving the filter, added during the patch pass — not hermetic, needs a running DB.
  [`listing.repository.spec.ts`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.repository.spec.ts)

- Seed script made genuinely idempotent (deterministic UUIDs + `onConflictDoNothing`) after a check-then-insert race was found.
  [`seed.ts`](../../apps/backend/src/infrastructure/persistence/drizzle/seed.ts)

**Tile proxy: keeping the map provider off the frontend**

- Passthrough fetch with a real User-Agent contact (env-driven) and a timeout, per AD-3/OSM policy.
  [`osm-tile-provider.adapter.ts:24`](../../apps/backend/src/infrastructure/mapping/osm-tile-provider.adapter.ts#L24)

- New bounds check rejecting negative/out-of-zoom tile coordinates before they reach OSM.
  [`tile-coordinates.ts:10`](../../apps/backend/src/interfaces/tiles/tile-coordinates.ts#L10)

- 400 on invalid coordinates, 502 on upstream failure — both now covered by `tiles.controller.spec.ts`.
  [`tiles.controller.ts:30`](../../apps/backend/src/interfaces/tiles/tiles.controller.ts#L30)

**Frontend map: resilience on bad/missing data**

- Filters out non-finite lat/lng before rendering — one malformed Listing can no longer crash the whole map.
  [`MapView.tsx:42`](../../apps/frontend/src/map/MapView.tsx#L42)

- Fetch-failure path (map still renders, amber banner shown) — now covered by the new failure-path tests.
  [`MapView.tsx:68`](../../apps/frontend/src/map/MapView.tsx#L68)

- New error boundary wrapping the map so a render exception doesn't blank the page.
  [`ErrorBoundary.tsx:24`](../../apps/frontend/src/ErrorBoundary.tsx#L24)
  [`main.tsx:14`](../../apps/frontend/src/main.tsx#L14)

**Peripherals: boot/process hardening**

- `PORT` validation, global `ValidationPipe`, and an explicit `bootstrap().catch()` instead of a silent exit.
  [`main.ts:8`](../../apps/backend/src/main.ts#L8)

- pg pool now has an `'error'` listener; `migrate.ts`/`seed.ts` close the pool on failure instead of hanging.
  [`db.ts`](../../apps/backend/src/infrastructure/persistence/drizzle/db.ts)
