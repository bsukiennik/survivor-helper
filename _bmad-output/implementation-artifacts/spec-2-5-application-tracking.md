---
title: 'Application Tracking'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '40c464a89abe96631c6f9bc6dabeda9f02a56cdd'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Job Seeker can Catch/Apply (Story 2.3) and see their badge progress (2.4), but has no way to see the list of Listings they've actually applied to, or each one's status — the last piece of Epic 2's loop.

**Approach:** Add `GET /me/applications` (same controller/resource as the existing `POST`) that joins `applications` to `listings` — this codebase's first Drizzle join — and returns each Application with enough Listing context (title, employer) to be meaningful, newest first. A `/applications` page renders the list or an explicit empty state.

## Boundaries & Constraints

**Always:**
- `ApplicationRepositoryPort` gains `findByJobSeekerWithListing(jobSeekerId): Promise<MyApplicationRow[]>` — `getDb().select(...).from(applicationsTable).innerJoin(listingsTable, eq(applicationsTable.listingId, listingsTable.id)).where(eq(applicationsTable.jobSeekerId, jobSeekerId)).orderBy(desc(applicationsTable.createdAt))`. Each row carries `id, listingId, listingTitle, employerName, status, createdAt`.
- `GET /me/applications` — a new `@Get()` handler on the existing `ApplicationController` (same `@Controller('me/applications')`, same class-level `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('JobSeeker')` — no new guard wiring). Always 200; zero rows is `[]`, not an error.
- Scoped strictly to `@CurrentUser().id` — never accepts or trusts a job-seeker id from the request.
- `status` is displayed as the raw persisted string (`text`, not an enum) — no status-to-label mapping in this story; Epic 3 may add values later with no schema change here.
- Frontend: new `/applications` page (mirrors `BadgesPage.tsx`'s auth-gate/load pattern) — a populated list, or an explicit empty state ("Aucune candidature pour l'instant") when the array is empty, never treated as an error. Header gets a "Mes candidatures" link alongside "Mon profil"/"Mes badges".
- This story is independently testable using seeded `applications` rows with arbitrary `status` values — no dependency on Epic 3's triage existing.

**Ask First:** none anticipated.

**Never:**
- No pagination, filtering, or sorting controls — newest-first, full list, v1 only.
- No write path here — this story never updates `status` (Epic 3, Story 3.4 owns that).
- No Listing detail beyond `title`/`employerName` on the list item (no description/location — that's the map's job).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Has applications | `GET /me/applications`, authenticated JobSeeker, 3 prior catches | 200, array of 3, newest first, each with `listingTitle`/`employerName`/`status` | N/A |
| No applications yet | Fresh account, 0 catches | 200, `[]` | N/A — not an error |
| Seeded non-default status | An application row with `status` manually set to something other than `'submitted'` | 200, that row's `status` reflects the seeded value verbatim | N/A |
| No/invalid token | Missing or malformed bearer token | Rejected | 401 |
| Wrong role | Valid token, `role` ≠ `JobSeeker` | Rejected | 403 |
| Another Job Seeker's applications | Job Seeker A authenticated | Only A's own applications returned, never B's | N/A |

</frozen-after-approval>

## Code Map

- `application-repository.port.ts` (L20-32) — add `findByJobSeekerWithListing`; existing methods unaffected.
- `application.repository.ts` (`toDomain`, L63-71) — add the join query + row mapping; first `innerJoin`/`leftJoin` in this backend (zero matches today).
- `listing.schema.ts` (`listingsTable`, `title`/`employerName`) — join target.
- `application/application/get-my-badges.use-case.ts` — thin `execute(accountId)` pattern to mirror for `list-my-applications.use-case.ts` (same folder).
- `interfaces/application/application.controller.ts` — add a `@Get()` handler to this same class; no new controller/guard wiring.
- `interfaces/application/dto/badges-response.dto.ts` — `fromDomain` factory style to mirror for `dto/my-application.dto.ts`.
- `interfaces/application/application.module.ts` — add the new use case to `providers`.
- `apps/frontend/src/seeker/BadgesPage.tsx` — auth-gate/load/type-guard/empty-vs-error pattern to mirror for `MyApplicationsPage.tsx`.
- `router.tsx` (L18) — add `/applications`.
- `MapView.tsx` (L226-248, header nav links) — add "Mes candidatures".

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/application/ports/application-repository.port.ts` -- add `findByJobSeekerWithListing` -- exposes the join
- [x] `apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts` -- implement the join, newest-first -- this codebase's first join
- [x] `apps/backend/src/application/application/list-my-applications.use-case.ts` (+ spec) -- thin passthrough, mirrors `get-my-badges.use-case.ts`
- [x] `apps/backend/src/interfaces/application/{application.controller,dto/my-application.dto}.ts` (+ spec) -- `GET /me/applications` handler + list DTO
- [x] `apps/backend/src/interfaces/application/application.module.ts` -- wire the new use case
- [x] `apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts` -- integration test: seeded rows with mixed statuses, ordering, empty-account case, cross-account isolation
- [x] `apps/frontend/src/seeker/MyApplicationsPage.tsx` (+ spec) -- list + explicit empty state
- [x] `apps/frontend/src/router.tsx` -- add `/applications`
- [x] `apps/frontend/src/map/MapView.tsx` (+ spec) -- header link
- [x] Matrix Test Audit gap closed: `GET /me/applications`'s 401/403 rows had no live guard-stack test (only the sibling `POST` was covered in `application.auth.e2e.spec.ts`) — extended that file with 4 new cases for the `GET` route

**Acceptance Criteria:**
- Given a Job Seeker with one or more Applications, when they open "My Applications", then each is shown with its current status
- Given an Application's status was changed by an external/seeded process, when the Job Seeker next views the list, then the current status is reflected — no caching staleness
- Given a Job Seeker with no Applications, when they open the screen, then they see an empty state, not an error

## Verification

**Commands:**
- `docker compose up -d && TOKEN=$(curl -s -X POST http://localhost:3000/auth/register -H 'content-type: application/json' -d '{"email":"track@x.com","password":"correcthorsebattery"}' | jq -r .accessToken) && curl -s http://localhost:3000/me/applications -H "authorization: Bearer $TOKEN"` -- expected: `[]`
- `pnpm --filter backend test` -- expected: passing
- `pnpm --filter frontend test` -- expected: passing

**Manual checks (if no CLI):**
- Catch 2-3 Listings, open `/applications`, confirm titles/employers/status show correctly and newest catch is first.

## Suggested Review Order

**The join (this codebase's first)**

- Entry point: `findByJobSeekerWithListing` — scoped strictly to the caller's own id, newest-first with an `id` tiebreaker (added during review — `createdAt` alone isn't guaranteed unique).
  [`application.repository.ts:71`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts#L71)

- `MyApplicationRow` — the join's return shape.
  [`application-repository.port.ts:9`](../../apps/backend/src/application/ports/application-repository.port.ts#L9)

- Real proof of ordering and cross-account isolation against Postgres, not mocks.
  [`application.repository.spec.ts:227`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts#L227)

- Never leaks another Job Seeker's rows — the security-relevant case.
  [`application.repository.spec.ts:256`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts#L256)

**HTTP surface — same resource, new verb**

- `GET` added to the existing `ApplicationController` (same guard stack as the sibling `POST`) — no new controller, no new guard wiring.
  [`application.controller.ts:44`](../../apps/backend/src/interfaces/application/application.controller.ts#L44)

- `ListMyApplicationsUseCase` — thin passthrough, mirrors `GetMyBadgesUseCase`.
  [`list-my-applications.use-case.ts:14`](../../apps/backend/src/application/application/list-my-applications.use-case.ts#L14)

- Live 401/403 proof for the new `GET` route — the Matrix Test Audit caught this route had none (only the sibling `POST` was covered) before this file was extended.
  [`application.auth.e2e.spec.ts:72`](../../apps/backend/src/interfaces/application/application.auth.e2e.spec.ts#L72)

**Frontend**

- `MyApplicationsPage.tsx` — mirrors `BadgesPage.tsx`'s auth-gate/load pattern; explicit empty state, never an error.
  [`MyApplicationsPage.tsx:43`](../../apps/frontend/src/seeker/MyApplicationsPage.tsx#L43)

- `createdAt` now actually displayed — added during review; the data was fetched and validated but never rendered.
  [`MyApplicationsPage.tsx:127`](../../apps/frontend/src/seeker/MyApplicationsPage.tsx#L127)

- "Mes candidatures" header link, alongside "Mon profil"/"Mes badges" — completes Epic 2's nav.
  [`MapView.tsx:239`](../../apps/frontend/src/map/MapView.tsx#L239)
