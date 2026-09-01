---
title: 'Job Seeker Account Creation'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'b5449a8b0a64e2609b2b836c43e40aa5f1330a0c'
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot.
     Never over-specify "how" — use boundaries + examples instead.
     Cohesive cross-layer stories (DB+BE+UI) stay in ONE file.
     IMPORTANT: Remove all HTML comments when filling this template. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every prior story (1.1–1.3) is unauthenticated read-only browsing. Nothing in the codebase can create an account, issue a token, or tell a Job Seeker- from an Employer/Administrator-only route — the identity model (AD-14), auth (AD-4), and authorization (AD-15) the architecture spine specifies don't exist yet.

**Approach:** Introduce the `accounts` table + the single shared account-provisioning use case (AD-13, reusable by Employer/Admin epics later), a JWT-based auth backend (register + login, since a registration-only flow with no way back in isn't usable), and the `RolesGuard`/`@Roles()` skeleton (AD-15). On the frontend, add client-side routing (`react-router` — not yet decided by the architecture spine; picked here since Epic 2 is the first story needing more than one page) with a Register/Login page and a header reflecting authenticated state.

## Boundaries & Constraints

**Always:**
- `accounts` table: `id` (uuid), `email` (unique), `password_hash`, `role` (`JobSeeker | Employer | Administrator`), `created_at`. `job_seeker_profiles` table is NOT created in this story — Story 2.2 owns it (create tables only when needed).
- Registration/login live behind a single provisioning path per AD-13 — a `RegisterAccountUseCase` in the domain layer, parameterized by role, is the only code that inserts an `accounts` row. This story invokes it with `role = 'JobSeeker'` only; Employer/Admin call sites come in their own epics.
- Passwords hashed via a `PasswordHasherPort` (bcryptjs adapter) — the domain never imports a hashing library directly.
- JWT issued via a `TokenIssuerPort` (`@nestjs/jwt` adapter); `sub` claim = `accounts.id`; bearer token, no session store (AD-4).
- `RolesGuard` + `@Roles()` decorator built now at the `interfaces/` layer (AD-15); no protected Employer/Admin route exists yet to guard, so it's proven with a guard-level unit test (mock `ExecutionContext`), not an end-to-end protected route.
- Frontend: `react-router` (v8, Library/Classic SPA mode — `createBrowserRouter` + `RouterProvider` from `react-router/dom`), routes for the existing map view and a new register/login page. Auth token persisted in `localStorage` (same pattern as `geolocation-consent.ts`), read on boot to reflect logged-in state in the header.

**Ask First:** none anticipated.

**Never:**
- No `job_seeker_profiles` table or profile UI (Story 2.2).
- No Employer/Admin registration call sites (their own epics) — only the shared use case exists, ready for reuse.
- No password reset / email verification flow — out of scope, not in any FR.
- No real protected Employer/Admin route to test the guard against yet — unit-test the guard in isolation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Register happy path | `POST /auth/register` valid email+password | 201, `{ accessToken }`; `accounts` row created with `role='JobSeeker'` | N/A |
| Duplicate email | `POST /auth/register` with an already-registered email | No new row created | 409 with a clear message |
| Login happy path | `POST /auth/login` correct email+password | 200, `{ accessToken }` | N/A |
| Login wrong password | `POST /auth/login` with a bad password | No token issued | 401, generic "invalid credentials" (never reveal which field was wrong) |
| RolesGuard denies | Guard invoked with a `JobSeeker` role against an `@Roles('Administrator')` route | Request rejected | 403, guard-level test only (no live protected route yet) |

</frozen-after-approval>

## Code Map

- `apps/backend/src/interfaces/listings/*` — existing controller/module/DTO pattern to mirror for `interfaces/auth/`.
- `apps/backend/src/infrastructure/persistence/drizzle/listing.schema.ts` — existing schema pattern (pgTable, enum) to mirror for `accounts`.
- `apps/backend/src/infrastructure/persistence/drizzle/listing.repository.ts` — existing repository pattern to mirror for `AccountRepository`.
- `apps/backend/src/app.module.ts` — add `AuthModule` import.
- `apps/backend/src/main.ts:23` — existing `ValidationPipe` registration; register DTOs must use class-validator decorators to be checked here.
- `apps/frontend/src/main.tsx` — currently renders `<MapView />` directly with no router; becomes the `RouterProvider` mount point.
- `apps/frontend/src/map/geolocation-consent.ts` — the localStorage read/write pattern to mirror for auth-token persistence.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/backend/src/domain/account/account.entity.ts` -- `Account` domain type (id, email, role, passwordHash) -- AD-14 identity shape
- [ ] `apps/backend/src/infrastructure/persistence/drizzle/account.schema.ts` + migration -- `accounts` table -- AD-14
- [ ] `apps/backend/src/application/ports/account-repository.port.ts`, `password-hasher.port.ts`, `token-issuer.port.ts` -- ports the use case depends on -- hexagonal boundary (AD-1)
- [ ] `apps/backend/src/infrastructure/persistence/drizzle/account.repository.ts`, `infrastructure/auth/bcrypt-password-hasher.adapter.ts`, `infrastructure/auth/jwt-token-issuer.adapter.ts` -- concrete adapters -- AD-1
- [ ] `apps/backend/src/application/account/register-account.use-case.ts` -- the single provisioning use case (AD-13), role-parameterized
- [ ] `apps/backend/src/application/account/login.use-case.ts` -- verify credentials, issue token
- [ ] `apps/backend/src/interfaces/auth/{auth.controller,auth.module,dto/*}.ts` -- `POST /auth/register`, `POST /auth/login`, no guard
- [ ] `apps/backend/src/interfaces/auth/roles.guard.ts`, `roles.decorator.ts` -- AD-15, unit-tested in isolation
- [ ] `apps/backend/src/app.module.ts` -- wire `AuthModule`
- [ ] `apps/frontend/src/router.tsx` -- `createBrowserRouter` with map + `/register` (`/login` link inline on the same page) routes
- [ ] `apps/frontend/src/seeker/auth-token.ts` -- token get/set/clear (mirrors `geolocation-consent.ts`)
- [ ] `apps/frontend/src/seeker/RegisterLoginPage.tsx` -- form, calls `/auth/register` or `/auth/login`, stores token, redirects to map
- [ ] `apps/frontend/src/main.tsx` -- mount `RouterProvider` instead of `<MapView />` directly
- [ ] `apps/frontend/src/map/MapView.tsx` header -- show "Se connecter" link when logged out, email + "Se déconnecter" when logged in

**Acceptance Criteria:**
- Given a fresh accounts table, when a visitor registers with a valid email/password, then a JobSeeker account is created and a token is returned that later authorizes further requests
- Given an existing email, when registering again, then no duplicate account is created and a clear conflict error is shown
- Given valid credentials, when logging in, then a token is returned
- Given a JobSeeker's role, when the RolesGuard is evaluated against an `@Roles('Administrator')` requirement, then access is denied

## Design Notes

`RegisterAccountUseCase` signature takes `role` as a parameter (not hardcoded) so Story 3.1 (Employer) and the Epic 5 admin-bootstrap path reuse it verbatim — this story's controller is the only current caller, and it always passes `'JobSeeker'`.

## Verification

**Commands:**
- `docker compose up -d && curl -s -X POST http://localhost:3000/auth/register -H 'content-type: application/json' -d '{"email":"a@b.com","password":"correcthorse"}'` -- expected: 201, `{ accessToken }`
- `pnpm --filter backend test` -- expected: passing
- `pnpm --filter frontend test` -- expected: passing

**Manual checks (if no CLI):**
- Open the frontend, register, confirm the header shows the account is authenticated and the map still works underneath.

## Suggested Review Order

**Identity & provisioning (AD-13/AD-14)**

- The single account-provisioning use case — email normalization, uniqueness check, and a rollback if token issuance fails after the account is created.
  [`register-account.use-case.ts:39`](../../apps/backend/src/application/account/register-account.use-case.ts#L39)

- Rollback path — deletes the just-created row rather than leaving an unusable phantom account.
  [`account.repository.ts:66`](../../apps/backend/src/infrastructure/persistence/drizzle/account.repository.ts#L66)

**Auth (AD-4) & authorization (AD-15)**

- JWT secret resolution — fails fast in production rather than silently signing with the checked-in dev default.
  [`auth.module.ts:19`](../../apps/backend/src/interfaces/auth/auth.module.ts#L19)

- `RolesGuard` skeleton — opt-in per route (matches AD-15's design), proven with a unit test since no protected route exists yet.
  [`roles.guard.ts:27`](../../apps/backend/src/interfaces/auth/roles.guard.ts#L27)

- New test proving DTO validation (`@IsEmail`, `@MinLength`) actually runs through Nest's real `ValidationPipe`, not just a stubbed controller call.
  [`auth.validation.e2e.spec.ts`](../../apps/backend/src/interfaces/auth/auth.validation.e2e.spec.ts)

**Frontend: routing (new decision) & auth UI**

- `react-router` route table — `/`, `/register`, `/login` (shared component, mode from path), and a catch-all.
  [`router.tsx:11`](../../apps/frontend/src/router.tsx#L11)

- One form for both modes; guards a malformed 200 response instead of trusting it.
  [`RegisterLoginPage.tsx:14`](../../apps/frontend/src/seeker/RegisterLoginPage.tsx#L14)
  [`RegisterLoginPage.tsx:31`](../../apps/frontend/src/seeker/RegisterLoginPage.tsx#L31)

- Header reflects auth state — email + logout when authenticated, a link to `/login` otherwise.
  [`MapView.tsx:186`](../../apps/frontend/src/map/MapView.tsx#L186)

**Tests**

- Router path-contract test — renders the real route table, not each component in isolation, so a drifted `Link`/route path fails here.
  [`router.spec.tsx`](../../apps/frontend/src/router.spec.tsx)
