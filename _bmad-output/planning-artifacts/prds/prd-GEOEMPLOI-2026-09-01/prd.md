---
title: GéoEmploi
created: 2026-09-01
updated: 2026-09-01
status: final
review_status: reviewer-gate findings addressed 2026-09-01 (RGPD consent, catch integrity, sovereignty checklist, deletion/retention conflict, subscription lapse, WS toggle+dedupe); reconciled against all 5 source inputs; polished
---

# PRD: GéoEmploi
*Working title — confirm. Internal gamification codename: "ChomageGo."*

## 0. Document Purpose

This PRD is written for the delivery team (5 people) building GéoEmploi for the Ministère du Job et Bonheur, and for the downstream workflows that consume it (`bmad-architecture`, `bmad-create-epics-and-stories`). It reconciles source documents that disagree with each other — the original functional specification (legal/administrative, authored by Florine Pontaillac) and an annotated revision layering a gamified "catch a listing" vision from Minister Jean-Eudes Berlier (JEB) on top of it — plus two separate, non-negotiable memos from the ministry's advisors: technical constraints from digital advisor Thomas Vignal, and brand/communications requirements from communications advisor Benjamin Sellami. Where the sources conflict, the resolution and its rationale are stated inline; nothing is silently dropped. This draft has also been through a Reviewer Gate pass (rubric + adversarial + edge-case) — findings are folded in directly rather than tracked separately. Terms follow the Glossary (§3) exactly. Engineering/tooling choices that implement these requirements (stack, architecture pattern, library selection) live in `addendum.md`, not here.

## 1. Vision

GéoEmploi turns the physical act of looking for work into a geolocated, map-first experience: job seekers browse open positions the way they'd browse a map of their own city, and employers reach candidates already circulating in the area they're hiring for. The product keeps the ministry's original framing — a complement to FranceTravail and Apec, not a replacement for them, aimed at a mobile, connected working population — while adopting the gamified presentation layer the minister is calling "ChomageGo." Listings surface on the map as things you move toward and "catch"; catching enough of them unlocks visible milestones (badges, a "Permis de Travail" status). New listings appear on the map live as employers publish them.

The product is deliberately not a rebuild of FranceTravail's matching engine. It solves a narrower problem well: turning "is there anything hiring near me right now" into a two-tap answer, for both the person looking and the business posting.

Two audiences are served directly (job seekers, employers); one operates the system (ministry administrators/moderators); one browses without commitment (anonymous visitors, who can explore the map with zero signup friction).

## 2. Target User

### 2.1 Jobs To Be Done

- **Job seeker:** "Show me what's hiring within reach of where I actually am, without making me fill out a form first." Functional (find a job near me) and emotional (the search feels like discovery, not paperwork; visible progress — badges — keeps the loop motivating rather than discouraging).
- **Employer:** "Get my opening in front of people who are physically close enough to show up, and let me see whether posting actually produces candidates." Functional (publish, receive, triage) and business (a subscription tier that says "our reach is proportional to what we pay for").
- **Ministry administrator:** "See what's happening nationally, keep the listing pool clean, and be able to act on a bad account or a bad listing without engineering help."
- **Anonymous visitor:** "Let me see what's out there before I commit to creating an account."

### 2.2 Non-Users (v1)

- Users without a smartphone/modern browser or reliable connectivity — there is no offline mode and no SMS-based fallback.
- Non-French speakers — the product ships French-only in v1 (confirmed with the ministry contact).
- FranceTravail/Apec as data-integration partners — the product does not exchange data with either system in v1, regardless of the minister's "we replace them" framing (see §5 Non-Goals).

### 2.3 Key User Journeys

- **UJ-1. Amina browses without committing to anything.**
  - **Persona + context:** Amina heard about GéoEmploi from a friend and wants to see if it's worth creating an account before she bothers.
  - **Entry state:** Not authenticated, first visit, mobile browser.
  - **Path:** Opens the site → sees a clear, accessible notice explaining what location data is collected and why, with an explicit consent choice (realizes FR-23) → on consent, map loads centered on her location (browser geolocation, no account) → she pans/zooms and sees listing markers around her → taps one → sees title, employer, distance, description.
  - **Climax:** She sees real, current, nearby listings without having signed up for anything — the free-browsing promise is real, not a teaser.
  - **Resolution:** She decides to create an account to apply.
  - **Edge case:** Browser geolocation denied, or consent declined → map falls back to a manual location/commune search; free browsing still works either way.

