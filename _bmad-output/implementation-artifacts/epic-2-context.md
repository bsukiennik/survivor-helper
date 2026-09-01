# Epic 2 Context: Job Seeker Identity, Catch & Applications

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A visitor can create a Job Seeker account, build a professional profile, and then use the map from Epic 1 to "catch" listings — a gamified, visually distinct confirm-to-apply interaction that creates a real Application carrying their profile to the Employer. The system tracks each Job Seeker's catch count authoritatively on the server (never trusting a client-reported number), awards Badges at milestones, and distinctly surfaces the "Permis de Travail" status at the 10th catch — the headline gamification moment the ministry named explicitly. A Job Seeker can also see every Application they've submitted and its current status in one place. The core engineering risk this epic owns is integrity: no duplicate Applications for the same listing, and no double- or zero-firing of the Permis de Travail unlock under concurrent catches.

## Stories

- Story 2.1: Job Seeker Account Creation
- Story 2.2: Professional Profile Management
- Story 2.3: Catch Interaction & Direct Application
- Story 2.4: Catch Count, Badges & Permis de Travail Unlock
- Story 2.5: Application Tracking

## Requirements & Constraints

- Registration takes email + password; a duplicate email is rejected with a clear error and no duplicate account is created; on success the account is created with the Job Seeker role and the user is immediately authenticated (token issued).
- A Job Seeker account must be denied access to any Employer- or Administrator-only route.
- Profile fields are skills, experience, and availability; required fields are enforced — an incomplete save is rejected with validation errors and nothing is persisted.
- The profile content transmitted on an Application is whatever the Job Seeker last saved before that Catch — there is no separate "apply-time" data entry step.
- A Catch is presentational, not a second application pathway: a Catch and a plain "Apply" produce the exact same underlying Application record, just visually distinguished as a Catch in the UI.
- At most one Application may exist per (Job Seeker, Listing) pair. Repeating a Catch on an already-caught Listing is a silent no-op — no duplicate Application, no catch-count increment, no error shown that implies something went wrong.
- The displayed catch count must always equal the Job Seeker's persisted Application count, computed server-side — never a client-tracked or client-incremented number.
- The Permis de Travail unlock fires distinctly from a routine application confirmation, exactly once, on the 10th Catch — including when two Catches (on different Listings) race across the 9th→10th threshold; it must never fire zero or two times.
- Every Catch/Application-creation event is logged with timestamp, Job Seeker ID, and Listing ID for audit purposes.
- "My Applications" shows every submitted Application with its current status, in one place; zero Applications renders an empty state, not an error. This story must be independently testable using seeded status data — it does not need Epic 3's employer-triage feature to exist yet, only to respect whatever status value is already persisted.
- The map and its interactions must remain usable on both mobile and desktop browsers (responsive web, no native app).

## Technical Decisions

- A single `ApplyToListing` domain use case is the only path that may create an Application. It runs in one transaction: it takes a row lock (`SELECT ... FOR UPDATE`) on the Job Seeker's `accounts` row to serialize concurrent catches by that Job Seeker across *any* Listings, enforces creation under a `UNIQUE(job_seeker_id, listing_id)` DB constraint, recomputes the authoritative catch count from persisted Applications under that same lock, and evaluates badge/Permis de Travail thresholds atomically — no controller, adapter, or client input can bypass this or supply a catch count directly.
- Once created, an Application row is immutable except its own `status` field, which only Epic 3's Employer-triage use case may later update — no other use case (this epic included) writes to an Application after creation.
- Identity model: one `accounts` table (`id`, `email`, `password_hash`, `role`) is the single identity record; Job Seeker–specific data lives in a separate `job_seeker_profiles` table FK'd to `accounts.id`. The JWT `sub` claim is `accounts.id`.
- Auth is a self-issued JWT (bearer token), no server-side session store, no third-party auth provider.
- Every Employer-/Administrator-only route a Job Seeker might probe is gated by a `RolesGuard` + `@Roles()` decorator at the interface layer — no use case trusts an unguarded role claim.
- Domain/application code for this epic has zero dependency on infrastructure/framework code (hexagonal core); persistence goes through the Persistence adapter only.
- Frontend module for this epic lives under `apps/frontend/src/seeker/` (profile, applications, badges); the map/catch UI itself extends `apps/frontend/src/map/` from Epic 1.
- Logging is structured JSON; Catch/Application-creation log lines carry job-seeker id, listing id, and timestamp (the AD-6 audit trail).
- Project-wide conventions apply: entity IDs are UUIDv4, dates are ISO 8601 UTC, DTOs are `PascalCase` + `Dto`, error responses use the standard NestJS exception-filter shape.

## Cross-Story Dependencies

- Story 2.3 (Catch) depends on Story 2.1 (account exists) and Story 2.2 (profile content to transmit) — the profile a Job Seeker last saved is what a Catch attaches to the Application.
- Story 2.4 (catch count, badges, Permis de Travail) is not a separate write path — its evaluation happens inside the same transaction as Story 2.3's Catch, atomically, not via a follow-up call.
- Story 2.5 (Application tracking) will later reflect status changes made by Epic 3's Employer-side triage (Story 3.4), but must work and be testable now using seeded status data, independent of that feature's existence.
- Story 2.1 reuses the same account-provisioning path (AD-13) that Employer (Epic 3) and Administrator (Epic 5) accounts also go through — no separate registration mechanism is invented here for Job Seekers.
- Story 2.3's Catch interaction is added onto the same map and markers Epic 1 (Stories 1.1/1.2) already built — Epic 1 renders "Apply" as disabled/prompted for unauthenticated Visitors; this epic is what makes it functional for authenticated Job Seekers.
