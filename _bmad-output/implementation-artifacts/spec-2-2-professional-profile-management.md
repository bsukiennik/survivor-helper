---
title: 'Professional Profile Management'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 1
context: []
baseline_commit: '03246e6ceebd4ca5b9be74d8e7b3fe6c20d397be'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Job Seeker can register/log in (Story 2.1) but has no profile — nothing in the codebase can create/read `job_seeker_profiles`, and no route exists yet that requires "any authenticated account" (only role-restricted routes were designed via `RolesGuard`, which no-ops without `@Roles()`).

**Approach:** Add `job_seeker_profiles` (skills, experience, availability, 1:1 with `accounts` via `accountId`), a `GET/PUT /me/profile` pair, and a new `JwtAuthGuard` that verifies the bearer token and attaches `request.user` — the "must be logged in" guard nothing needed until now. `RolesGuard` is refactored to read `request.user` (set by `JwtAuthGuard`) instead of re-verifying the token itself, so role-restricted routes stack both guards. Frontend gets a `/profile` page and an `authFetch` helper that attaches the bearer token.

## Boundaries & Constraints

**Always:**
- `job_seeker_profiles` table: `accountId` (uuid, PK, FK → `accounts.id`), `skills` (text), `experience` (text), `availability` (text), `updatedAt`. One row per Job Seeker account — upsert, not insert-then-error.
- `JwtAuthGuard` verifies the bearer token and sets `request.user = { id, role }` (from the JWT's `sub`/`role`) — it does not check role, just "is this a valid token". `@CurrentUser()` param decorator reads it back in controllers.
- `RolesGuard` (Story 2.1) is refactored to depend on `request.user` (assumes `JwtAuthGuard` already ran) rather than verifying the JWT a second time — routes needing both stack `@UseGuards(JwtAuthGuard, RolesGuard)`.
- `GET /me/profile` and `PUT /me/profile` are gated by `JwtAuthGuard` only (any authenticated account manages *their own* profile row, keyed by `request.user.id` — no role check at this layer).
- Required fields (`skills`, `experience`, `availability`) enforced by DTO validation (`@IsString() @IsNotEmpty()`) — an incomplete save is rejected 400, nothing persisted.
- Frontend: `apps/frontend/src/seeker/ProfilePage.tsx` at `/profile`, redirects to `/login` if `readStoredAuth()` is empty on mount (no point showing a form that will 401).

**Ask First:** none anticipated.

**Never:**
- No role restriction on the profile endpoints beyond "authenticated" — an Employer/Admin *could* technically call it today (nothing in this story's scope stops them; Epic 3/5 haven't defined what "profile" even means for those roles). Out of scope to guard against here.
- No profile data on the Application yet (Story 2.3) — this story only creates/edits the row.
- No file upload (CV, photo) — free-text fields only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No profile yet | `GET /me/profile`, authenticated, no row exists | 200 with empty/null fields (not 404) — a fresh account has no profile yet, that's not an error | N/A |
| Save happy path | `PUT /me/profile` valid skills/experience/availability | 200, row upserted | N/A |
| Missing field | `PUT /me/profile` with `skills` empty | Nothing persisted | 400 with validation errors |
| No token | `GET or PUT /me/profile`, no bearer token | Request rejected | 401 |
| Invalid/expired token | `GET or PUT /me/profile`, bad token | Request rejected | 401 |

</frozen-after-approval>

## Code Map

- `apps/backend/src/interfaces/auth/roles.guard.ts` — refactor target: stop re-verifying the JWT, read `request.user` instead.
- `apps/backend/src/interfaces/auth/auth.controller.ts`, `auth.module.ts` — pattern to mirror for `interfaces/profile/`.
- `apps/backend/src/infrastructure/persistence/drizzle/account.schema.ts` — FK target + pgTable pattern to mirror.
- `apps/backend/src/application/account/register-account.use-case.ts` — port-injection pattern to mirror for the profile use cases.
- `apps/frontend/src/seeker/auth-token.ts` — `readStoredAuth()` already exists; add `authFetch` alongside it.
- `apps/frontend/src/router.tsx`, `apps/frontend/src/map/MapView.tsx` header — add the `/profile` route + header link.

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/domain/profile/job-seeker-profile.entity.ts` -- domain type
- [x] `apps/backend/src/infrastructure/persistence/drizzle/job-seeker-profile.schema.ts` + migration -- table (AD-14)
- [x] `apps/backend/src/application/ports/job-seeker-profile-repository.port.ts` + `infrastructure/persistence/drizzle/job-seeker-profile.repository.ts` -- port/adapter (AD-1), upsert
- [x] `apps/backend/src/application/profile/{get-my-profile,save-my-profile}.use-case.ts` -- the two use cases
- [x] `apps/backend/src/interfaces/auth/jwt-auth.guard.ts`, `current-user.decorator.ts` -- new "must be logged in" guard + param decorator
- [x] `apps/backend/src/interfaces/auth/roles.guard.ts` -- refactor to use `request.user` set by `JwtAuthGuard`
- [x] `apps/backend/src/interfaces/profile/{profile.controller,profile.module,dto/*}.ts` -- `GET/PUT /me/profile`, `@UseGuards(JwtAuthGuard)`
- [x] `apps/backend/src/app.module.ts` -- wire `ProfileModule`
- [x] `apps/frontend/src/seeker/auth-token.ts` -- add `authFetch(url, init)` attaching `Authorization: Bearer <token>`
- [x] `apps/frontend/src/seeker/ProfilePage.tsx` -- form, loads + saves via `authFetch`, redirects to `/login` if logged out
- [x] `apps/frontend/src/router.tsx` -- add `/profile` route
- [x] `apps/frontend/src/map/MapView.tsx` header -- "Mon profil" link when authenticated

**Acceptance Criteria:**
- Given an authenticated Job Seeker with no profile, when they save skills/experience/availability, then the row is persisted and visible on return
- Given an existing profile, when edited and saved, then the new values are what a later Catch (Story 2.3) will transmit
- Given a required field is left empty, when saving, then validation errors are shown and nothing is persisted
- Given no or an invalid token, when hitting either endpoint, then the request is rejected with 401

## Design Notes

`JwtAuthGuard` vs `RolesGuard`: the former answers "is there a valid session at all", the latter "does that session's role match what this route requires". Splitting them means Story 2.2's identity-only routes (own profile) don't need a role check, while Epic 3/5's role-restricted routes stack both — matches AD-15's per-route opt-in design without duplicating JWT verification in two places.

## Verification

**Commands:**
- `docker compose up -d && TOKEN=$(curl -s -X POST http://localhost:3000/auth/register -H 'content-type: application/json' -d '{"email":"p@b.com","password":"correcthorsebattery"}' | jq -r .accessToken) && curl -s -X PUT http://localhost:3000/me/profile -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"skills":"x","experience":"y","availability":"z"}'` -- expected: 200
- `pnpm --filter backend test` -- expected: passing
- `pnpm --filter frontend test` -- expected: passing

**Manual checks (if no CLI):**
- Register, go to /profile, fill and save, reload, confirm the saved values are still there.

## Suggested Review Order

1. `apps/backend/src/interfaces/auth/jwt-auth.guard.ts`, `auth-guards.module.ts` — the new "must be logged in" guard and the module split (`AuthModule` vs `AuthGuardsModule`) it depends on; everything else's authorization behavior flows from this.
2. `apps/backend/src/interfaces/auth/roles.guard.ts` — confirm it now reads `request.user` instead of re-verifying the JWT.
3. `apps/backend/src/interfaces/profile/profile.controller.ts`, `profile.module.ts`, `dto/*.ts` — the `GET/PUT /me/profile` surface, DTO validation (`MAX_FIELD_LENGTH`, trim-then-validate).
4. `apps/backend/src/infrastructure/persistence/drizzle/job-seeker-profile.schema.ts`, `job-seeker-profile.repository.ts` — the upsert pattern and the (deliberately deferred, see `deferred-work.md`) missing `onDelete` cascade.
5. `apps/backend/src/interfaces/profile/profile.auth.e2e.spec.ts` — both the no-token/invalid-token 401 cases and the live-Postgres success-path case (real seeded account, real JWT, full GET→PUT→GET).
6. `apps/frontend/src/seeker/ProfilePage.tsx`, `auth-token.ts` — `authFetch`, the 401→`clearAuth`+redirect handling on both GET and PUT, the `updatedAt` "last saved" display, and the `isProfileResponse` type guard.
7. `apps/frontend/src/seeker/ProfilePage.spec.tsx` — coverage for the above, including the malformed-response and 401 cases.

**Deferred findings:** see `deferred-work.md` for the 4 items logged against this story (missing FK `onDelete` cascade, no live guard-stacking test, no optimistic concurrency, no cross-tab storage sync) — none block acceptance, all scoped to future stories or explicitly out of this story's boundaries.