- **UJ-2. Karim catches a listing on his walk home and unlocks his "Permis de Travail."**
  - **Persona + context:** Karim, a warehouse worker between contracts, checks the app most evenings on his commute.
  - **Entry state:** Authenticated job seeker, mobile, map view.
  - **Path:** Map shows nearby listings as live markers → a new one appears near his route (pushed in real time as an employer just published it) → he moves toward it, taps it, hits Apply → his profile is sent to the employer → the app shows a "caught" animation and increments his catch counter.
  - **Climax:** This is his 10th catch — the app immediately surfaces the "Permis de Travail" badge unlock, distinct from a routine application confirmation.
  - **Resolution:** He opens "My Applications" and sees this one alongside his other tracked applications, each with a status.
  - **Edge case:** If the WebSocket connection is unavailable (e.g. a locked-down network), the map falls back to polling — Karim sees the same new listing slightly later, with no visible error.

- **UJ-3. Fatima publishes a listing and watches it perform.**
  - **Persona + context:** Fatima runs HR for a mid-size logistics company hiring drivers.
  - **Entry state:** Authenticated employer, verified account, desktop browser.
  - **Path:** Creates a listing (title, location, description, distribution radius tied to her subscription tier) → publishes → sees it live on her dashboard → over the following days, receives in-app notifications as applications arrive → opens the dashboard to see view count and applications received, sorts applicants by status.
  - **Climax:** She sees, in one screen, that the listing generated real, qualified interest — the view/application counts make the €400/month tangible.
  - **Resolution:** She contacts a promising candidate directly from the applications list.
  - **Edge case:** Her Standard tier's radius doesn't reach a candidate pool she wants — she sees the option to move to Premium (price/radius not yet defined by the ministry, shown as "contact us" rather than a broken checkout flow).

- **UJ-4. Sami handles a flagged listing.**
  - **Persona + context:** Sami, a ministry-side moderator handling day-to-day operations.
  - **Entry state:** Authenticated admin, moderation queue.
  - **Path:** A visitor flags a listing as fraudulent → it appears in the moderation queue → admin opens it, reviews content and reporter's note → removes the listing and, if warranted, suspends the employer account.
  - **Climax:** The listing is off the public map within the same session — no dependency on engineering intervention.
  - **Resolution:** The employer account shows a suspension flag; national metrics reflect one fewer active listing.

## 3. Glossary

- **Visitor** — Unauthenticated user browsing the public map. No profile, no application capability.
- **Job Seeker** — Authenticated user with a professional profile who can apply to Listings and track Applications.
- **Employer** — Authenticated, activity-verified user who can publish Listings and manage received Applications.
- **Administrator** — Ministry-side operator with moderation, account governance, and national metrics access. Single role in v1 (no sub-roles).
- **Listing** — A geolocated job posting: position, location, description, Distribution Radius, publication date. Auto-archived 30 days after publication.
- **Distribution Radius** — The geographic reach of a Listing on the map, bounded by the Employer's Subscription Tier.
- **Application** — A Job Seeker's submitted interest in a Listing; carries a Status (submitted, viewed, contacted, etc.) tracked by both parties.
- **Catch** — The gamified interaction of applying to a Listing from the map view (approach the marker, trigger Apply). Each successful Catch increments the Job Seeker's catch count.
- **Badge** — A milestone marker awarded on catch-count thresholds.
- **Permis de Travail** — The badge/status unlocked after 10 Catches; the headline gamification milestone named explicitly by the ministry.
- **Subscription Tier** — An Employer's plan (Standard or Premium) that determines maximum Distribution Radius and monthly price. Billing is simulated in v1 (§ Monetization).
- **Report** — A flag raised by any user against a Listing believed to be fraudulent or non-compliant, feeding the Administrator's moderation queue.

## 4. Features

