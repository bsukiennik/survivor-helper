---
stepsCompleted: [step-01, step-02, step-03, step-04]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-GEOEMPLOI-2026-09-01/prd.md', '_bmad-output/planning-artifacts/prds/prd-GEOEMPLOI-2026-09-01/addendum.md', '_bmad-output/planning-artifacts/architecture/architecture-GEOEMPLOI-2026-09-01/ARCHITECTURE-SPINE.md']
---

# GéoEmploi - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for GéoEmploi, decomposing the requirements from the PRD and Architecture spine into implementable stories. No UX design contract exists for this project (deliberately skipped).

## Requirements Inventory

### Functional Requirements

FR1: Visitor can view an interactive map of geolocated Listings without creating an account or authenticating.
FR2: Visitor can open a Listing marker and see its public details (title, employer name, location, description) without an account.
FR3: Visitor can create a Job Seeker account.
FR4: Job Seeker can create and edit a professional profile: skills, experience, availability.
FR5: Authenticated Job Seeker sees Listings on the map as interactive markers; selecting/approaching one and confirming triggers the Apply action and is visually distinct as a "Catch."
FR6: Job Seeker can apply to a Listing directly in-app; their profile is transmitted to the Employer.
FR7: System tracks a per-Job-Seeker Catch count, computed server-side from the authoritative count of Applications, and awards Badges at milestone thresholds.
FR8: After the Job Seeker's 10th Catch, the system unlocks and surfaces the "Permis de Travail" badge/status.
FR9: Job Seeker can view the status of all their ongoing Applications in one place.
FR10: Visitor can create an Employer account, which requires activity verification before it can publish Listings.
FR11: Verified Employer can publish a Listing: position, location, description, Distribution Radius (bounded by their Subscription Tier).
FR12: Listings are automatically archived 30 days after publication.
FR13: Employer receives an in-app notification for each new Application to one of their Listings.
FR14: Employer can sort/filter received Applications by status and contact the applicant.
FR15: Employer dashboard shows, per Listing, view count and applications received.
FR16: Employer dashboard shows current Subscription Tier and simulated billing status.
FR17: A newly published Listing appears on the Job Seeker/Visitor map without a page reload (WebSocket by default, config-switchable polling fallback, WS can be fully disabled by config, delivery deduped by Listing ID).
FR18: Any user can flag a Listing as fraudulent or non-compliant.
FR19: Administrator can review Reports and act on the underlying Listing (approve/remove) and, if warranted, the Employer account.
FR20: Administrator can activate or suspend any Job Seeker or Employer account; no account type is created with elevated privileges outside the governed workflow.
FR21: User can request deletion of their account; personal data is anonymized immediately except a bounded, time-boxed exception for a counterparty's legitimate operational need.
FR22: Administrator can view aggregate national metrics: active accounts (by type), Listings published, Applications submitted.
FR23: Before requesting device geolocation for the first time, the system presents a clear consent notice and requires explicit consent; declining falls back to manual location/commune search.
FR24: If an Employer's simulated subscription payment lapses, the system notifies the Employer; Listings still live 7 days after that notice are automatically removed.
FR25: Every user-facing surface renders the product name as "GéoEmploi" only — no variant, no internal codename.
FR26: Every screen and generated artifact follows the ministerial graphic charter (institutional blue #1B3A6B never as a button fill, Marianne/Spectral typefaces, protected ministry lockup), explicitly checked on login, 404/500, empty states, loading states, transactional emails, favicon, tab title, and PDF exports.

### NonFunctional Requirements

NFR1 (Performance): Map load time under 3 seconds on a standard connection (baseline); under 1 second is a stretch goal.
NFR2 (Performance): `/health` responds in under 200ms, including when the map tile provider is unresponsive, and never depends on the Mapping adapter (architecture AD-9).
NFR3 (Performance): The architecture supports gradual scaling as an explicit requirement, independent of the still-open production concurrency target.
NFR4 (Performance): Load test — 50 concurrent simulated users for 3 minutes against map browsing and listing-list endpoints, DB seeded with ≥500 Listings across ≥50 communes; deliverables are the script plus a report with median/p95 response time, error rate, and the top fix and why.
NFR5 (Reliability): Live Listing updates use WebSocket by default with a polling fallback switchable by configuration alone (no code change); every behavioral difference between the two modes is documented. WebSocket can also be disabled entirely by config, independent of the fallback.
NFR6 (Observability): `/health` reports application status, deployed version, and database connectivity.
NFR7 (Observability): Map tile requests are proxied and cached server-side (browser never calls the tile provider directly, no provider API key in the frontend bundle); cache hit/miss counts are exposed and measured on a second load of the same view.
NFR8 (Observability): Catch/Application-creation events are logged with timestamp, Job Seeker ID, and Listing ID for audit purposes.
NFR9 (API & Data Documentation): OpenAPI 3.0 spec (Swagger UI) covering every endpoint, generated before deployment from code (never hand-authored); every example request/response is real, backed by a committed `.http` file or curl script.
NFR10 (API & Data Documentation): A logical database schema (image or DBML: model, cardinalities, indexes) delivered by Friday 17:00, updated same-day on any schema change.
NFR11 (Security): Authentication secured via JWT (self-issued by the backend) or server-side session.
NFR12 (Security): No secrets committed to the repository, including history; a complete `.env.example` lists every required environment variable.
NFR13 (Geographic precision): Street-level resolution for Listing proximity.
NFR14 (Privacy): Location data collection is covered by a clear, accessible information notice with explicit consent (FR23) — not negotiable regardless of any conflicting stakeholder request.
NFR15 (Privacy): Personal data is not retained beyond the account's active-usage period; account deletion is effective, not cosmetic (FR21).
NFR16 (Sovereignty/Cost): Zero dependency on any paid third-party service or any service requiring a proprietary account (no managed DB, no managed object storage, no commercial map/auth/email API; AWS/GCP/Azure explicitly excluded).
NFR17 (Sovereignty/Cost): The application runs entirely on a contributor's local machine from a fresh clone using only the repo's own install instructions; timed by a team member who did not write the install steps, with the measured time reported back as the acceptance criterion.
NFR18 (Sovereignty/Cost): A one-page deployment note accompanies delivery: hypothetical production hosting shape, resources needed, data leaving the infrastructure and to whom.
NFR19 (Content Responsibility): Employers are responsible for their own Listing content; the Report mechanism is the mitigation, not a guarantee.
NFR20 (Monetization): Standard Subscription Tier is €400/month with a 10km baseline Distribution Radius (working default); Premium tier price/radius is an explicit open question, not assumed. Billing is simulated — no real payment processor is integrated.
NFR21 (Platform): Responsive web application, mobile and desktop browsers, v1 only — no native app, no device-camera AR.

### Additional Requirements

- No starter template — hand-assembled stack (no create-t3-app or similar), Architecture AD-1.
- Monorepo layout: `apps/frontend` (Vite + React SPA) and `apps/backend` (NestJS, hexagonal: `domain/`, `application/`, `infrastructure/`, `interfaces/`).
- Hexagonal architecture (ports & adapters): domain/application layers have zero dependency on infrastructure/framework code (AD-1); two adapters designed first — Persistence (Drizzle/Postgres) and Mapping (tile proxy + cache) (AD-1, AD-2).
- Identity model: single `accounts` table (`id`, `email`, `password_hash`, `role`) with role-specific `job_seeker_profiles`/`employer_profiles` tables FK'd to it; JWT `sub` = `accounts.id` (AD-4, AD-14).
- Authorization: every Administrator/Employer-only route gated by a `RolesGuard` + `@Roles()` decorator at the `interfaces/` layer; no use case trusts an unguarded role claim (AD-15). First Administrator account created via a one-time CLI/seed script calling the same provisioning use case directly (bootstrap exception to AD-13).
- Catch/Application integrity: single `ApplyToListing` domain use case, one transaction, `SELECT ... FOR UPDATE` row lock on the Job Seeker's account before recomputing catch count, `UNIQUE(job_seeker_id, listing_id)` DB constraint, atomic badge/Permis de Travail evaluation (AD-6). Application rows immutable after creation except their own status field.
- Listing lifecycle: single shared `Listing.status` enum (`published | archived | lapsed | removed`) used by moderation (FR18/19), auto-archival (FR12), and subscription-lapse removal (FR24) — always soft-delete/status change, never a hard delete (AD-12). Time-bound transitions run via a scheduled job, not query-time filtering.
- Real-time delivery: single `ListingFeedPort` interface with WebSocket (default) and Polling adapters, selected by env var; canonical event shape `{ listingId, eventType: 'published'|'archived'|'lapsed'|'removed', listing: ListingSummaryDto }` identical across both adapters (AD-5).
- RGPD erasure: single `DeleteAccount` domain use case is the only path that anonymizes/deletes personal data; no repository issues a raw personal-data delete outside it (AD-7).
- Brand compliance: one design-token module for charter colors/typography consumed by every component; one i18n/strings source for the "GéoEmploi" display name (AD-8).
- Stack (pinned, verified current): React 19.2.8, Vite 8.2.2, TypeScript 6.0.3 (deliberately not 7.0.2 — breaks the NestJS CLI build), Tailwind CSS 4.3.3, shadcn/ui; NestJS 12.0.1 (ESM mode, Vitest + oxlint), class-validator/class-transformer, Drizzle ORM 0.45.2; PostgreSQL 18.6 self-hosted via Docker Compose; `@nestjs/websockets` + `ws`.
- OpenAPI generation: every DTO carries class-validator + `@nestjs/swagger` decorators; spec generated from code, never hand-authored (AD-10).
- Deployment & environments: single local environment via Docker Compose (Postgres + backend + frontend) — no cloud/staging/production environment provisioned for this engagement.
- Seed data: one dataset (≥500 realistic Listings across ≥50 French communes) serves both the load test (NFR4) and the promotional video deliverable — build once, reuse.

### UX Design Requirements

None — no UX design contract exists for this project.

### FR Coverage Map

FR1: Epic 1 - Anonymous map browsing
FR2: Epic 1 - Unauthenticated listing detail view
FR23: Epic 1 - Consent gate before device geolocation
FR3: Epic 2 - Job seeker account creation
FR4: Epic 2 - Professional profile management
FR5: Epic 2 - Catch interaction
FR6: Epic 2 - Direct application
FR7: Epic 2 - Catch count & badges
FR8: Epic 2 - Permis de Travail unlock
FR9: Epic 2 - Application tracking
FR10: Epic 3 - Employer account creation with verification
FR11: Epic 3 - Publish a geolocated listing
FR12: Epic 3 - Automatic archival
FR13: Epic 3 - New-application notification
FR14: Epic 3 - Application triage
FR15: Epic 3 - Listing performance stats
FR16: Epic 3 - Subscription status
FR24: Epic 3 - Subscription lapse handling
FR17: Epic 4 - Real-time listing appearance
FR18: Epic 5 - Report a listing
FR19: Epic 5 - Moderation queue & action
FR20: Epic 5 - Account activation/suspension
FR21: Epic 5 - Account deletion & data retention
FR22: Epic 5 - Aggregate national metrics
FR25: Epic 6 - Single displayed product name
FR26: Epic 6 - Ministerial graphic charter applied

## Epic List

### Epic 1: Public Map Discovery
Anyone can browse the live map of geolocated job listings and see their details — no account required — with a compliant consent flow for the device location the map centers on. This is the free-browsing entry point the ministry required and the foundation every later epic's map builds on.
**FRs covered:** FR1, FR2, FR23

### Epic 2: Job Seeker Identity, Catch & Applications
A job seeker can create an account, build a profile, "catch" listings on the map to apply, track every application's status, and unlock badges up to the Permis de Travail at 10 catches — the full gamified job-seeker loop, backed by server-side catch integrity (no client-trusted counts, no duplicate catches).
**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8, FR9

### Epic 3: Employer Listings, Applications & Subscription
A verified employer can publish a geolocated listing within their subscription's radius, get notified and triage incoming applications, see performance stats and subscription status on a dashboard, and have listings auto-archive or get removed if payment lapses — the complete employer-side loop.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR24

### Epic 4: Real-Time Map Updates
A newly published listing appears on job seekers' and visitors' maps without a page reload, over WebSocket by default with a documented, config-switchable polling fallback (and a full kill-switch) for networks that block outbound WebSockets — the "alive" map, delivered in a way that survives the ministerial network.
**FRs covered:** FR17

### Epic 5: Administration — Moderation, Governance & Metrics
A ministry administrator can act on flagged listings, activate or suspend any account (with no special-case bypass for anyone, including the ministry itself), process account-deletion requests, and see aggregate national metrics — the complete trust-and-safety and oversight surface.
**FRs covered:** FR18, FR19, FR20, FR21, FR22

### Epic 6: Brand & Naming Compliance
Every user-facing surface — including the ones teams forget (login, error pages, empty states, loading states, transactional emails, favicon, tab title, PDF exports) — renders the single approved product name and follows the ministerial graphic charter, with an honest per-screen compliance checklist.
**FRs covered:** FR25, FR26

### Epic 7: Technical & Compliance Deliverables
The ministry's technical advisor made a set of engineering deliverables explicitly non-negotiable, independent of feature completeness — a live health check, API docs generated from code (not hand-written), a DB schema that matches reality, a measurably-real tile cache, an honest load test, and proof the app runs locally from a clean clone. None of these are user-facing FRs, but without them the build is rejected regardless of what else works.
**NFRs/Deliverables covered:** NFR2, NFR4, NFR6, NFR7, NFR9, NFR10, NFR17, NFR18 (AD-9, AD-10, AD-11)

## Epic 1: Public Map Discovery

Anyone can browse the live map of geolocated job listings and see their details — no account required — with a compliant consent flow for the device location the map centers on.

### Story 1.1: Anonymous Map Browsing

As a visitor,
I want to view an interactive map of geolocated job listings without creating an account,
So that I can explore what's available before committing to sign up.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I load the GéoEmploi site
**Then** I see an interactive map with Listing markers visible, no login prompt blocking the view

**Given** I have not yet granted location consent
**When** the map first loads
**Then** it falls back to a manual location/commune search rather than blocking browsing (realizes FR23, Story 1.3)

**Given** I pan or zoom the map
**When** the visible area changes
**Then** Listing markers update to reflect the current viewport without a full page reload

**Given** I load the site on a mobile or a desktop browser
**When** the map renders
**Then** it displays correctly and remains usable on both (NFR21)

**Given** the map is loading on a standard connection
**When** I measure the time to first usable render
**Then** it is under 3 seconds (NFR1)

### Story 1.2: View Listing Details Without an Account

As a visitor,
I want to open a listing marker and see its details,
So that I can evaluate a job opportunity before deciding to create an account.

**Acceptance Criteria:**

**Given** I am not authenticated and viewing the map
**When** I select a Listing marker
**Then** I see its title, employer name, location, and description

**Given** I am viewing a Listing's details as a Visitor
**When** I look for an Apply action
**Then** it is visibly disabled or replaced with a prompt to create a Job Seeker account — Applying itself is out of scope for this story (realized in Epic 2)

**Given** a Listing has been archived or removed
**When** I would otherwise have reached its detail view (e.g. a stale link)
**Then** it is not shown as an open, applyable Listing

### Story 1.3: Consent Gate Before Device Geolocation

As a visitor,
I want a clear notice and explicit control over whether the app accesses my device location,
So that I understand what's collected before I agree to it.

**Acceptance Criteria:**

**Given** I visit the site for the first time in a session
**When** the map is about to request my device location
**Then** I see a clear, accessible notice explaining what location data is collected and why, with an explicit accept/decline choice, before any browser geolocation API call fires

**Given** I decline consent
**When** I dismiss the notice
**Then** the map still loads via manual location/commune search and browsing works normally (no dead end)

**Given** I accept consent
**When** the choice is recorded
**Then** the consent event is logged (who/when) and my choice is not re-asked every page load within the same session/account (NFR14)

## Epic 2: Job Seeker Identity, Catch & Applications

A job seeker can create an account, build a profile, "catch" listings on the map to apply, track every application's status, and unlock badges up to the Permis de Travail at 10 catches.

### Story 2.1: Job Seeker Account Creation

As a visitor,
I want to create a Job Seeker account,
So that I can apply to listings.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I submit valid registration details (email, password)
**Then** a Job Seeker account is created (`accounts` row with `role = JobSeeker`, AD-14) and I am authenticated (JWT issued, AD-4)

**Given** I submit an email already registered to an account
**When** I try to register
**Then** I see a clear error and no duplicate account is created

**Given** my account is created with role JobSeeker
**When** I attempt to access an Employer- or Administrator-only route
**Then** I am denied (AD-15 RolesGuard)

### Story 2.2: Professional Profile Management

As an authenticated Job Seeker,
I want to create and edit my professional profile,
So that employers see relevant information when I apply.

**Acceptance Criteria:**

**Given** I am an authenticated Job Seeker with no profile yet
**When** I fill in skills, experience, and availability and save
**Then** my profile is persisted in `job_seeker_profiles` (AD-14) and visible to me on return visits

**Given** I have an existing profile
**When** I edit and save changes
**Then** the updated values are what gets transmitted on my next Application (Story 2.3)

**Given** required fields are left empty
**When** I try to save
**Then** I see validation errors and nothing is persisted

### Story 2.3: Catch Interaction & Direct Application

As an authenticated Job Seeker,
I want to catch a listing on the map and apply directly,
So that my profile reaches the employer without extra steps.

**Acceptance Criteria:**

**Given** I am authenticated and viewing the map
**When** I select a Listing marker and confirm
**Then** this triggers a "Catch" (visually distinct from plain browsing) and creates an Application with my current profile attached, via the `ApplyToListing` use case (AD-6)

**Given** I have already caught/applied to a specific Listing
**When** I try to catch it again
**Then** the action is a no-op — no duplicate Application is created (`UNIQUE(job_seeker_id, listing_id)`, AD-6)

**Given** my Apply succeeds
**When** the Employer views this Listing's applications (Epic 3)
**Then** my transmitted profile matches what I last saved in Story 2.2

### Story 2.4: Catch Count, Badges & Permis de Travail Unlock

As an authenticated Job Seeker,
I want to see my catch count and earned badges,
So that I feel a sense of progress using the app.

**Acceptance Criteria:**

**Given** I have caught N distinct Listings
**When** I view my badges/progress screen
**Then** my displayed catch count exactly equals my persisted Application count, computed server-side (AD-6) — never a client-tracked number

**Given** my catch count reaches 10
**When** the 10th Catch is confirmed
**Then** the Permis de Travail badge/status unlocks and is surfaced distinctly from a routine application confirmation (FR8)

**Given** I catch two different Listings concurrently (e.g. two open tabs) crossing the 9th→10th threshold
**When** both requests are processed
**Then** the Permis de Travail unlock fires exactly once — never zero or two times (AD-6 row lock on the account)

### Story 2.5: Application Tracking

As an authenticated Job Seeker,
I want to see the status of all my ongoing applications in one place,
So that I can follow up appropriately.

**Acceptance Criteria:**

**Given** I have submitted one or more Applications
**When** I open "My Applications"
**Then** I see each one with its current status

**Given** an Application's status changes (via whatever authorized process updates it — see Epic 3 once employer-side triage exists)
**When** I next view my applications
**Then** the current status is reflected — this story is complete and testable on its own using seeded status data, independent of that later process existing yet

**Given** I have no Applications yet
**When** I open the screen
**Then** I see an empty state, not an error

## Epic 3: Employer Listings, Applications & Subscription

A verified employer can publish a geolocated listing within their subscription's radius, get notified and triage incoming applications, see performance stats and subscription status, and have listings auto-archive or get removed if payment lapses.

### Story 3.1: Employer Account Creation with Verification

As a visitor,
I want to create an Employer account with activity verification,
So that I can publish job listings.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I submit valid registration details plus verification information
**Then** an Employer account is created (`accounts` row with `role = Employer`, AD-14), verification runs as a step inside that same provisioning use case (AD-13), and publishing stays blocked until it completes

**Given** verification is pending
**When** I try to publish a Listing
**Then** I am blocked with a clear status message explaining why

**Given** verification succeeds
**When** I check my account status
**Then** I can now publish Listings (Story 3.2)

### Story 3.2: Publish a Geolocated Listing

As a verified Employer,
I want to publish a geolocated listing within my subscription's radius,
So that nearby job seekers can find it.

**Acceptance Criteria:**

**Given** I am a verified Employer
**When** I create a Listing with position, location, and description
**Then** it is published with `status = 'published'` (AD-12) and appears on the public/job-seeker map (Epic 1, Epic 2) within my Distribution Radius

**Given** my Subscription Tier's maximum radius is 10km (Standard, working default, NFR20)
**When** I try to set a Distribution Radius beyond that
**Then** I am blocked or clamped to the tier maximum

**Given** a Listing I published reaches 30 days old
**When** the scheduled lifecycle job runs
**Then** its status transitions to `archived` (AD-12, Time-bound lifecycle convention) and it no longer appears on the public/job-seeker map

### Story 3.3: New-Application Notification

As a verified Employer,
I want to be notified in-app when someone applies to my listing,
So that I don't miss candidates.

**Acceptance Criteria:**

**Given** a Job Seeker applies to my Listing (Epic 2, Story 2.3)
**When** the Application is created
**Then** I receive an in-app notification — never a commercial email (NFR16 sovereignty)

**Given** multiple Applications arrive close together
**When** I check my notifications
**Then** each is distinct and traceable to its own Listing and Applicant

### Story 3.4: Application Triage

As a verified Employer,
I want to sort/filter received applications and contact applicants,
So that I can manage my hiring pipeline.

**Acceptance Criteria:**

**Given** I have received Applications on my Listings
**When** I open the Applications view
**Then** I can filter/sort them by status

**Given** I select an Application to one of my own Listings
**When** I update its status or view the applicant's contact info
**Then** the change is persisted and visible to the Job Seeker (Epic 2, Story 2.5) — the Application row itself stays otherwise immutable (AD-6), only its status field changes

**Given** I attempt to act on an Application for a Listing I do not own
**When** I try the action
**Then** I am denied

### Story 3.5: Listing Performance Stats & Subscription Dashboard

As a verified Employer,
I want to see my listing's views/applications and my subscription status,
So that I understand the value I'm getting.

**Acceptance Criteria:**

**Given** I have a published Listing
**When** I view my dashboard
**Then** I see its view count and applications received (FR15)

**Given** I hold a Subscription Tier
**When** I view my dashboard
**Then** I see my current tier and simulated billing status — no real payment processor is involved (NFR20)

**Given** my tier is Standard
**When** I check my radius limit
**Then** it shows the 10km working-default baseline (§9 PRD, `[ASSUMPTION]`)

### Story 3.6: Subscription Lapse Handling

As a verified Employer,
I want to be warned before my listings are removed for non-payment,
So that I have a chance to act.

**Acceptance Criteria:**

**Given** my simulated subscription payment lapses
**When** the system detects this
**Then** I am notified in-app (same mechanism as Story 3.3)

**Given** 7 days have passed since the lapse notification with no resolution
**When** the scheduled lifecycle job runs
**Then** my still-live Listings transition to `status = 'lapsed'` (AD-12) and are removed from public view — never hard-deleted

**Given** I resolve payment within the 7-day window
**When** the system detects the resumed subscription
**Then** the pending removal is cancelled and my Listings remain live

## Epic 4: Real-Time Map Updates

A newly published listing appears on job seekers' and visitors' maps without a page reload, over WebSocket by default with a documented, config-switchable polling fallback (and a full kill-switch) for networks that block outbound WebSockets.

### Story 4.1: Live Listing Appearance via WebSocket

As an authenticated Job Seeker or Visitor,
I want new and changed listings to appear on my map without reloading,
So that the map feels current.

**Acceptance Criteria:**

**Given** I am viewing the map with WebSocket delivery active (default)
**When** an Employer publishes a new Listing within my viewport
**Then** it appears on my map without a page reload, delivered as the canonical `{ listingId, eventType: 'published', listing }` event (AD-5)

**Given** a Listing's status changes to `archived`, `lapsed`, or `removed`
**When** that change is broadcast
**Then** my map reflects it live (the marker disappears) without a page reload

**Given** I receive the same Listing event more than once (e.g. after a reconnect)
**When** my client processes it
**Then** delivery dedupes by Listing ID and I never see a duplicate or flickering marker

### Story 4.2: Polling Fallback & WebSocket Kill-Switch

As a system operator,
I want a documented, config-driven fallback from WebSocket to polling (and a full kill switch),
So that the app works on networks that block outbound WebSockets.

**Acceptance Criteria:**

**Given** the environment variable selects the Polling adapter
**When** the app runs
**Then** Listing updates are delivered via polling instead of WebSocket, with no code change required (AD-5)

**Given** WebSocket is fully disabled via config
**When** the app runs
**Then** no WebSocket connection is attempted at all, and polling exclusively delivers updates

**Given** the two delivery modes exist
**When** documentation is produced
**Then** every behavioral difference between WebSocket and polling mode is written down (e.g. latency, connection persistence) — "nothing different" is not an acceptable answer (NFR5)

**Given** a client switches delivery mode (e.g. reconnects into the other adapter)
**When** it receives events from the new mode
**Then** delivery still dedupes by Listing ID, matching Story 4.1's guarantee

## Epic 5: Administration — Moderation, Governance & Metrics

A ministry administrator can act on flagged listings, activate or suspend any account (with no special-case bypass for anyone, including the ministry itself), process account-deletion requests, and see aggregate national metrics.

### Story 5.1: Report a Listing

As any user,
I want to flag a listing as fraudulent or non-compliant,
So that bad content gets reviewed.

**Acceptance Criteria:**

**Given** I am viewing a Listing, authenticated or not
**When** I submit a report with a reason
**Then** a Report record is created, linking my identity if I'm authenticated, to the Listing

**Given** my report is created
**When** it's persisted
**Then** it appears in the Administrator's moderation queue (Story 5.2)

**Given** I already reported a specific Listing
**When** I report it again
**Then** it does not create confusing duplicate queue entries for the same underlying complaint

### Story 5.2: Moderation Queue & Action

As an Administrator,
I want to review flagged listings and act on them,
So that bad content is removed quickly.

**Acceptance Criteria:**

**Given** Reports exist
**When** I open the moderation queue
**Then** I see each flagged Listing with its reporter's note

**Given** I review a flagged Listing and decide to remove it
**When** I confirm the action
**Then** its status transitions to `removed` (AD-12, soft-delete — never a hard delete) and it disappears from every map within the same session, with no engineering intervention needed

**Given** removal is warranted
**When** I act on the Listing
**Then** I have a path to also flag the associated Employer account for suspension — the suspension mechanism itself is Story 5.3; this story is complete once the Listing is removed, whether or not that follow-on action is taken

**Given** I am not an Administrator
**When** I try to access the moderation queue
**Then** I am denied (AD-15 RolesGuard)

### Story 5.3: Account Activation & Suspension

As an Administrator,
I want to activate or suspend any Job Seeker or Employer account,
So that I can enforce platform rules.

**Acceptance Criteria:**

**Given** an account needs suspension
**When** I suspend it
**Then** it can no longer authenticate or act, while its historical Listings/Applications are preserved (consistent with AD-12's soft-delete philosophy)

**Given** any account, including an Administrator account, needs to be created
**When** it is provisioned
**Then** it goes through the exact same governance use case as every other account (AD-13) — no seed script, migration, or config flag creates one outside it, not even for the ministry itself

**Given** I am not an Administrator
**When** I try to access account governance
**Then** I am denied (AD-15)

### Story 5.4: Account Deletion & Data Retention

As a user of any role,
I want to request deletion of my account,
So that my personal data is not retained indefinitely.

**Acceptance Criteria:**

**Given** I request deletion
**When** the request is processed
**Then** my account is deactivated and its credentials deleted immediately, via the single `DeleteAccount` use case (AD-7)

**Given** a bounded legitimate-interest exception applies (e.g. an Employer still triaging my in-progress Application, Epic 3 Story 3.4)
**When** that exception is active
**Then** my identifying fields are retained only until the exception lapses, then anonymized

**Given** no exception applies
**When** deletion is processed
**Then** my personal data is anonymized immediately, not merely flagged for later cleanup

### Story 5.5: National Metrics Dashboard

As an Administrator,
I want to see aggregate national metrics,
So that I can report on platform activity.

**Acceptance Criteria:**

**Given** the platform has activity
**When** I view the metrics dashboard
**Then** I see active accounts by type, Listings published, and Applications submitted

**Given** "active" needs a definition for these metrics
**When** they are computed
**Then** they reuse the exact status fields AD-12 (Listing) and AD-13/account state already define — no separate, ad hoc definition of "active" is invented for the dashboard

**Given** I am not an Administrator
**When** I try to access this dashboard
**Then** I am denied (AD-15)

## Epic 6: Brand & Naming Compliance

Every user-facing surface — including the ones teams forget — renders the single approved product name and follows the ministerial graphic charter, with an honest per-screen compliance checklist.

### Story 6.1: Single Displayed Product Name

As the ministry's communications team,
I want the product name "GéoEmploi" to be the only name shown anywhere in the UI,
So that no confusing variant reaches the press.

**Acceptance Criteria:**

**Given** any user-facing text renders the product name
**When** all UI strings, transactional messages, and exports are scanned
**Then** "GéoEmploi" is the only variant found — zero occurrences of "ChomageGo" or any other name

**Given** the product name is referenced anywhere in code
**When** it is implemented
**Then** it comes from exactly one i18n/strings source (AD-8), never hardcoded inline elsewhere

### Story 6.2: Design Token System for the Graphic Charter

As a developer,
I want a single design-token module carrying the ministerial charter's colors and typography,
So that every component consumes it and stays compliant by construction.

**Acceptance Criteria:**

**Given** the charter specifies institutional blue `#1B3A6B` (never as a button fill), Marianne for headings, and Spectral for body text
**When** any component is built
**Then** it consumes the shared token module rather than defining its own colors or fonts (AD-8)

**Given** the ministry lockup must sit top-left with a protected clear-zone and never over a photo
**When** any screen with a header renders
**Then** this placement rule holds

### Story 6.3: Per-Screen Charter Compliance Checklist

As the ministry's communications team,
I want an honest per-screen compliance checklist,
So that I know exactly what's done and what's still pending.

**Acceptance Criteria:**

**Given** the charter's explicitly required surfaces (login, 404, 500, empty states, loading states, transactional emails, favicon, tab title, PDF exports)
**When** each is reviewed
**Then** it is marked "conforme" or "à faire (date)" in a maintained checklist — no unmarked partial rollout

**Given** a Listing search or map view returns zero results
**When** the empty state renders
**Then** it follows the charter — this is one of the surfaces the ministry explicitly named as commonly forgotten

**Given** an unhandled error occurs
**When** the 404 or 500 page renders
**Then** it follows the charter rather than a generic framework default page

## Epic 7: Technical & Compliance Deliverables

The ministry's technical advisor made a set of engineering deliverables explicitly non-negotiable, independent of feature completeness.

### Story 7.1: Realistic Seed Dataset

As a developer,
I want a realistic seed dataset of listings across real French communes,
So that the load test and the promotional video both have credible data to work with.

**Acceptance Criteria:**

**Given** the seeder runs
**When** it populates the database
**Then** it creates at least 500 Listings across at least 50 real French communes, with real-sounding company names and job titles — no "test" or lorem-ipsum placeholders

**Given** the same dataset exists
**When** it is used for the load test (Story 7.6) or the promotional video capture (communications deliverable, outside this codebase)
**Then** no second dataset needs to be built — one dataset, two deliverables

### Story 7.2: Health Check Endpoint

As a ministry technical reviewer,
I want a `/health` endpoint that reports app status without depending on the tile provider,
So that I can verify the service is actually up.

**Acceptance Criteria:**

**Given** the backend is running
**When** I call `GET /health`
**Then** I receive app status, deployed version, and DB connectivity, responding in under 200ms

**Given** the map tile provider is unresponsive
**When** I call `GET /health`
**Then** it still responds under 200ms — no call to the Mapping adapter is ever made (AD-9)

**Given** the database is unreachable
**When** I call `GET /health`
**Then** the response reflects that DB connectivity has failed, rather than the endpoint crashing or timing out

### Story 7.3: OpenAPI Documentation Generated From Code

As a ministry technical reviewer,
I want a live, accurate Swagger UI generated from the code,
So that the API is trustworthy documentation, not a rumor.

**Acceptance Criteria:**

**Given** every DTO carries class-validator + `@nestjs/swagger` decorators
**When** the app boots
**Then** a complete OpenAPI 3.0 spec is generated and served via Swagger UI, before deployment (AD-10)

**Given** an endpoint needs a documented example
**When** the spec is produced
**Then** each endpoint's example request/response is real, captured by a committed `.http` file or curl script — never hand-written

**Given** a DTO changes
**When** the app rebuilds
**Then** the OpenAPI spec reflects the change automatically, with no manual sync step

### Story 7.4: Database Schema Export & Sync

As a ministry technical reviewer,
I want a logical DB schema (DBML or image) that matches the running database,
So that I can trust the data model documentation.

**Acceptance Criteria:**

**Given** the current Drizzle schema
**When** I generate the DB schema artifact
**Then** it shows the logical model, cardinalities, and indexes, delivered by Friday 17:00

**Given** a column is added or changed
**When** the schema artifact is regenerated
**Then** it is updated the same day as the code change — no drift between schema and reality

### Story 7.5: Map Tile Cache Observability

As a ministry technical reviewer,
I want measurable proof the tile cache exists,
So that I'm not trusting an unverified claim.

**Acceptance Criteria:**

**Given** the Mapping adapter serves tile requests
**When** a tile is requested twice for the same view
**Then** the second request is served from cache and a hit counter increments

**Given** a tile is requested for the first time
**When** it is fetched from the provider
**Then** a miss counter increments

**Given** I compare a first load vs. a second load of the same view
**When** I check the cache metrics
**Then** I can see the measured hit/miss difference (AD-11) — this is Thomas's specific acceptance test

### Story 7.6: Load Test Execution & Report

As a ministry technical reviewer,
I want an honest load test report before the technical review,
So that I know the system's real limits.

**Acceptance Criteria:**

**Given** the database is seeded with the realistic dataset (Story 7.1: ≥500 Listings across ≥50 communes)
**When** the load test runs (k6, Locust, or JMeter)
**Then** it simulates 50 concurrent users for 3 minutes against map browsing and listing-list endpoints

**Given** the test completes
**When** the report is produced
**Then** it includes the script itself, median and p95 response time, error rate, and the single line the team would fix first and why

**Given** the results are poor
**When** they are reported
**Then** that is stated honestly rather than smoothed over — an honest bad result beats a polished graph (NFR4)

### Story 7.7: Local Install Verification & Deployment Note

As a ministry technical reviewer,
I want proof the app runs locally from a clean clone, and a one-page note on hypothetical production deployment,
So that I can trust the sovereignty claim without opening an account myself.

**Acceptance Criteria:**

**Given** a fresh clone in an empty directory
**When** a team member who did not write the install steps follows them literally, with no guessing
**Then** the app reaches a running state, and the time taken is recorded and reported back as the acceptance criterion (not a pass/fail)

**Given** the install succeeds
**When** a one-page deployment note is produced
**Then** it states where the service would run in production, what resources it needs, and what data would leave the infrastructure and to whom
