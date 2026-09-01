---
title: 'View Listing Details Without an Account'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
route: 'one-shot'
---

# View Listing Details Without an Account

## Intent

**Problem:** Story 1.1 shipped a bare title/employer popup on map markers — visitors can't yet see a Listing's full public detail (FR2), and there's no visible boundary showing that applying requires an account.

**Approach:** Add a `location` (city) field across the domain entity/DB/DTO/frontend, expand the marker Popup to show title, employer, location, and description, and add a disabled, accessible "Apply" affordance explaining the account requirement. Along the way, fixed a real Docker/host file-ownership issue (root-owned build output blocking native `pnpm build`/`pnpm test` after `docker compose up`) discovered while re-verifying — both Dockerfiles now run as the non-root `node` user.

## Suggested Review Order

**Domain → DB → API: the new `location` field**

- Domain shape — start here.
  [`listing.entity.ts:16`](../../apps/backend/src/domain/listing/listing.entity.ts#L16)

- Schema column + migration (`NOT NULL`, no default — see README note on wiping the dev volume).
  [`listing.schema.ts:20`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.schema.ts#L20)
  [`0001_lowly_norman_osborn.sql`](../../apps/backend/src/infrastructure/persistence/drizzle/migrations/0001_lowly_norman_osborn.sql)

- Repository mapping and DTO, now covered end-to-end by a repository-level assertion (patch from review).
  [`listing.repository.ts:20`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.repository.ts#L20)
  [`listing.dto.ts:27`](../../apps/backend/src/interfaces/listings/dto/listing.dto.ts#L27)

**Frontend: the detail popup**

- Full detail + disabled Apply button, made screen-reader-accessible via `aria-describedby` instead of a hover-only `title` tooltip.
  [`MapView.tsx:111`](../../apps/frontend/src/map/MapView.tsx#L111)

- New test opening the popup (a real click, since react-leaflet only mounts Popup content once opened) and asserting the full detail renders.
  [`MapView.spec.tsx:35`](../../apps/frontend/src/map/MapView.spec.tsx#L35)

**Peripherals: Docker ownership fix (found during re-verification, not part of the original intent)**

- Both Dockerfiles now run as the non-root `node` user (uid 1000) instead of root.
  [`Dockerfile:13`](../../apps/backend/Dockerfile#L13)

- `dist/` pre-created node-owned at build time — otherwise Docker's anonymous-volume mountpoint defaults to root even under a non-root `USER`.
  [`Dockerfile:30`](../../apps/backend/Dockerfile#L30)

- `dist/` given its own anonymous volume (same pattern as `node_modules`) so container build output never lands on the host bind mount.
  [`docker-compose.yml:42`](../../docker-compose.yml#L42)