### 4.1 Public Map Discovery
**Description:** Anyone can browse the live map of Listings without an account — this is the entry point for Visitors and the free-browsing guarantee the ministry made explicit. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Anonymous map browsing
Visitor can view an interactive map of geolocated Listings without creating an account or authenticating.
**Consequences (testable):**
- No auth token or session is required to load the map or fetch Listing markers.
- Map is usable (pan/zoom/select) on both mobile and desktop browsers.

#### FR-2: Listing detail view (unauthenticated)
Visitor can open a Listing marker and see its public details (title, employer name, location, description) without an account.
**Out of Scope:** Applying — that requires a Job Seeker account (FR-6).

#### FR-23: Consent gate before device geolocation
Before the system requests a Visitor's or Job Seeker's device location for the first time, it presents a clear, accessible information notice (what is collected, why, how long it's kept) and requires an explicit consent action before any browser geolocation call fires.
**Consequences (testable):**
- No geolocation API call is made before consent is recorded for that session/account.
- Declining consent does not block map browsing — the user falls back to manual location/commune search (UJ-1 edge case).
- Consent state is auditable (who/when), independent of account creation.

---

### 4.2 Job Seeker Profile
**Description:** The account layer that unlocks application capability.

**Functional Requirements:**

#### FR-3: Job seeker account creation
Visitor can create a Job Seeker account (email/password or equivalent).

#### FR-4: Professional profile management
Job Seeker can create and edit a professional profile: skills, experience, availability.
**Consequences (testable):**
- Profile fields are what gets transmitted to an Employer on Application (FR-6).

---

### 4.3 Gamified Discovery & Application
**Description:** The "ChomageGo" layer — Listings render as things you move toward and catch, and catching enough of them produces visible status. This is additive presentation on top of the same underlying map and application data, not a separate data model. Realizes UJ-2.

**Functional Requirements:**

#### FR-5: Catch interaction
Authenticated Job Seeker sees Listings on the map as interactive markers; selecting/approaching one and confirming triggers the Apply action (FR-6) and is visually distinct as a "Catch."
**Consequences (testable):**
- A Catch and a plain "Apply" produce the same underlying Application record — the gamification is presentational, not a second application pathway.
- The system enforces at most one Application (Catch) per (Job Seeker, Listing) pair. A repeat interaction on an already-caught Listing is a no-op — it does not create a second Application or increment the catch count again.

`[ASSUMPTION: v1's Catch is a map-selection interaction (open the marker, confirm) with no device-proximity or timing gate. The minister's "walk toward it, catch it at the right moment" framing is treated as UX flavor, not a functional requirement — as written, a Job Seeker could catch any listing nationally without moving. Revisit if physical-proximity gating turns out to matter for the jury demo.]`

#### FR-6: Direct application
Job Seeker can apply to a Listing directly in-app; their profile (FR-4) is transmitted to the Employer.

#### FR-7: Catch count & badges
System tracks a per-Job-Seeker Catch count, computed server-side from the authoritative count of that Job Seeker's Applications (FR-5's uniqueness constraint applies) — never client-reported or client-incremented — and awards Badges at milestone thresholds. `[ASSUMPTION: intermediate milestones (e.g. 1st and 5th catch) beyond the ministry-specified 10th are invented for a believable badge ladder — confirm or drop]`.
**Consequences (testable):**
- Catch-count and Badge/Permis de Travail evaluation happen atomically as part of the Application-creation transaction, so a double-tap or two open tabs on the 9th→10th Catch cannot skip or double-fire the unlock.
- Each Catch/Application-creation event is logged (Job Seeker, Listing, timestamp) for audit purposes.

#### FR-8: Permis de Travail unlock
After the Job Seeker's 10th Catch, the system unlocks and surfaces the "Permis de Travail" badge/status distinctly from a routine application confirmation.

#### FR-9: Application tracking
Job Seeker can view the status of all their ongoing Applications in one place.

---

### 4.4 Employer Account & Verification
**Description:** Employers must be verified before they can publish, per the original spec's activity-verification requirement (unchanged by the ministerial revision).

**Functional Requirements:**

#### FR-10: Employer account creation with verification
Visitor can create an Employer account.
**Consequences (testable):**
- The account requires activity verification before it can publish Listings. `[ASSUMPTION: verification method — e.g. company registration number — not specified by either source; confirm before build]`.

