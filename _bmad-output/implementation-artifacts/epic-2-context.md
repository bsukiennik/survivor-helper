# Epic 2 Context: Job Seeker Identity, Catch & Applications

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A job seeker can create an account, build a professional profile, "catch" listings on the map to apply, track every application's status, and unlock badges up to the Permis de Travail at 10 catches. This is the full gamified job-seeker loop that makes the map's browsing experience (Epic 1) actionable — and it must be backed by server-side catch integrity: no client-trusted counts, no duplicate catches, no race condition on the badge unlock. This loop is the product's headline gamification feature ("ChomageGo" presentation layer) and the primary demonstration of value to the job seeker persona.

## Stories

- Story 2.1: Job Seeker Account Creation
- Story 2.2: Professional Profile Management
- Story 2.3: Catch Interaction & Direct Application
- Story 2.4: Catch Count, Badges & Permis de Travail Unlock
- Story 2.5: Application Tracking

## Requirements & Constraints

- Registration creates an `accounts` row with `role = JobSeeker` and immediately authenticates the user (JWT issued). Duplicate email registration must be rejected with a clear error, no duplicate account created.
- A Job Seeker account must be denied access to any Employer- or Administrator-only route.
- Profile fields (skills, experience, availability) are exactly what gets transmitted to an Employer on Application — keep the profile schema and the Application's transmitted-profile snapshot consistent. Required fields must be validated before persisting; nothing partial is saved.
- A Catch and a plain "Apply" produce the same underlying Application record — gamification is presentational only, not a second application pathway or data model.
- At most one Application per (Job Seeker, Listing) pair; a repeat catch on an already-caught Listing is a no-op (no second Application, no catch-count increment).
- `[ASSUMPTION]` v1's Catch is a map-selection interaction (open marker, confirm) — no device-proximity or timing gate. Revisit only if physical-proximity gating turns out to matter for the demo.
- Catch count is always computed server-side from the authoritative Application count — never client-reported or client-incremented — and must exactly equal what's displayed.
- The 10th catch is the *only* badge threshold (no intermediate milestones — this was explicitly considered and dropped). The Permis de Travail unlock must be visually/UX-distinct from a routine application confirmation.
- Concurrent catches crossing the 9th→10th threshold (e.g. two open tabs, two different Listings) must fire the unlock exactly once — never zero, never twice.
- Every Catch/Application-creation event must be logged with timestamp, Job Seeker ID, and Listing ID (audit trail, NFR8).
- Application rows are immutable after creation except their own `status` field — that field is mutated only by Employer triage (Epic 3, Story 3.4), never by this epic's own code paths.
- "My Applications" must show an empty state (not an error) when the Job Seeker has no applications yet, and must reflect current status for each — including statuses set by processes outside this epic (Employer triage). This story is independently testable using seeded status data.
- Archived/removed Listings must not be reachable as an open, applyable target.
- The map and its interactions must remain usable on both mobile and desktop browsers (responsive web, no native app).

## Technical Decisions

- **Identity model (AD-14):** one `accounts` table (`id`, `email`, `password_hash`, `role`) is the sole identity record. Role-specific data lives in `job_seeker_profiles`, FK'd to `accounts.id`. JWT `sub` claim = `accounts.id`, never a profile id.
- **Auth (AD-4):** backend self-issues and verifies its own JWTs, bearer token in `Authorization` header. No session store, no third-party auth provider.
- **Authorization (AD-15):** every role-restricted route is gated by a `RolesGuard` + `@Roles()` decorator at the `interfaces/` layer. No use case may trust an unguarded role claim.
- **Catch/Application integrity (AD-6) — the core mechanism of this epic:** a single `ApplyToListing` domain use case is the *only* path that creates an Application. It runs in one DB transaction: `SELECT ... FOR UPDATE` row lock on the Job Seeker's `accounts` row (serializes concurrent catches for that Job Seeker across *any* Listings) → check-or-create under a `UNIQUE(job_seeker_id, listing_id)` DB constraint → recompute authoritative catch count from persisted Applications under that lock → evaluate badge/Permis de Travail threshold atomically. No controller, adapter, or client input may bypass this or supply a catch count directly.
- **Hexagonal layering (AD-1):** domain/application layers (where `ApplyToListing` and profile use cases live) have zero dependency on infrastructure/framework code; persistence goes through a Persistence port (Drizzle/Postgres adapter).
- Backend: NestJS 12 (ESM, Vitest + oxlint), class-validator/class-transformer for DTOs, Drizzle ORM 0.45.2, PostgreSQL 18.6. Frontend: React 19.2.8 + Vite, Tailwind 4, shadcn/ui. This epic's frontend code lives under `frontend/seeker/` (profile, applications, badges) and shares `frontend/map/` for the catch interaction; backend logic lives under `domain/` (use cases), `application/` (ports), `infrastructure/` (persistence adapter), `interfaces/` (REST controllers, DTOs).
- Naming conventions: DB tables snake_case plural, entity IDs UUIDv4, DTOs `PascalCase` + `Dto`, dates ISO 8601 UTC, errors follow the NestJS standard exception-filter shape.
- Money/pricing (Subscription Tier) is out of scope for this epic — no Job Seeker-side billing.
- OpenAPI docs (Swagger) are generated from `class-validator` + `@nestjs/swagger` decorators on every DTO this epic introduces — never hand-authored (applies epic-wide, not epic-specific, but every new endpoint here must carry decorators).

## Cross-Story Dependencies

- Story 2.3 (Catch/Apply) depends on Story 2.2's persisted profile — the profile snapshot transmitted on Apply must match what was last saved.
- Story 2.4 (Catch count/badges) is evaluated atomically *inside* Story 2.3's `ApplyToListing` transaction — they are not separable at the implementation level even though they're separate stories.
- Story 2.5 (Application tracking) displays status changes driven by Epic 3 Story 3.4 (Employer triage) — Story 2.5 must be built and testable independently using seeded status data, without waiting on Epic 3.
- Epic 1's map (Story 1.1/1.2) is the surface Story 2.3's Catch interaction is built on top of; Epic 1 must already render Listing markers for Story 2.3 to attach the catch/apply flow to.
- Epic 4 (real-time map updates) and Epic 3 (Employer publish) are producers of the Listings this epic's map consumes, but neither is a hard blocker for building the catch/application/badge logic itself.
