---
title: 'Employer Account Creation with Verification'
type: 'feature'
created: '2026-09-02'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '1ef971ca449e10b1360677b2996ce783acb7060d'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `POST /auth/register` only ever creates `JobSeeker` accounts (role hardcoded) — Epic 3 needs Employers to register too, with an activity-verification gate before they can publish (Story 3.2, not yet built).

**Approach:** Add `POST /auth/register/employer` (separate DTO/endpoint, reusing the existing role-generic `RegisterAccountUseCase` rather than a parallel registration path) that creates an `accounts` row (`role = Employer`) plus an `employer_profiles` row with `verificationStatus: 'pending'`. Verification approval is a manual admin action — Epic 5's admin tooling doesn't exist yet, so this story only builds and tests the pending/verified states via seeded data (same pattern as Story 2.5 testing Application status via direct DB seeding), and does not build a "publish blocked while pending" check — that's Story 3.2's job, the same way `RolesGuard` shipped with zero real routes to guard until later stories used it. A `GET /me/employer-profile` endpoint lets an Employer check their status (satisfies "check my account status" without waiting on 3.2).

## Boundaries & Constraints

**Always:**
- `employer_profiles` table: `accountId` (uuid, PK, FK → `accounts.id` — same 1:1 pattern as `job_seeker_profiles`), `companyName` (text, not null), `verificationStatus` (pgEnum `'pending' | 'verified'`, default `'pending'`).
- `RegisterAccountUseCase.execute()` gains an optional `employerProfile?: { companyName: string }` input. When present, after creating the account it also creates the `employer_profiles` row (`verificationStatus: 'pending'`). If token issuance then fails, the existing rollback deletes the `employer_profiles` row before the `accounts` row (FK order — no cascade exists, same constraint `job_seeker_profiles` has).
- `POST /auth/register/employer` (new `RegisterEmployerDto`: `email`, `password`, `companyName`, all required — a separate DTO/endpoint, not a conditional field on the existing `RegisterDto`, since no `@ValidateIf`-style precedent exists in this codebase and inventing one for two fields isn't worth it). Calls `registerAccount.execute({ email, password, role: 'Employer', employerProfile: { companyName } })`. Same email-conflict/password rules as the existing endpoint.
- `GET /me/employer-profile` — new endpoint, `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('Employer')`, returns `{ companyName, verificationStatus }` verbatim (raw string, not mapped to a boolean — matches the `Application.status` convention from Story 2.5).
- `EMPLOYER_PROFILE_REPOSITORY_PORT` is bound independently in both the module that creates it (auth) and the module that reads it (a new `EmployerModule`) — mirrors how `LISTING_REPOSITORY_PORT` is already bound independently in both `ListingsModule` and `ApplicationModule`, not shared via import.
- The existing `POST /auth/register` (JobSeeker) is untouched — still calls `execute({ email, password, role: 'JobSeeker' })`, `employerProfile` stays `undefined`.

**Ask First:** none anticipated.

**Never:**
- No admin-verify endpoint/UI in this story — Epic 5's job. Verification state changes are only ever seeded directly via Drizzle in tests here.
- No "publish blocked while pending" enforcement — Story 3.2's job, since no publish endpoint exists yet to guard.
- No rejection state (`'rejected'`) — only `'pending'`/`'verified'`, matching exactly what the ACs describe; don't invent a third state.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful registration | `POST /auth/register/employer`, new email, valid password/companyName | 201, access token issued; `employer_profiles` row created with `verificationStatus: 'pending'` | N/A |
| Duplicate email | Email already registered (any role) | Rejected, no new account created | 409 |
| Check status while pending | `GET /me/employer-profile`, authenticated Employer, freshly registered | 200, `{ companyName, verificationStatus: 'pending' }` | N/A |
| Check status after seeded verification | Same account, `verificationStatus` manually updated to `'verified'` (seeded, simulating the future admin action) | 200, `{ companyName, verificationStatus: 'verified' }` | N/A |
| No/invalid token | Missing or malformed bearer token on `GET /me/employer-profile` | Rejected | 401 |
| Wrong role | Valid token, `role` ≠ `Employer` (e.g. JobSeeker) | Rejected | 403 |

</frozen-after-approval>

## Code Map

- `domain/account/account.entity.ts` (`ACCOUNT_ROLES`) — `'Employer'` already present; `infrastructure/persistence/drizzle/account.schema.ts` (`accountRoleEnum`) — `'Employer'` already a Postgres enum value, no enum migration needed.
- `application/account/register-account.use-case.ts` (`execute`, L39-65) — already role-generic input; extend with optional `employerProfile`, extend the existing token-issuance-failure rollback.
- `domain/profile/job-seeker-profile.entity.ts`, `infrastructure/persistence/drizzle/job-seeker-profile.schema.ts` (`accountId` as PK+FK, no separate `id`) — exact pattern to mirror for `employer-profile.entity.ts`/`employer-profile.schema.ts`.
- `application/ports/job-seeker-profile-repository.port.ts`, `infrastructure/persistence/drizzle/job-seeker-profile.repository.ts` (`upsert` via `onConflictDoUpdate`) — port/adapter shape to mirror (this story only needs `create`/`findByAccountId`, no upsert — profile is written once at registration).
- `interfaces/auth/dto/register.dto.ts` — DTO decorator convention to mirror for `register-employer.dto.ts`.
- `interfaces/auth/auth.controller.ts` (`register`, L36-50) — add a sibling `@Post('register/employer')` handler; `interfaces/auth/auth.module.ts` — add the new port binding.
- `interfaces/application/badges.controller.ts` — closest existing single-object authenticated-GET pattern to mirror for a new `interfaces/employer/employer-profile.controller.ts` + new `employer.module.ts` (mirrors `ApplicationModule`'s "bind own port, don't import the writer's module" shape).
- `apps/backend/src/app.module.ts` — wire the new `EmployerModule`.
- `infrastructure/persistence/drizzle/db.ts` — add the new schema to the merge object.
- `infrastructure/persistence/drizzle/migrations/0004_bizarre_virginia_dare.sql` + `migrations/meta/_journal.json` — next migration is `idx: 5` (`pnpm db:generate`/`db:migrate`).
- `interfaces/auth/auth.validation.e2e.spec.ts` — e2e registration-validation pattern to mirror for the new endpoint.
- `infrastructure/persistence/drizzle/job-seeker-profile.repository.spec.ts` — real-Postgres seeding pattern to mirror, including directly seeding `verificationStatus: 'verified'` to simulate the not-yet-built admin action.

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/domain/profile/employer-profile.entity.ts` -- plain interface (`accountId`, `companyName`, `verificationStatus`)
- [x] `apps/backend/src/infrastructure/persistence/drizzle/employer-profile.schema.ts` -- `employerProfilesTable` + `verificationStatusEnum` + migration
- [x] `apps/backend/src/infrastructure/persistence/drizzle/db.ts` -- add schema to the merge object
- [x] `apps/backend/src/application/ports/employer-profile-repository.port.ts` + `infrastructure/persistence/drizzle/employer-profile.repository.ts` -- `create`, `findByAccountId` (+ `delete`, for the rollback path)
- [x] `apps/backend/src/application/account/register-account.use-case.ts` (+ spec) -- optional `employerProfile` input, extended rollback (FK-safe delete order)
- [x] `apps/backend/src/interfaces/auth/{auth.controller,dto/register-employer.dto,auth.module}.ts` (+ spec) -- `POST /auth/register/employer`
- [x] `apps/backend/src/interfaces/employer/{employer-profile.controller,employer.module,dto/employer-profile-response.dto}.ts` (+ spec) -- `GET /me/employer-profile`, plus `GetMyEmployerProfileUseCase` (beyond the literal file list, to keep controllers reading through a use case rather than a repository directly — matches every other controller in this codebase)
- [x] `apps/backend/src/app.module.ts` -- wire `EmployerModule`
- [x] Integration test seeding `verificationStatus: 'verified'` directly to prove the GET endpoint reflects seeded state
- [x] e2e auth-gate test for `GET /me/employer-profile` (401/403 for both wrong roles), matching the pattern every prior Epic 2/3 review has required for a new guarded route

**Acceptance Criteria:**
- Given a visitor submits valid Employer registration details, when the request completes, then an `accounts` row (`role = Employer`) and an `employer_profiles` row (`verificationStatus: 'pending'`) both exist, and an access token is returned
- Given an Employer whose verification is seeded as `'verified'`, when they call `GET /me/employer-profile`, then the response reflects `'verified'`
- Given a duplicate email, when registering as Employer, then the request is rejected with 409 and no account is created

## Design Notes

`RegisterAccountUseCase`'s existing rollback (delete account if token issuance fails) must delete the `employer_profiles` row first when one was created — `employer_profiles.accountId` has no `onDelete` cascade (matches the same known/deferred constraint `job_seeker_profiles` has), so deleting the account first would raise a FK violation instead of cleanly rolling back.

## Verification

**Commands:**
- `docker compose up -d && curl -s -X POST http://localhost:3000/auth/register/employer -H 'content-type: application/json' -d '{"email":"employer@x.com","password":"correcthorsebattery","companyName":"Acme"}'` -- expected: 201 with `accessToken`
- `pnpm --filter backend test` -- expected: passing

**Manual checks (if no CLI):**
- Register as Employer, call `GET /me/employer-profile`, confirm `verificationStatus: 'pending'`; seed it to `'verified'` directly in Postgres, call again, confirm it now reflects `'verified'`.

## Suggested Review Order

**Registration rollback (the finding all three review layers independently caught)**

- Entry point: the fix — `employerProfileCreated` now tracked and the profile-create call brought inside the same rollback boundary as token issuance, so a profile-creation failure rolls back the account too (originally it didn't).
  [`register-account.use-case.ts:70`](../../apps/backend/src/application/account/register-account.use-case.ts#L70)

- The test that would have failed against the original code — profile creation throws, only the account delete should fire.
  [`register-account.use-case.spec.ts:262`](../../apps/backend/src/application/account/register-account.use-case.spec.ts#L262)

- The original rollback test (token issuance fails) — kept unchanged, still passing.
  [`register-account.use-case.spec.ts:230`](../../apps/backend/src/application/account/register-account.use-case.spec.ts#L230)

**Employer schema & data**

- `employer_profiles` — 1:1 with `accounts`, no `onDelete` cascade (deferred, same class of gap `job_seeker_profiles` already has).
  [`employer-profile.schema.ts:12`](../../apps/backend/src/infrastructure/persistence/drizzle/employer-profile.schema.ts#L12)

- Real-Postgres CRUD proof, including the directly-seeded verification-status update the whole story's testability strategy depends on.
  [`employer-profile.repository.spec.ts:69`](../../apps/backend/src/infrastructure/persistence/drizzle/employer-profile.repository.spec.ts#L69)

**HTTP surface**

- `POST /auth/register/employer` — sibling to the existing `register`, same use case, role-generic by design.
  [`auth.controller.ts:57`](../../apps/backend/src/interfaces/auth/auth.controller.ts#L57)

- New real-HTTP, real-Postgres proof that a single registration call actually persists both rows together — added during review; previously only unit-tested with mocked ports.
  [`auth.registration.e2e.spec.ts:50`](../../apps/backend/src/interfaces/auth/auth.registration.e2e.spec.ts#L50)

- `GET /me/employer-profile` — mirrors `BadgesController`'s guard stack, restricted to `Employer`.
  [`employer-profile.controller.ts:23`](../../apps/backend/src/interfaces/employer/employer-profile.controller.ts#L23)

- Live 401/403 proof for the new guarded route.
  [`employer-profile.auth.e2e.spec.ts:37`](../../apps/backend/src/interfaces/employer/employer-profile.auth.e2e.spec.ts#L37)