---

### 4.5 Listing Publication
**Description:** Employers publish geolocated Listings whose reach is tied to their Subscription Tier. Realizes UJ-3.

**Functional Requirements:**

#### FR-11: Publish a geolocated listing
Verified Employer can publish a Listing: position, location, description, Distribution Radius.
**Consequences (testable):**
- Distribution Radius cannot exceed the maximum allowed by the Employer's current Subscription Tier.

#### FR-12: Automatic archival
Listings are automatically archived 30 days after publication.
**Consequences (testable):**
- Archived Listings no longer appear on the public or Job Seeker map (FR-1, FR-5).

---

### 4.6 Application Management (Employer side)
**Description:** Employers triage what a Listing produces.

**Functional Requirements:**

#### FR-13: New-application notification
Employer receives an in-app notification for each new Application to one of their Listings. `[DECISION: in-app, not commercial email — see Constraints & Guardrails / Sovereignty]`.

#### FR-14: Application triage
Employer can sort/filter received Applications by status and contact the applicant.

---

### 4.7 Employer Dashboard
**Description:** Makes the value of publishing (and paying) visible.

**Functional Requirements:**

#### FR-15: Listing performance stats
Employer dashboard shows, per Listing, view count and applications received.

#### FR-16: Subscription status
Employer dashboard shows current Subscription Tier and simulated billing status (§ Monetization).

#### FR-24: Subscription lapse handling
If an Employer's simulated subscription payment lapses, the system notifies the Employer; any of their Listings still live 7 days after that notice are automatically removed from the public map.
**Consequences (testable):**
- The 7-day countdown starts at the lapse notification, not at the original payment due date.
- A Listing removed this way follows the same removal behavior as archival (FR-12) — it stops appearing on FR-1/FR-5 maps.

---

### 4.8 Live Map Updates
**Description:** New Listings appear on Job Seekers' maps without a manual refresh — the "alive" map the ministry asked for, delivered in a way that survives a network that blocks outbound WebSockets.

**Functional Requirements:**

#### FR-17: Real-time listing appearance
A newly published Listing appears on the Job Seeker/Visitor map without a page reload.
**Consequences (testable):**
- Update mechanism is WebSocket by default, with a polling fallback switchable via configuration (not a code change) — see NFR-Reliability for the compliance obligation and the documented behavioral-difference requirement.
- WebSocket delivery can also be turned off entirely via configuration (an operator-level kill switch, not just an automatic fallback-on-failure) — a persistent live connection is a data-minimization surface the ministry may choose not to run.
- On any mode switch (WebSocket↔polling) or client reconnect, delivery is deduplicated by Listing ID — a Listing already shown to a client is never re-delivered or double-counted.

**Notes:** The minister's framing ("the map needs to move, it needs to be ALIVE") is interpreted narrowly here as real-time data delivery. Visual liveliness — marker animation, motion, entrance effects — is a presentation-layer UX choice this PRD doesn't separately specify as a testable requirement; flag to UX/design rather than assume it's covered by FR-17 alone.

---

### 4.9 Moderation & Reporting
**Description:** The ministry's explicit mitigation for "the technical provider isn't responsible for listing content." Realizes UJ-4.

**Functional Requirements:**

#### FR-18: Report a listing
Any user (Visitor, Job Seeker, Employer) can flag a Listing as fraudulent or non-compliant.

#### FR-19: Moderation queue & action
Administrator can review Reports and act on the underlying Listing (approve/remove) and, if warranted, the Employer account.

---

### 4.10 Account Governance
**Description:** Standard administration for all account types — including ministry-side accounts, with no special-case bypass (see Discovery decision: no admin backdoor for the Minister).

**Functional Requirements:**

#### FR-20: Account activation/suspension
Administrator can activate or suspend any Job Seeker or Employer account.
**Consequences (testable):**
- No account type, including ministry-provisioned ones, is created with elevated privileges outside this governed workflow.

