# Epic 3 Context: Employer Listings, Applications & Subscription

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A verified employer can publish a geolocated listing within their subscription's radius, get notified and triage incoming applications, see performance stats and subscription status on a dashboard, and have listings auto-archive or get removed if payment lapses. This is the complete employer-side loop that makes the platform two-sided: it turns a paying employer's posting into visible reach, real applicant traffic, and an honest accounting of what the subscription bought.

## Stories

- Story 3.1: Employer Account Creation with Verification
- Story 3.2: Publish a Geolocated Listing
- Story 3.3: New-Application Notification
- Story 3.4: Application Triage
- Story 3.5: Listing Performance Stats & Subscription Dashboard
- Story 3.6: Subscription Lapse Handling

## Requirements & Constraints

- Employer accounts require activity verification before publishing is allowed; the exact verification method (e.g. company registration number) is unspecified/open — confirm before building, but publishing must stay blocked until verification completes.
- A Listing's Distribution Radius cannot exceed the maximum allowed by the Employer's current Subscription Tier — block or clamp, don't silently allow over-limit.
- Standard tier is a working default: €400/month, 10km baseline radius. Premium tier price/radius is explicitly undefined by the ministry — do not invent a value; surface it as "contact us," not a broken checkout flow.
- Billing is simulated only — no real payment processor integration (violates the project's zero-paid-third-party-dependency constraint).
- Listings auto-archive 30 days after publication and stop appearing on any public/job-seeker map.
- On subscription lapse, the Employer is notified; if unresolved after 7 days (counted from the notification, not the original due date), their still-live Listings are removed from public view the same way archival removes them. Resolving payment within the window cancels the pending removal.
- Employer notifications (new application, lapse warning) are in-app only — never commercial email (sovereignty constraint: no commercial email service).
- Street-level geolocation precision applies to Listing placement.
- Employer dashboard must show, per Listing, view count and applications received, plus current Subscription Tier and simulated billing status.
- Money values (subscription pricing) are stored as integer cents, never floats.

## Technical Decisions

- **Listing lifecycle (AD-12):** `Listing.status` is a single shared enum — `published | archived | lapsed | removed` — used by this epic's 30-day archival and 7-day lapse-removal paths, and by moderation (Epic 5). Never a hard delete; always a status transition. Time-bound transitions (archival, lapse removal) run via a scheduled job that mutates status directly — never computed at query-time by filtering.
- **Account provisioning (AD-13):** Employer accounts go through the same single registration/governance use case as every other account. Activity verification (Story 3.1) is a step inside that same use case, not a separate path.
- **Identity model (AD-14):** Employer-specific data lives in `employer_profiles`, FK'd to the shared `accounts` table; `SubscriptionTier` is held by `EmployerProfile`.
- **Authorization (AD-15):** Every Employer-only route (publish, dashboard, application triage) is gated by a `RolesGuard` + `@Roles()` decorator at the `interfaces/` layer — no use case may trust an unguarded role claim.
- **Application immutability (AD-6):** Application rows are immutable after creation except their own `status` field. Story 3.4's triage is the only path allowed to write that field; no other process (lifecycle jobs, moderation) touches Application rows. A Listing's status is read via join, never denormalized onto the Application.
- **Notification delivery:** in-app only, reusing the same mechanism for both new-application notices (3.3) and lapse warnings (3.6).
- **Real-time interplay:** status changes this epic produces (`published` on create, `archived`/`lapsed`/`removed` on lifecycle transitions) are the canonical event vocabulary consumed by the Listing Feed port (Epic 4) — `eventType` is exactly `Listing.status`, no separate vocabulary invented here.
- Stack/layering: NestJS hexagonal (`domain/`, `application/`, `infrastructure/`, `interfaces/`), Drizzle/Postgres persistence, all mutation routed through the domain/service layer — controllers and adapters never call a repository directly.

## Cross-Story Dependencies

- Story 3.1 gates Story 3.2: publishing stays blocked until Employer verification completes.
- Story 3.2's Distribution Radius is bounded by the Subscription Tier shown in Story 3.5's dashboard.
- Story 3.3 depends on Epic 2 Story 2.3 (Job Seeker's Catch/Apply action creates the Application that triggers the notification).
- Story 3.4's status updates are what Epic 2 Story 2.5 (Job Seeker's Application Tracking) displays back to the applicant.
- Story 3.2 (30-day archival) and Story 3.6 (7-day post-lapse removal) share the same `Listing.status` enum and scheduled-job mechanism (AD-12) — implement as one lifecycle facility, not two.
- Status transitions produced by Stories 3.2 and 3.6 are broadcast live by Epic 4's Listing Feed adapters; this epic owns triggering the transition, Epic 4 owns delivering it.
- Story 3.5's performance stats depend on Listing views (3.2) and Application volume (Epic 2's Catch/Apply flow) both existing and being counted.
