---
title: 'Catch Count, Badges & Permis de Travail Unlock'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'a11646ee6f045bd1a6305bbf7f7916b0ee69d94d'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 2.3 built the Catch/Application pipeline but never surfaces progress — a Job Seeker has no way to see how many Listings they've caught, and the ministry's headline "Permis de Travail" unlock at the 10th catch doesn't exist yet.

**Approach:** Extend `ApplyToListingUseCase`'s existing transaction (Story 2.3's account-row lock) to recompute the authoritative catch count and evaluate the 10th-catch threshold atomically — no second write path. Add `GET /me/badges` for the standalone progress view, and surface the unlock distinctly in the Catch response. No intermediate badge ladder — the 10th catch is the only threshold (confirmed with the human; the PRD's `[ASSUMPTION]` on this was dropped).

## Boundaries & Constraints

**Always:**
- `DrizzleApplicationRepository.applyToListing` — on the created path only (never on no-op), inside the same `tx` that holds the account-row lock, run `SELECT count(*) FROM applications WHERE job_seeker_id = $1` and return it alongside the created `Application`. Return type becomes `{ application: Application; catchCount: number } | null`.
- `ApplyToListingUseCase` computes `permisDeTravailUnlocked = catchCount === 10` (only meaningful on the created path). When true, log a second, distinct `Logger` line (e.g. `Permis de Travail unlocked: jobSeekerId=...`) in addition to the existing AD-6 creation log.
- `ApplicationRepositoryPort` gains `countByJobSeeker(jobSeekerId: string): Promise<number>` — a plain (non-transactional) count via `getDb()`, reusing the same count-query shape as the in-transaction one, for the standalone badges view.
- `POST /me/applications` response gains `catchCount: number | null` and `permisDeTravailUnlocked: boolean` — both `null`/`false` on the no-op (already-caught) path, matching the existing `id: null` symmetry.
- New `GET /me/badges` (own controller, same guard stack `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('JobSeeker')`, same `ApplicationModule`) returns `{ catchCount: number, permisDeTravailUnlocked: boolean }` (`catchCount >= 10`) — always 200, a fresh account with 0 catches is not an error.
- Frontend: new `/badges` page (mirrors `ProfilePage.tsx`'s auth-gate/load pattern) showing catch count and, once unlocked, a distinct "Permis de Travail débloqué" state. Header gets a "Mes badges" link (mirrors "Mon profil"). `MapView.tsx`'s catch success message shows a visually distinct confirmation when the POST response's `permisDeTravailUnlocked` is true, instead of the routine "Candidature envoyée !".
- Exactly-once guarantee: two concurrent Catches by the same Job Seeker on different Listings crossing the 9th→10th threshold must yield exactly one `permisDeTravailUnlocked: true` — guaranteed by Story 2.3's existing account-row lock (`FOR UPDATE`) serializing both transactions; no new locking mechanism needed, only verify it holds under this extension.

**Ask First:** none anticipated.

**Never:**
- No intermediate badge milestones (1st, 5th, etc.) — confirmed dropped, 10th catch only.
- No persisted "badge awarded" flag/table — `permisDeTravailUnlocked` is always derived live from `catchCount >= 10`, never stored.
- No push/email notification for the unlock (out of scope; in-app response/page only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Catch below threshold | `POST /me/applications`, this is the Job Seeker's 3rd distinct catch | 201, `catchCount: 3`, `permisDeTravailUnlocked: false` | N/A |
| Catch is exactly the 10th | `POST /me/applications`, 9 prior distinct catches | 201, `catchCount: 10`, `permisDeTravailUnlocked: true`, distinct log line | N/A |
| Catch past the 10th | 11th+ distinct catch | 201, `catchCount: 11`, `permisDeTravailUnlocked: false` (already unlocked, not re-fired) | N/A |
| Repeat catch (no-op) | Same pair re-caught | 200, `catchCount: null`, `permisDeTravailUnlocked: false`, `alreadyApplied: true` | N/A |
| Badges view, no catches yet | `GET /me/badges`, fresh account | 200, `catchCount: 0, permisDeTravailUnlocked: false` | N/A |
| Concurrent 9th→10th race | Two different-Listing catches fire concurrently, 9 prior catches exist | Exactly one response has `permisDeTravailUnlocked: true`; the other has `catchCount: 11, permisDeTravailUnlocked: false` | N/A — never 0 or 2 unlocks |

</frozen-after-approval>

## Code Map

- `apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts` (`applyToListing`, L17) — extend the existing `db.transaction()` to count inside `tx` after the insert; add `countByJobSeeker` using `getDb()` — first use of `drizzle-orm`'s `count()` helper (`import { count, eq } from 'drizzle-orm'`, `db.select({ value: count() }).from(applicationsTable).where(...)`).
- `apps/backend/src/application/ports/application-repository.port.ts` — extend `applyToListing`'s return type; add `countByJobSeeker`.
- `apps/backend/src/application/application/apply-to-listing.use-case.ts` (`execute`, L38) — compute `permisDeTravailUnlocked`, extend return shape, second log line on unlock.
- `apps/backend/src/application/profile/get-my-profile.use-case.ts` — thin `execute(accountId)` pattern to mirror for the new `get-my-badges.use-case.ts`.
- `apps/backend/src/interfaces/application/{application.controller,application.module}.ts` — existing guard-stack/module wiring to mirror for a new `badges.controller.ts` (own `@Controller('me/badges')`, same module).
- `apps/backend/src/interfaces/application/dto/application-response.dto.ts` (`fromResult`) — extend with the two new fields.
- `apps/backend/src/interfaces/profile/dto/profile-response.dto.ts` — DTO convention to mirror for a new `badges-response.dto.ts`.
- `apps/frontend/src/seeker/ProfilePage.tsx` — auth-gate/load/error pattern to mirror for `BadgesPage.tsx`.
- `apps/frontend/src/router.tsx` — add `/badges`.
- `apps/frontend/src/map/MapView.tsx` — header "Mon profil" link (~L221) to mirror; `handleApply`'s success-message branch (~L101-120) to extend for the distinct unlock state.

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/application/ports/application-repository.port.ts` -- extend `applyToListing` return type + add `countByJobSeeker` -- exposes the count both transactionally and standalone
- [x] `apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts` -- in-transaction count on the created path; `countByJobSeeker` impl -- the atomic recompute this story is built around
- [x] `apps/backend/src/application/application/apply-to-listing.use-case.ts` (+ spec) -- `permisDeTravailUnlocked` derivation, distinct log line on unlock
- [x] `apps/backend/src/application/profile/get-my-badges.use-case.ts` (+ spec) -- mirrors `get-my-profile.use-case.ts`
- [x] `apps/backend/src/interfaces/application/{badges.controller,dto/badges-response.dto}.ts` (+ spec) -- `GET /me/badges`
- [x] `apps/backend/src/interfaces/application/application.module.ts` -- wire the new controller + use case
- [x] `apps/backend/src/interfaces/application/dto/application-response.dto.ts` -- extend `fromResult`/fields
- [x] `apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts` -- integration test: 9 seeded catches, two concurrent catches on new listings, assert exactly one `permisDeTravailUnlocked`
- [x] `apps/frontend/src/seeker/BadgesPage.tsx` (+ spec) -- catch count + unlock state
- [x] `apps/frontend/src/router.tsx` -- add `/badges`
- [x] `apps/frontend/src/map/MapView.tsx` (+ spec) -- header link; distinct catch-success UI on unlock

**Acceptance Criteria:**
- Given a Job Seeker who has caught N distinct Listings, when they view `/badges`, then the displayed count exactly equals their persisted Application count, computed server-side
- Given a Job Seeker's catch count reaches 10, when the 10th Catch is confirmed, then the response and UI surface the Permis de Travail unlock distinctly from a routine confirmation
- Given two Catches on different Listings by the same Job Seeker race across the 9th→10th threshold, when both are processed, then the unlock fires exactly once — never zero or two times

## Design Notes

Count query pattern (first use of `count()` in this codebase):
```ts
const [{ value }] = await tx.select({ value: count() })
  .from(applicationsTable)
  .where(eq(applicationsTable.jobSeekerId, jobSeekerId));
```
Run this inside `applyToListing`'s existing transaction, right after the insert succeeds — it sees the just-inserted row because it runs in the same `tx`, still holding Story 2.3's `FOR UPDATE` lock on the account row, which is what makes the 9th→10th race safe without any new locking.

## Verification

**Commands:**
- `docker compose up -d && TOKEN=$(curl -s -X POST http://localhost:3000/auth/register -H 'content-type: application/json' -d '{"email":"badges@x.com","password":"correcthorsebattery"}' | jq -r .accessToken) && curl -s http://localhost:3000/me/badges -H "authorization: Bearer $TOKEN"` -- expected: `{"catchCount":0,"permisDeTravailUnlocked":false}`
- `pnpm --filter backend test` -- expected: passing
- `pnpm --filter frontend test` -- expected: passing

**Manual checks (if no CLI):**
- Catch 10 distinct Listings as one Job Seeker; confirm the 10th shows a visibly different confirmation than the first 9, and `/badges` reflects the unlock afterward.

## Suggested Review Order

**Atomic count & threshold (the core design decision)**

- Entry point: the count recompute inside Story 2.3's existing account-row lock — first use of `count()` in this codebase.
  [`application.repository.ts:44`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts#L44)

- `countByJobSeeker` — the same count shape, standalone (no transaction), for the badges view.
  [`application.repository.ts:57`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.ts#L57)

- The shared threshold constant — deliberately one source of truth for both comparison operators (`===` vs `>=`), added during review after the two use cases each declared their own copy.
  [`permis-de-travail.constant.ts`](../../apps/backend/src/domain/application/permis-de-travail.constant.ts#L10)

- The real, non-shallow proof of the exactly-once guarantee: 9 seeded catches, 2 concurrent catches, asserts the sorted results are exactly `[10, 11]` — not just "both succeeded."
  [`application.repository.spec.ts:146`](../../apps/backend/src/infrastructure/persistence/drizzle/application.repository.spec.ts#L146)

**Use case orchestration**

- `permisDeTravailUnlocked = catchCount === 10` (fires once, never re-fires past it) plus the distinct AD-6 log line.
  [`apply-to-listing.use-case.ts:76`](../../apps/backend/src/application/application/apply-to-listing.use-case.ts#L76)

- `GetMyBadgesUseCase` — the `>= 10` persistent-status counterpart; moved here from `application/profile/` during review to match its actual module (it mirrored `GetMyProfileUseCase`'s code shape, not its folder).
  [`get-my-badges.use-case.ts:31`](../../apps/backend/src/application/application/get-my-badges.use-case.ts#L31)

**HTTP surface**

- `BadgesController` — same guard stack as `ApplicationController`, own controller for a distinct resource.
  [`badges.controller.ts:25`](../../apps/backend/src/interfaces/application/badges.controller.ts#L25)

- Live proof of the 401/403 rows through the real guard pipeline — the exact same class of gap the Story 2.3 review caught and fixed, this time on the new route.
  [`badges.auth.e2e.spec.ts:35`](../../apps/backend/src/interfaces/application/badges.auth.e2e.spec.ts#L35)

**Frontend — surfacing the unlock distinctly**

- The catch response's `permisDeTravailUnlocked` maps to a dedicated `unlocked` status, rendered distinctly from the routine confirmation; `aria-label` added on the emoji during review.
  [`MapView.tsx:298`](../../apps/frontend/src/map/MapView.tsx#L298)

- `BadgesPage.tsx` — the standalone progress view, mirroring `ProfilePage.tsx`'s auth-gate/load pattern.
  [`BadgesPage.tsx:28`](../../apps/frontend/src/seeker/BadgesPage.tsx#L28)

- "Mes badges" header link, alongside "Mon profil".
  [`MapView.tsx:236`](../../apps/frontend/src/map/MapView.tsx#L236)

**Peripherals**

- `ApplicationRepositoryPort.countByJobSeeker` — the new port method both call sites depend on.
  [`application-repository.port.ts:31`](../../apps/backend/src/application/ports/application-repository.port.ts#L31)