#### FR-21: Account deletion & data retention
User can request deletion of their account. The request itself is the trigger — not a passive "inactive" state.
**Consequences (testable):**
- On request, the account is deactivated and its authentication credentials deleted immediately.
- Personal profile data (name, contact details) is anonymized immediately, except where a counterparty has a legitimate, time-boxed operational need — e.g. an Employer still triaging an in-progress Application (FR-14) — in which case the identifying fields are retained only until that need lapses, then anonymized. `[ASSUMPTION: exact retention window for that time-boxed exception not specified — needs a concrete value confirmed by the ministry's legal advisor, tracked in Open Questions]`.
- No personal data is retained beyond that bounded exception (§ Constraints & Guardrails / Privacy).

---

### 4.11 National Metrics Dashboard
**Description:** Kept intentionally minimal — the ministry asked for a national metrics dashboard with no further specification, and Discovery explicitly chose not to invent scope here.

**Functional Requirements:**

#### FR-22: Aggregate national metrics
Administrator can view aggregate counts: active accounts (by type), Listings published, Applications submitted.

---

### 4.12 Brand & Naming Compliance
**Description:** The ministry's communications advisor (Benjamin Sellami) set two hard rules that apply across every user-facing surface, not just the homepage: the ministerial graphic charter, and a single enforced product name.

**Functional Requirements:**

#### FR-25: Single displayed product name
Every user-facing surface (UI text, error messages, transactional emails, screenshots, exports) renders the product name as **"GéoEmploi"** and only that — no variant, no internal codename (including "ChomageGo").
**Consequences (testable):**
- A text scan across all UI strings, emails, and export templates finds zero occurrences of any name other than "GéoEmploi."

#### FR-26: Ministerial graphic charter applied
Every screen and generated artifact follows the ministerial charter: institutional blue `#1B3A6B` as primary color (never as a button fill), Marianne typeface for headings, Spectral for body text, ministry lockup top-left with its protected clear-zone (never placed over a photo).
**Consequences (testable):**
- Charter compliance is explicitly checked — not just implied — on: login screen, 404 and 500 error pages, empty states (e.g. "no listings in this area"), loading states, transactional emails, favicon, browser tab title, and any PDF export.
- The team maintains a per-screen list marked "conforme" or "à faire (date)" — an honest partial list is acceptable; an unmarked partial rollout is not.

**Notes:** The full 47-page charter document is pending; FR-26 covers the three rules already communicated. Revisit once the full document arrives.

---

## 5. Non-Goals (Explicit)

- Not a replacement for FranceTravail/Apec in v1, nor a data-integration partner of either — the minister's "we replace them" is treated as positioning language, not a functional requirement (see Discovery reconciliation).
- Not a native mobile app; not device-camera augmented reality — the "catch" mechanic is a gamified map UI layer (FR-5), not real AR, which the source brief itself permits ("simulated on a map" is acceptable for Week 1).
- Not a real payment/billing system — Subscription Tiers are modeled and displayed, not charged (§ Monetization).
- Not multi-language in v1 (French only).
- No offline mode, no SMS fallback.
- No special administrative access outside the standard governance workflow, for any party.
- The internal codename "ChomageGo" never appears on a user-facing surface — the displayed product name is always "GéoEmploi" (FR-25).

## 6. MVP Scope

### 6.1 In Scope

**Week 1 (proof of concept):**
- Public map browsing, no account required (FR-1, FR-2)
- Job Seeker and Employer account creation (FR-3, FR-10)
- Publication of at least one geolocated Listing (FR-11)
- Map presentation with the gamified/live treatment on the roadmap, simulated if full real-time isn't ready (FR-5, FR-17)
- Presentable prototype (not a developer-only screen) for the Thursday walkthrough
- Oral presentation (Thursday, technical review): functional demo of the above plus the chosen technical approach — a separate deliverable from the promotional video below, aimed at the technical review audience, not the communications channel.
- Graphic charter applied at least on the screens shown in the prototype (FR-26), with the per-screen compliance list started
- **Promotional video, due Friday 12:00:** under 2 minutes, 1080p horizontal, burned-in subtitles (mandatory, not optional voiceover), sized to stay legible on a phone screen. A continuous capture of the running app (no mockups, slides, or reconstructed animation) showing one journey: open the app → see the map → spot a nearby listing → apply — a narrative, explicitly **not a features tour**. Built on realistic seed data (real-sounding cities, companies, job titles — no "test"/lorem-ipsum placeholders, and no real personal data), at a volume sufficient for the map to look populated. Accompanied by a 5-line intention note (the three moments chosen to show, and what was deliberately cut) — this is the note Benjamin Sellami reads first, since it signals whether the team made deliberate editorial choices or just dumped everything in. `[NOTE FOR PM: the seed dataset for this video can and should be the same one used for the §7 Performance load test (≥500 listings / ≥50 communes) — one dataset, two deliverables.]`

