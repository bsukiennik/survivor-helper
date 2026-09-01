---
title: 'Catch Interaction & Direct Application'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '976fb9e42bb0e08a5902a025b08999518cefb5aa'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Job Seeker can browse the map (Epic 1) and has a profile (Story 2.2), but there is no way to actually apply — `MapView.tsx`'s popup "Postuler" button is a disabled stub, and no `Application` record or use case exists yet.

**Approach:** Add an `applications` table + a single `ApplyToListing` domain use case (this codebase's first transactional use case) that, inside one `db.transaction()`, row-locks the Job Seeker's `accounts` row (`FOR UPDATE`) and inserts an Application, no-op on conflict. Expose it as `POST /me/applications`, and make the map popup's Apply button functional for authenticated Job Seekers, adding a visually distinct "Catch" control that calls the same endpoint as plain Apply.

## Boundaries & Constraints

**Always:**
- `applications` table: `id` (uuid PK, default random), `jobSeekerId` (uuid, FK → `accounts.id`), `listingId` (uuid, FK → `listings.id`), `status` (text, `notNull().default('submitted')` — Epic 3's triage use case is the only future writer of this column; this story never reads or transitions it), `createdAt` (timestamp w/ tz, default now). `UNIQUE(job_seeker_id, listing_id)`.
- `ApplyToListing` use case runs in one `db.transaction()`: `SELECT ... FOR UPDATE` on the caller's `accounts` row first (serializes concurrent catches by that Job Seeker — the lock Story 2.4 will reuse), then `insert(applications).values(...).onConflictDoNothing({ target: [applications.jobSeekerId, applications.listingId] }).returning()`. Return value distinguishes "created" vs "already existed" so the controller/frontend can tell catch from re-catch.
- Log via `new Logger(ApplyToListingUseCase.name)` — one line with jobSeekerId, listingId, timestamp — only when a row is actually created, never on the no-op path (AD-6).
- `POST /me/applications` (body `{ listingId: string }`, `@IsUUID()`), guarded by `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('JobSeeker')` — first live route to stack both guards. Non-existent OR non-`published` `listingId` → 404 before the transaction opens (look up the Listing first; the map only ever shows `published` Listings, so this matches the only visibility path that exists).
- Frontend: popup keeps a plain "Postuler" affordance and adds a visually distinct "Catch" affordance (e.g. accent styling/icon) — both call the same `authFetch(POST /me/applications)`; a re-click on an already-caught Listing shows "already caught" state, not an error.
- Employer's later view of an Application (Epic 3) joins live to `job_seeker_profiles` by `jobSeekerId` — "profile transmitted" is whatever is currently saved, not a snapshot frozen at apply time.

**Ask First:** none anticipated.

**Never:**
- No catch-count, badge, or Permis de Travail evaluation/display (Story 2.4) — only the row-lock + transaction boundary those need is built here.
- No Application `status` transitions beyond the inserted default (Epic 3, Story 3.4).
- No profile data copied onto the Application row.
- No employer notification (Epic 3, Story 3.3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First catch | `POST /me/applications {listingId}`, authenticated JobSeeker, Listing exists, no prior Application for this pair | 201, Application created, one log line emitted | N/A |
| Repeat catch | Same request again for the same pair | 200, no new row, no log line, `alreadyApplied: true` in response | N/A — silent no-op, not an error |
| Unknown listing | `listingId` not in `listings` | Request rejected before any transaction/lock | 404 |
| Non-published listing | `listingId` exists but `status` ≠ `published` (archived/lapsed/removed) | Request rejected before any transaction/lock, same as unknown | 404 |
| No/invalid token | Missing or malformed bearer token | Rejected | 401 |
| Wrong role | Valid token, `role` ≠ `JobSeeker` | Rejected | 403 |
| Concurrent catches, different listings, same Job Seeker | Two simultaneous `POST`s | Both succeed; serialized by the account row lock, no lost update | N/A |

</frozen-after-approval>

## Code Map

- `listing.entity.ts`, `listing.schema.ts` (`listingsTable`, uuid PK) — FK target for `listingId`; `listing-repository.port.ts` — extend for the existence lookup.
- `account.schema.ts` (`accountsTable`) — FK target for `jobSeekerId`; `job-seeker-profile.schema.ts` shows the FK syntax to mirror.
- `db.ts` — `getDb()` singleton; add the new schema to its merge object.
- `jwt-auth.guard.ts` (`AuthenticatedUser`), `current-user.decorator.ts`, `roles.guard.ts` + `roles.decorator.ts` (`@Roles('JobSeeker')`) — first live route stacking both guards (`RolesGuard` today is only unit-tested, never wired to a real route).
- `interfaces/profile/{profile.controller,profile.module}.ts` — module/controller wiring pattern to mirror (imports `AuthGuardsModule`, providers = use case + port binding).
- `application/profile/save-my-profile.use-case.ts`, `infrastructure/persistence/drizzle/job-seeker-profile.repository.ts` — thin use-case/port/adapter pattern to mirror; no `.transaction(`/`.for('update')` exists anywhere yet — this use case is the first.
- `interfaces/tiles/tiles.controller.ts` (`new Logger(ClassName.name)`) — only existing `Logger` precedent, mirror for the AD-6 line.
- `interfaces/profile/dto/save-profile.dto.ts` — DTO decorator convention to mirror for `catch.dto.ts`.
- `migrations/0003_fantastic_wendell_vaughn.sql` + `migrations/meta/_journal.json` — migration naming pattern (`pnpm db:generate` / `db:migrate`).
- `apps/frontend/src/map/MapView.tsx` — `ListingDto` (~L31), popup render loop (~L228), disabled `Postuler` stub (~L249, explicitly this story's boundary); `auth`/`readStoredAuth()` (~L82) already gates other UI by login state.
- `router.tsx`, `seeker/auth-token.ts` (`authFetch`) — reuse as-is; no new route needed.

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/domain/application/application.entity.ts` -- plain interface (`id`, `jobSeekerId`, `listingId`, `status`, `createdAt`), AD-1 style -- mirrors `job-seeker-profile.entity.ts`
- [x] `apps/backend/src/infrastructure/persistence/drizzle/application.schema.ts` -- `applicationsTable` + migration via `pnpm db:generate` -- persists the invariant (`UNIQUE(job_seeker_id, listing_id)`)
- [x] `apps/backend/src/infrastructure/persistence/drizzle/db.ts` -- add the new schema to the merge object -- makes the table queryable via `getDb()`
- [x] `apps/backend/src/application/ports/application-repository.port.ts` + `infrastructure/persistence/drizzle/application.repository.ts` -- port/adapter exposing the transactional row-lock-then-insert operation
- [x] `apps/backend/src/application/application/apply-to-listing.use-case.ts` (+ spec) -- the transaction: lock account row, verify listing exists, insert-or-no-op, log on creation only
- [x] `apps/backend/src/interfaces/application/{application.controller,application.module,dto/catch.dto.ts}.ts` -- `POST /me/applications`, `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('JobSeeker')`
- [x] `apps/backend/src/app.module.ts` -- wire the new module
- [x] `apps/frontend/src/map/MapView.tsx` -- replace the disabled stub with a working "Postuler" + a visually distinct "Catch" control, both posting to `/me/applications`, handling `alreadyApplied`
- [x] Unit tests for the I/O matrix (use-case: create, no-op, concurrent-lock behavior with two sequential transactions; controller/e2e: 401/403/404/201/200) -- 401/403 initially had no live-route coverage (only generic mocked-guard specs); added `apps/backend/src/interfaces/application/application.auth.e2e.spec.ts` (real supertest against the actual guard stack) to close the gap

**Acceptance Criteria:**
- Given an authenticated Job Seeker viewing an unclaimed Listing, when they Catch or plain-Apply, then an Application row is created and logged exactly once
- Given a Listing they already caught, when they Catch again, then no duplicate Application is created and no error is shown
- Given an Employer or Administrator token, when they call `POST /me/applications`, then the request is rejected with 403
- Given two catches on different Listings by the same Job Seeker arrive concurrently, when both are processed, then both succeed and the account-row lock serializes them (no lost update)

## Spec Change Log

- **Trigger:** blind-hunter review flagged that the pre-transaction existence check (`findById`) accepted a Listing regardless of `status`, so a crafted request could catch an archived/lapsed/removed Listing — not reachable via the actual map UI (which only ever shows `published` Listings), and not violating any stated Acceptance Criterion, but two genuinely defensible readings existed (strict published-only vs. permissive any-existing-listing), so it was surfaced to the human rather than silently patched.
- **Amended:** the `Always` bullet on `POST /me/applications` (Boundaries & Constraints) and the I/O & Edge-Case Matrix now specify non-`published` as a 404, same as non-existent. Code: `apply-to-listing.use-case.ts`'s existence check now also rejects `listing.status !== 'published'`; `listing-repository.port.ts`'s `findById` doc-comment corrected to no longer claim "any status" is the deliberate design (that was the implementer's own unauthorized rationale for the very gap this entry closes).
- **Known-bad state avoided:** a scripted/malicious client could otherwise apply to a Listing that was never visible through any legitimate path in the product.
- **KEEP:** `findById` itself stays status-agnostic at the repository/port layer (reusable for future admin/employer tooling) — only the use case enforces the published-only business rule. Do not push the status filter down into the repository.

## Design Notes

First transactional/row-lock use case in this codebase — the shape to establish:

```ts
await db.transaction(async (tx) => {
  await tx.select().from(accountsTable).where(eq(accountsTable.id, jobSeekerId)).for('update');
  const [row] = await tx.insert(applicationsTable).values({ jobSeekerId, listingId })
    .onConflictDoNothing({ target: [applicationsTable.jobSeekerId, applicationsTable.listingId] })
    .returning();
  return row ?? null; // null => already existed
});
```

Story 2.4 extends this same transaction body later (recompute count, evaluate thresholds) rather than adding a second write path — keep it easy to extend, don't build that logic now.

## Verification

**Commands:**
- `docker compose up -d && TOKEN=$(curl -s -X POST http://localhost:3000/auth/register -H 'content-type: application/json' -d '{"email":"catch@x.com","password":"correcthorsebattery"}' | jq -r .accessToken) && LISTING_ID=$(curl -s http://localhost:3000/listings | jq -r '.[0].id') && curl -s -X POST http://localhost:3000/me/applications -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "{\"listingId\":\"$LISTING_ID\"}"` -- expected: 201, then repeating the same call -- expected: 200 with `alreadyApplied: true`
- `pnpm --filter backend test` -- expected: passing
- `pnpm --filter frontend test` -- expected: passing

**Manual checks (if no CLI):**
- Register/log in, open the map, Catch a Listing, reload, Catch it again — confirm no duplicate/error, and that the popup reflects "already caught".

## Suggested Review Order

**Transaction & row lock (the core design decision)**

- Entry point: this codebase's first `db.transaction()` + `FOR UPDATE` row lock — lock the account row, then insert-or-no-op on the unique pair.
  [`application.repository.ts:17`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts#L17)

- The `UNIQUE(job_seeker_id, listing_id)` constraint the insert's `onConflictDoNothing` targets.
  [`application.schema.ts:25`](../../apps/backend/src/infrastructure/persistence/drizzle/application.schema.ts#L25)

- A raw second Postgres client proves the lock genuinely blocks a concurrent transaction, not just that two different listings both succeed — see the caveat comment on the implicit FK-check lock.
  [`application.repository.spec.ts:136`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts#L136)

- The original (weaker) concurrency test — two different listings both succeed; kept alongside the stronger lock test above.
  [`application.repository.spec.ts:118`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts#L118)

**Use case orchestration**

- Pre-transaction existence check (404 before any lock opens), then delegates to the repository, then logs only on actual creation (AD-6).
  [`apply-to-listing.use-case.ts:38`](../../apps/backend/src/application/application/apply-to-listing.use-case.ts#L38)

- Existence check happens via `findById`, not `findPublished` — deliberately status-agnostic today; flagged to the human as an open question (see conversation), not silently resolved.
  [`listing.repository.ts:19`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.repository.ts#L19)

- Unit coverage: create-and-log, no-op-and-no-log, 404-before-transaction.
  [`apply-to-listing.use-case.spec.ts:51`](../../apps/backend/src/application/application/apply-to-listing.use-case.spec.ts#L51)

**HTTP surface — first route stacking both guards**

- `JwtAuthGuard` + `RolesGuard` + `@Roles('JobSeeker')` stacked live for the first time in this codebase (previously guard-unit-tested only).
  [`application.controller.ts:34`](../../apps/backend/src/interfaces/application/application.controller.ts#L34)

- Maps `ListingNotFoundError` to 404; 201 vs 200 chosen by whether the use case actually created a row.
  [`application.controller.ts:46`](../../apps/backend/src/interfaces/application/application.controller.ts#L46)

- Live end-to-end proof of the 401/403 rows the unit-level guard specs can't cover for this specific route (a gap the Matrix Test Audit caught and this file closes).
  [`application.auth.e2e.spec.ts:35`](../../apps/backend/src/interfaces/application/application.auth.e2e.spec.ts#L35)

**Frontend — making the popup functional**

- `handleApply` posts to the same endpoint for both affordances; buttons disable during `submitting` to prevent double-fire.
  [`MapView.tsx:101`](../../apps/frontend/src/map/MapView.tsx#L101)

- The visually distinct "Catch" control (🎣) vs. the plain "Postuler" — both call the identical handler.
  [`MapView.tsx:307`](../../apps/frontend/src/map/MapView.tsx#L307)

- Repeat-catch renders "Déjà postulé" instead of an error, matching the spec's silent-no-op boundary.
  [`MapView.tsx:285`](../../apps/frontend/src/map/MapView.tsx#L285)

**Peripherals**

- New `applications` table + FKs to `accounts`/`listings`.
  [`0004_bizarre_virginia_dare.sql`](../../apps/backend/src/infrastructure/persistence/drizzle/migrations/0004_bizarre_virginia_dare.sql#L1)

- `ListingRepositoryPort` gained a required `findById` — pre-existing mocks updated to conform (a type-safety gap this review caught, since spec files are excluded from `tsc`).
  [`listing-repository.port.ts:12`](../../apps/backend/src/application/ports/listing-repository.port.ts#L12)

- OpenAPI coverage for all four real outcomes of the route (201/200/401/403/404).
  [`application.controller.ts:36`](../../apps/backend/src/interfaces/application/application.controller.ts#L36)

- Module wiring — binds its own port providers rather than importing `ListingsModule`, mirroring `profile.module.ts`'s shape.
  [`application.module.ts:24`](../../apps/backend/src/interfaces/application/application.module.ts#L24)
