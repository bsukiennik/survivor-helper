---
title: 'Publish a Geolocated Listing'
type: 'feature'
created: '2026-09-02'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'fa29f7651afa3c5684b3b1e5a54c809cbf90e1af'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Verified Employers (Story 3.1) have no way to actually publish a Listing — `ListingRepositoryPort` has zero write methods, `listings` has no owner/timestamp/radius columns, and nothing auto-archives an old Listing.

**Approach:** Add `POST /me/listings` (Employer-only, verification-gated) that creates a `published` Listing capped at the Standard tier's 10km radius (Premium is out of scope — ministry never specified its parameters). Add `employerId` to `listings` (a real FK, resolving the long-deferred "employerName is a bare string" gap now that employer accounts exist — and the ownership check Story 3.4's triage will need) and `createdAt`/`distributionRadiusKm` columns. Add this codebase's first scheduled job — an hourly sweep that archives any `published` Listing past 30 days — built as a small, reusable lifecycle facility so Story 3.6's 7-day lapse-removal can extend it later rather than duplicating the mechanism.

## Boundaries & Constraints

**Always:**
- `listings` gains `employerId` (uuid, FK → `accounts.id`, not null), `createdAt` (timestamp w/ tz, default now), `distributionRadiusKm` (real/double, not null). `employerName` stays a denormalized text snapshot (`employer_profiles.companyName` at publish time) — no live join added to the public `GET /listings` read path.
- `POST /me/listings` (`@UseGuards(JwtAuthGuard, RolesGuard) @Roles('Employer')`, own controller — `ListingsController`/`ListingsModule` stay untouched, their unauthenticated-by-design comment says so explicitly). Body: `title, location, description, latitude (@IsLatitude), longitude (@IsLongitude), distributionRadiusKm (@IsNumber @Min(0.1) @Max(10))`. The 10km cap is enforced by rejecting (400), not silently clamping — matches this codebase's preference for explicit rejection over silent rewrite (e.g. duplicate-email 409).
- The use case checks `employer_profiles.verificationStatus === 'verified'` before creating anything; `'pending'` → a domain error the controller maps to 403 with a clear message (Story 3.1's own AC: "blocked with a clear status message explaining why").
- Created Listing: `status: 'published'` always (AD-12) — it appears on `GET /listings` immediately via the existing `findPublished()`, no changes needed there.
- `ListingRepositoryPort` gains `create(input): Promise<Listing>` (first write method) and `archiveExpiredListings(): Promise<number>` (bulk `UPDATE ... SET status='archived' WHERE status='published' AND createdAt < now() - 30 days`, returns count — a real status mutation, never computed at query-time, per AD-12's explicit convention).
- The 30-day sweep is `@nestjs/schedule`'s `@Cron` (new dependency — adding one is an established, normal part of a story in this codebase), registered via `ScheduleModule.forRoot()` in `AppModule`, running hourly. Lives in `infrastructure/` (framework-coupled), calling an `ArchiveExpiredListingsUseCase` that just delegates to the repository method — kept generic/reusable so Story 3.6 can add a sibling `@Cron` method for lapse-removal later, not extend this one's logic.
- Cron-trigger wiring itself isn't deeply tested (impractical/flaky); the archival *business logic* (`archiveExpiredListings`) gets real integration-test coverage against seeded old/new Listings.

**Ask First:** none anticipated.

**Never:**
- No Subscription Tier field/selection anywhere in this story — every Employer is treated as Standard (hardcoded 10km cap); Premium has no defined parameters to enforce, and no story yet lets an Employer choose a tier.
- No 7-day lapse-removal logic (Story 3.6's job) — only the reusable scheduling shape is laid down.
- No live join for `employerName` display freshness — an Employer renaming their company later doesn't retroactively update already-published Listings (denormalized snapshot, deliberate).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Verified Employer publishes | Valid title/location/description/lat/lng/radius ≤10km, `verificationStatus: 'verified'` | 201, `status: 'published'`, appears on `GET /listings` | N/A |
| Pending (unverified) Employer | Same valid body, `verificationStatus: 'pending'` | Rejected with a clear message | 403 |
| Radius exceeds cap | `distributionRadiusKm: 15` | Rejected before any DB write | 400 |
| Invalid coordinates | `latitude: 200` (out of range) | Rejected before any DB write | 400 |
| No/invalid token | Missing or malformed bearer token | Rejected | 401 |
| Wrong role | Valid token, `role` ≠ `Employer` | Rejected | 403 |
| 30-day sweep | A `published` Listing with `createdAt` 31 days ago; another 5 days ago | Only the 31-day-old one transitions to `archived` and stops appearing on `GET /listings` | N/A |

</frozen-after-approval>

## Code Map

- `domain/listing/listing.entity.ts`, `infrastructure/persistence/drizzle/listing.schema.ts` — add `employerId`, `createdAt`, `distributionRadiusKm`; migration (`pnpm db:generate`, next idx after `0005`).
- `application/ports/listing-repository.port.ts` (`findPublished`, `findById`, L7-15) — add `create`, `archiveExpiredListings`; `infrastructure/persistence/drizzle/listing.repository.ts` — implement both, extend `toDomain`.
- `domain/profile/employer-profile.entity.ts`, `application/ports/employer-profile-repository.port.ts` (`findByAccountId`) — read-only reuse for the verification check; new `domain/profile/employer-not-verified.error.ts` alongside `employer-profile.entity.ts`.
- `interfaces/employer/employer-profile.controller.ts` + `employer.module.ts` — guard-stack and "bind own ports, don't import the writer's module" pattern to mirror.
- `interfaces/listings/listings.controller.ts` — read this first: its own comment says unauthenticated is deliberate. Add a sibling `my-listings.controller.ts` + `employer-listings.module.ts` in the same directory, don't touch `ListingsController`/`ListingsModule`.
- `interfaces/auth/auth.controller.ts` (`register`, L35-52) — the plain-`@Post()`-returns-201 pattern to mirror (no `Res()` juggling needed, unlike `ApplicationController.apply`'s idempotency-driven 200-vs-201).
- `interfaces/listings/dto/listing.dto.ts` — response DTO field-shape convention (`@ApiProperty`) to mirror for `create-listing.dto.ts` (request, needs `@IsLatitude`/`@IsLongitude`/`@Min`/`@Max` — first use of all four in this codebase) and `my-listing-response.dto.ts`.
- `apps/backend/package.json` — add `@nestjs/schedule`; `apps/backend/src/app.module.ts` — `ScheduleModule.forRoot()`.
- `infrastructure/persistence/drizzle/job-seeker-profile.repository.spec.ts` — real-Postgres seeding pattern to mirror for testing the 30-day sweep (seed Listings with an old `createdAt`, assert the sweep transitions only the right ones).

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/domain/listing/listing.entity.ts` + `infrastructure/persistence/drizzle/listing.schema.ts` -- add `employerId`/`createdAt`/`distributionRadiusKm` + migration
- [x] `apps/backend/src/application/ports/listing-repository.port.ts` + `infrastructure/persistence/drizzle/listing.repository.ts` (+ spec) -- `create`, `archiveExpiredListings`
- [x] `apps/backend/src/domain/profile/employer-not-verified.error.ts`
- [x] `apps/backend/src/application/listing/{publish-listing,archive-expired-listings}.use-case.ts` (+ specs) -- verification gate; archival sweep delegate
- [x] `apps/backend/src/interfaces/listings/{my-listings.controller,employer-listings.module,dto/create-listing.dto,dto/my-listing-response.dto}.ts` (+ specs) -- `POST /me/listings`
- [x] `apps/backend/package.json` -- add `@nestjs/schedule`; `apps/backend/src/infrastructure/scheduling/listing-archival.scheduler.ts` -- `@Cron` hourly, delegates to the use case
- [x] `apps/backend/src/app.module.ts` -- `ScheduleModule.forRoot()`, wire the new module
- [x] e2e auth-gate test for `POST /me/listings` (401/403), matching every prior story's review-required pattern
- [x] Integration test: seed Listings at various ages, run `archiveExpiredListings`, assert only >30-day-old `published` ones transition
- [x] Review round: fixed a broken migration (NOT NULL columns added with no default — fails against any non-empty `listings` table, reproduced and confirmed fixed), added cron error handling, extracted scheduler DI into its own module, added an `AppModule` DI-boot smoke test, a scheduler unit test, and a radius-floor validation test

**Acceptance Criteria:**
- Given a verified Employer, when they publish with a valid radius, then the Listing is `published` and visible on `GET /listings`
- Given an unverified Employer, when they try to publish, then they're blocked with a clear reason (403)
- Given a radius above 10km, when publishing, then the request is rejected (400) before anything is written
- Given a Listing older than 30 days, when the sweep runs, then it's `archived` and no longer on `GET /listings`

## Design Notes

First write path on `listings` — `create` mirrors `DrizzleApplicationRepository`'s plain-insert style (no transaction needed here; nothing else reads-then-writes this row). The archival sweep is a single bulk `UPDATE ... WHERE ... RETURNING`, not a select-then-loop.

## Verification

**Commands:**
- `docker compose up -d && TOKEN=$(curl -s -X POST http://localhost:3000/auth/register/employer -H 'content-type: application/json' -d '{"email":"emp@x.com","password":"correcthorsebattery","companyName":"Acme"}' | jq -r .accessToken) && curl -s -X POST http://localhost:3000/me/listings -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"title":"Test","location":"Paris","description":"d","latitude":48.85,"longitude":2.35,"distributionRadiusKm":5}'` -- expected: 403 (fresh account is `pending`, not `verified` — confirms the gate works)
- `pnpm --filter backend test` -- expected: passing

**Manual checks (if no CLI):**
- Seed an Employer's `verificationStatus` to `'verified'` directly, publish a Listing, confirm it appears on the map's `GET /listings`; seed a second Listing with `createdAt` 31 days in the past, run the archival use case directly, confirm it disappears from `GET /listings`.

## Suggested Review Order

**The migration fix (the bug all three review layers independently caught)**

- Entry point: `DELETE FROM "listings"` added before the `NOT NULL` columns — without it, this migration fails outright against any environment with pre-existing Listings (reproduced by hand: rolled back to the pre-3.2 schema, seeded an old-shape row, re-applied 0006, confirmed it failed before the fix and succeeds after).
  [`0006_dear_nighthawk.sql`](../../apps/backend/src/infrastructure/persistence/drizzle/migrations/0006_dear_nighthawk.sql#L1)

**Publish flow (verification gate + radius cap)**

- Entry point: the verification check — no Listing is ever created for a non-`verified` Employer.
  [`publish-listing.use-case.ts:42`](../../apps/backend/src/application/listing/publish-listing.use-case.ts#L42)

- `CreateListingDto` — first `@IsLatitude`/`@IsLongitude`/`@Min`/`@Max` usage in this codebase; the explicit-rejection (not silent clamp) design choice.
  [`create-listing.dto.ts:34`](../../apps/backend/src/interfaces/listings/dto/create-listing.dto.ts#L34)

- `MyListingsController` — own controller, `ListingsController` deliberately untouched.
  [`my-listings.controller.ts:32`](../../apps/backend/src/interfaces/listings/my-listings.controller.ts#L32)

- Full I/O matrix proven live: pending→403 (writes nothing), radius cap and floor →400, invalid latitude→400, success→201 with the `employerName` snapshot.
  [`my-listings.auth.e2e.spec.ts:134`](../../apps/backend/src/interfaces/listings/my-listings.auth.e2e.spec.ts#L134)

- 401/403 guard-stack proof, matching the pattern every prior story's review has required.
  [`my-listings.auth.e2e.spec.ts:47`](../../apps/backend/src/interfaces/listings/my-listings.auth.e2e.spec.ts#L47)

**This codebase's first scheduled job**

- The bulk `UPDATE ... RETURNING` — a real status mutation, not a query-time filter (AD-12).
  [`listing.repository.ts:64`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.repository.ts#L64)

- Real-Postgres proof it's a genuine mutation (a direct select still shows `archived` afterward) and that it only touches >30-day-old rows.
  [`listing.repository.spec.ts:211`](../../apps/backend/src/infrastructure/persistence/drizzle/listing.repository.spec.ts#L211)

- The `@Cron` handler — error-swallowing added during review (a failed sweep retries next hour instead of an invisible unhandled rejection).
  [`listing-archival.scheduler.ts:23`](../../apps/backend/src/infrastructure/scheduling/listing-archival.scheduler.ts#L23)

**Added during review**

- `AppModule` DI-boot smoke test — nothing previously booted the full app; a wiring mistake could crash `main.ts` on startup with every test still green.
  [`app.module.spec.ts:28`](../../apps/backend/src/app.module.spec.ts#L28)