**Week 2 (final version) — everything in §4, specifically:**
- Full gamification loop including Badges and Permis de Travail (FR-7, FR-8)
- Functional Employer dashboard including subscription status (FR-15, FR-16)
- Complete admin: moderation, governance, national metrics (FR-19, FR-20, FR-22)
- Live map updates with documented polling fallback (FR-17, NFR-Reliability)
- Full graphic charter compliance list closed out (FR-26)
- Technical documentation and project retrospective

### 6.2 Out of Scope for MVP

- Real payment processing (simulated only — reintroducing this later requires revisiting the sovereignty constraint)
- Native AR / native mobile app
- FranceTravail/Apec integration
- Multi-language support

## 7. Non-Functional Requirements

**Performance**
- Map load time under 3 seconds on a standard connection (baseline); under 1 second is a stretch goal, not a blocking target.
- `/health` responds in under 200ms, including when the map tile provider is unresponsive.
- The architecture must support gradual scaling — an explicit ministry requirement in its own right, independent of the specific production concurrency target, which remains open (§12, OQ-4).
- Load test: 50 concurrent simulated users for 3 minutes against map browsing and listing-list endpoints, run before the technical review, against a database seeded with at least 500 Listings across at least 50 communes. Deliverables: the load-test script itself, plus a report with median and p95 response time, error rate, and the single line the team would fix first **and why**. Honest, unflattering numbers with an explanation are the expectation — not a polished graph.

**Reliability**
- Live Listing updates (FR-17) use WebSocket by default; a polling fallback must exist, be switchable by configuration alone (no code change), and the team must document every behavioral difference between the two modes.
- WebSocket delivery can be disabled entirely by configuration, independent of the polling fallback (FR-17). Delivery deduplicates by Listing ID across any mode switch or reconnect.

**Observability**
- `/health` endpoint reports application status, deployed version, and database connectivity.
- Map tile requests are proxied and cached server-side; **the browser never calls the tile provider directly, and no tile-provider API key is ever present in the frontend bundle.** Cache hit/miss counts are exposed and measured explicitly on a second load of the same view. Map data is sourced from OpenStreetMap (or an equivalent open dataset), per the original spec.
- Catch/Application-creation events (FR-7) are logged with timestamp, Job Seeker ID, and Listing ID for audit purposes.

**API & Data Documentation**
- OpenAPI 3.0 spec (Swagger UI) covering every endpoint, generated before deployment (not written by hand after the fact). Every endpoint's example request/response is real, produced by a committed `.http` file or curl script — not hand-authored.
- A logical database schema (image or DBML: model, cardinalities, indexes) delivered by Friday 17:00, and updated the same day any schema column changes.

**Security**
- Authentication is secured via JWT or server-side session (original spec baseline, unchanged by later revisions).
- No secrets committed to the repository, including in history.
- A complete `.env.example` lists every required environment variable.

**Geographic precision**
- Street-level resolution for Listing proximity (elevated from the original district/commune minimum — see Privacy note below on why this raises, not lowers, the consent bar).

## 8. Constraints & Guardrails

**Privacy**
- Location data collection is covered by a clear, accessible information notice and requires explicit user consent — this stands regardless of the ministerial annotation suggesting a bare "I agree" checkbox is sufficient; it is a legal obligation, not a negotiable UX preference.
- Street-level precision (§7) increases the sensitivity of the data collected, which reinforces — not weakens — the need for that notice.
- Personal data is not retained beyond the account's active-usage period; account deletion (FR-21) must be effective, not cosmetic.

**Sovereignty / Cost**
- Zero dependency on any paid third-party service or any service requiring a proprietary account to run: no managed database, no managed object storage, no commercial mapping API, no commercial authentication provider, no commercial email service. The ministry's "trusted cloud" doctrine explicitly excludes AWS, GCP, and Azure by name — this is a named exclusion, not a generic gesture.
- The application must run entirely on a contributor's local machine using only the repository's own install instructions — no external account of any kind. Before delivery, a team member who did not write the install steps clones into an empty directory, follows them literally with no guessing, and times the process — that measured time, reported back to Thomas Vignal, is the actual acceptance criterion, not a pass/fail.
- A one-page deployment note accompanies delivery: where this would run in production, what resources it would need, and what data would leave the infrastructure and to whom.

**Content Responsibility**
- Employers are responsible for their own Listing content; the Report mechanism (FR-18/FR-19) is the mitigation the ministry required, not a guarantee of content quality.
- The technical delivery team is explicitly not responsible for the content of published Listings — this is a ministry-stated liability boundary (§5 of the original spec), not an assumption the team is making on its own behalf, and should be reflected in the product's own Terms/legal copy.

**Security note (process, not a requirement on the product):** one of the ministry's source documents contained an embedded instruction to visit an external URL and release/allowlist a quarantined sender. This was not acted on and is flagged here so the delivery team routes it through its own IT/security review rather than treating it as a spec item.

## 9. Monetization

- **Standard tier:** €400/month, grants a baseline Distribution Radius of **10 km**. `[ASSUMPTION: not specified by either source — 10 km chosen as a reasonable urban/peri-urban commuting radius for the French context; confirm with the ministry, adjust freely, no downstream FR depends on the exact value]`.
- **Premium tier:** price and radius left explicitly open — see Open Questions. Not assumed.
- Billing is **simulated** for this engagement: tier selection and pricing are modeled in the data layer and reflected in the Employer dashboard (FR-16); no real payment processor is integrated, since doing so would violate the Sovereignty constraint (§8).

## 10. Platform

- Responsive web application, mobile and desktop browsers, v1 only.
- No native app, no device-camera AR (§5 Non-Goals).

## 11. Success Metrics

*Kept to what the ministry actually asked for (a national metrics dashboard) — no invented engagement/conversion metrics.*

**Primary**
- **SM-1**: Listings published nationally (count). Validates FR-11, FR-22.
- **SM-2**: Applications submitted nationally (count). Validates FR-6, FR-22.

**Secondary**
- **SM-3**: Active accounts by type (Job Seeker, Employer). Validates FR-3, FR-10, FR-22.

**Counter-metrics (do not optimize)**
- **SM-C1**: Listing removal rate via moderation (FR-19). Growth in SM-1 should not come at the cost of under-moderating — this metric should stay visible alongside listing volume, not be minimized.

## 12. Open Questions

1. Premium Subscription Tier price and Distribution Radius — left "TBD" by the ministry's own source document; needs a ministry decision, not a team assumption (§9).
2. Employer verification method (FR-10) — not specified by either source.
3. Exact retention window for the FR-21 time-boxed exception (personal data kept only until a counterparty's legitimate need lapses) — needs confirmation from the ministry's legal advisor.
4. Production-scale capacity beyond the demo-scale load test (§7) — the ministry specified a 50-user/3-minute test scenario for the technical review; no stated target exists for real production concurrency.
5. Whether "GéoEmploi replaces FranceTravail/Apec" implies any future data-sharing expectation from the ministry, beyond its current treatment as positioning language (§5).
6. Full 47-page graphic charter document, not yet received — FR-26 covers only the three rules communicated so far; may need revision once it arrives.

## 13. Assumptions Index

- §4.3 FR-5 — Catch is a map-selection interaction with no device-proximity/timing gate in v1; the minister's "walk toward it" framing is treated as UX flavor, not a hard requirement.
- §4.3 FR-7 — Intermediate badge milestones (before the 10th-catch Permis de Travail) invented for a believable ladder.
- §4.4 FR-10 — Employer verification method not specified; assumed to require a concrete mechanism (e.g. company registration number) pending confirmation.
- §4.10 FR-21 — Time-boxed retention exception's exact duration not specified; needs a concrete value from legal (Open Question 3).
- §9 — Standard tier's baseline Distribution Radius set to 10 km as a working default; not confirmed by either source.
