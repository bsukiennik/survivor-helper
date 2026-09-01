# Edge-Case Review — GéoEmploi PRD

**Content reviewed:** `prd.md`, `addendum.md` (docs, behavior-defining)
**Lens:** Edge-Case Hunter
**Method:** Exhaustive path enumeration over the documents' stated behavior (Functional Requirements, Key User Journeys, Glossary). Only unhandled paths are listed — silently-handled ones are omitted. No severity or ranking is assigned.

Focus areas directed for this pass: Catch/badge mechanics, 30-day auto-archive vs. in-flight applications, WebSocket/polling fallback switch mid-session, Distribution Radius vs. Subscription Tier changes, geolocation edge cases, account deletion/retention vs. Applications an Employer still needs, and moderation actions on a Listing with pending Applications.

28 findings.

---

## 1. Catch / Badge Mechanics

**1.1** — `prd.md:§4.3 FR-7/FR-8`
No behavior defined for catches after the 10th (11th, 12th, ...).
→ Define post-milestone catch behavior: keep counting silently, cap display, or add further tiers.
⚠ Catch counter / UI state undefined once Permis de Travail is unlocked.

**1.2** — `prd.md:§4.3 FR-5/FR-6`
No uniqueness constraint on (Job Seeker, Listing) Applications.
→ Enforce one Application per (jobSeekerId, listingId), or explicitly exclude repeat catches from the count.
⚠ Catch count can be inflated by repeatedly applying to the same Listing, gaming Permis de Travail.

**1.3** — `prd.md:§4.3 FR-7/FR-8`
Two near-simultaneous Catch actions (double-tap, multi-tab) race the count increment at 9→10.
→ Atomic increment + threshold check in one DB transaction/row lock.
⚠ Permis de Travail trigger silently skipped or fired twice.

**1.4** — `prd.md:§3 Glossary (Application) / §4.3 FR-9`
Application Status is open-ended ("submitted, viewed, contacted, etc.") with no defined withdrawal state.
→ Enumerate a closed status set including withdrawn/cancelled and its effect on catch count.
⚠ No defined way for a Job Seeker to back out of a catch; catch-count integrity on withdrawal is undefined.

**1.5** — `prd.md:§4.10 FR-21 vs §4.3 FR-7`
No rule for catch count when an account is deleted and a new account is created (same or new identity).
→ Define whether catch count resets to 0 for new accounts and whether deleted identities can re-earn the badge.
⚠ Users could delete/recreate accounts to reset or repeatedly farm Permis de Travail with no stated safeguard.

**1.6** — `prd.md:UJ-2 / §4.3 FR-5`
"Approach the marker" implies physical proximity but no FR states whether proximity is server-verified or cosmetic.
→ Specify whether Catch requires the Job Seeker's location within the Listing's radius, and the reject path if not.
⚠ Either the location premise is unenforced (remote catching), or out-of-range catch attempts have no defined error UX.

**1.7 (moderation interaction)** — `prd.md:§4.3 FR-8 / §4.9 FR-19`
No rule addresses a Catch that contributed to the 10th-catch milestone when that Listing is later removed as fraudulent.
→ Define whether catch count/badge is recomputed or left as-is after a contributing Listing is moderated away.
⚠ A job seeker could hold a milestone badge earned in part from a fraudulent listing, with no defined reversal logic.

---

## 2. 30-Day Auto-Archive vs. In-Flight Application

**2.1** — `prd.md:§4.5 FR-12 vs §4.6 FR-14`
Archival hides a Listing from maps (FR-12) but Employer-side Application triage (FR-14) access to its Applications is unaddressed.
→ State that Applications on an archived Listing remain visible/actionable in the Employer dashboard.
⚠ Employer could lose the ability to contact/triage candidates mid-process once the parent Listing archives.

**2.2** — `prd.md:§4.3 FR-9 vs §4.1 FR-2`
FR-2's detail view is scoped to map-visible Listings; archived Listings are removed from the map (FR-12).
→ Allow Listing detail view for a Job Seeker's own Application regardless of archive state.
⚠ Broken link/404 when a Job Seeker opens an older application's Listing from "My Applications."

**2.3** — `prd.md:§4.5 FR-12`
No ordering/locking between the 30-day archival job firing and a Catch/Apply submitted at the same instant.
→ Make archival and apply-eligibility checks atomic (single transaction / listing-status check at apply time).
⚠ An Application could be accepted against an already-archived Listing, or a valid last-second Application silently dropped.

**2.4** — `prd.md:§4.5 FR-12 / §3 Glossary (Listing)`
No FR allows renewing/republishing a Listing before or at the 30-day auto-archive.
→ Define a renewal/republish action, or explicitly confirm none exists for v1.
⚠ Employers lose an actively-performing Listing with no recourse; likely unaddressed support burden.

---

## 3. WebSocket / Polling Fallback Switch Mid-Session

**3.1** — `prd.md:§4.8 FR-17 / §7 Reliability`
Config toggle between WebSocket and polling is "switchable... not a code change" but effect on already-connected clients is unstated.
→ Define switch-over behavior for live sessions (e.g., server closes WS connections; clients detect and fall back).
⚠ Users mid-session get stuck on the disabled transport, silently missing live updates.

**3.2** — `prd.md:UJ-2 edge case / §4.8 FR-17`
A listing delivered via WebSocket just before a drop could be re-delivered by the next polling cycle.
→ Dedupe incoming listing updates by Listing ID on the client.
⚠ Duplicate markers/"caught" animations for the same listing.

**3.3** — `prd.md:UJ-2 / §4.3 FR-5/FR-6`
No stated retry/idempotency for the Apply action if the network drops mid-submit during a Catch.
→ Idempotent Apply endpoint (client-generated request ID) with retry-safe semantics.
⚠ Duplicate Applications, or a Catch that appears to succeed client-side but is never persisted.

**3.4 (addendum)** — `addendum.md:Ministry technical deliverable checklist / prd.md §7 Observability`
Tile cache hit/miss is measured "on a second load of the same view" without defining what counts as the same view.
→ Define the tile cache key (e.g., exact tile x/y/z) so the hit/miss measurement is reproducible.
⚠ Cache metric reported for the technical review is non-reproducible/inconsistent across test runs.

---

## 4. Distribution Radius vs. Subscription Tier Change/Lapse

**4.1** — `prd.md:§4.5 FR-11 / §9 Monetization`
FR-11 validates Radius only "at publish time"; no rule for an already-published Listing when the Employer's tier later downgrades or lapses.
→ Define whether existing Listings are clamped to the new max, grandfathered until archive, or blocked from edits on downgrade.
⚠ A Listing keeps advertising reach the Employer no longer pays for, or its radius silently changes under a live listing.

**4.2** — `prd.md:§9 Monetization / Open Questions #1`
Standard baseline radius and Premium price/radius are both TBD, but FR-11 requires comparing Radius to "tier maximum."
→ Block FR-11 build on ministry-confirmed numeric values, or ship a visibly-provisional default.
⚠ Radius validation cannot be correctly built/tested; risk of shipping an unbounded or arbitrary default radius.

**4.3** — `prd.md:§4.7 FR-16 / §9`
No FR states what a lapsed/inactive simulated billing status does to an Employer's already-published Listings.
→ Define lapse behavior explicitly (e.g., listings stay live until their own 30-day archive; new publication blocked).
⚠ Job seekers stranded on listings from a non-paying employer, or listings unexpectedly disappear on lapse.

---

## 5. Geolocation Edge Cases

**5.1** — `prd.md:UJ-1 / FR-1`
No UI/message defined for a viewport or geolocation area with zero Listings.
→ Specify an explicit "no listings nearby" empty state distinct from loading/broken states.
⚠ Users in low-coverage (rural) areas may perceive the app as broken rather than legitimately empty.

**5.2** — `prd.md:UJ-1 edge case vs §4.3 FR-5`
Geolocation-denied fallback (manual/commune search) is specified only for anonymous browsing, not for the Catch flow.
→ Define Catch behavior when only a manually-searched location (no live GPS) is available.
⚠ Job Seekers without granted geolocation may be unable to catch listings, or the mechanic silently degrades with no explanation.

**5.3** — `prd.md:§7 Geographic precision / §4.5 FR-11`
No FR states whether Distribution Radius uses straight-line (haversine) or routed/travel distance.
→ Specify the distance calculation method used for radius inclusion.
⚠ Inconsistent in/out-of-range results for listings near the radius boundary.

**5.4** — `prd.md:UJ-1`
Only the initial-denial case is handled; no path for geolocation permission revoked mid-session after an initial grant.
→ Detect geolocation errors on later position requests and fall back to last-known/manual location gracefully.
⚠ Map could error or silently freeze when a later geolocation call fails after an earlier success.

---

## 6. Account Deletion / Data-Retention vs. Application the Employer Still Needs

**6.1** — `prd.md:§4.10 FR-21 / §4.6 FR-14 / §8 Privacy`
FR-21 requires erasing a Job Seeker's personal data on deletion, but FR-14 assumes Employers can still see/contact Applicants they're actively triaging.
→ Define whether transmitted Applications are the Employer's own retained record (exempt) or must be anonymized/removed, and by when.
⚠ Either the Employer loses contact info needed mid-hire, or the ministry's erasure promise is broken by leaving PII in the Employer's view.

**6.2** — `prd.md:§4.10 FR-21`
No FR states what happens to an Employer's Listings and received Applications when the Employer's account is deleted.
→ Define cascade: archive listings, notify applicants, retain/anonymize their Applications.
⚠ Orphaned Listings/Applications, or Job Seekers left with dangling "My Applications" entries.

**6.3** — `prd.md:Open Questions #3 / Assumptions Index`
"Active usage period" retention window is undefined, but FR-21's testable consequence depends on it.
→ Block erasure-logic implementation on ministry legal confirmation, or ship a flagged-provisional policy.
⚠ Erasure cannot be correctly implemented/tested; risk of premature deletion (breaking active applications) or non-compliant over-retention.

---

## 7. Moderation Actions on a Listing with Pending Applications

**7.1** — `prd.md:§4.9 FR-19 / §4.6 FR-14`
No FR states what happens to Applications already submitted to a Listing the Administrator removes for fraud.
→ Define an explicit terminal Application status (e.g., "listing removed") and whether the Job Seeker is notified.
⚠ Job Seekers left with silently-orphaned in-progress applications; a suspended Employer may retain applicant PII access with no legitimate use.

**7.2** — `prd.md:§4.10 FR-20 / §4.6 FR-14`
No FR states whether a suspended Employer retains access to Applications already received.
→ Define suspension's effect on existing Application Management access.
⚠ Candidates already "contacted" get stranded with no follow-through, or a suspended employer keeps applicant-PII access.

**7.3** — `prd.md:§4.9 FR-18/FR-19`
No FR addresses multiple simultaneous Reports on one Listing, or two Administrators acting on the same queue item concurrently.
→ Dedupe reports per listing in the queue view; lock/assign a queue item during admin action.
⚠ Duplicate queue noise, or a race where two admins take conflicting actions on the same Listing.

(See also **1.7** above — badge validity when the contributing Listing is later moderated away.)

---

## Raw findings (JSON)

```json
[
  {
    "location": "prd.md:§4.3 FR-7/FR-8",
    "trigger_condition": "No behavior defined for catches after the 10th (11th, 12th, ...)",
    "guard_snippet": "Define post-milestone catch behavior: keep counting silently, cap display, or add further tiers",
    "potential_consequence": "Catch counter / UI state undefined once Permis de Travail is unlocked"
  },
  {
    "location": "prd.md:§4.3 FR-5/FR-6",
    "trigger_condition": "No uniqueness constraint on (Job Seeker, Listing) Applications",
    "guard_snippet": "Enforce one Application per (jobSeekerId, listingId) or explicitly exclude repeat catches from the count",
    "potential_consequence": "Catch count can be inflated by repeatedly applying to the same Listing, gaming Permis de Travail"
  },
  {
    "location": "prd.md:§4.3 FR-7/FR-8",
    "trigger_condition": "Two near-simultaneous Catch actions (double-tap, multi-tab) race the count increment at 9→10",
    "guard_snippet": "Atomic increment + threshold check in one DB transaction/row lock",
    "potential_consequence": "Permis de Travail trigger silently skipped or fired twice"
  },
  {
    "location": "prd.md:§3 Glossary (Application) / §4.3 FR-9",
    "trigger_condition": "Application Status is open-ended (\"submitted, viewed, contacted, etc.\") with no defined withdrawal state",
    "guard_snippet": "Enumerate a closed status set including withdrawn/cancelled and its effect on catch count",
    "potential_consequence": "No defined way for a Job Seeker to back out of a catch; catch-count integrity on withdrawal is undefined"
  },
  {
    "location": "prd.md:§4.10 FR-21 vs §4.3 FR-7",
    "trigger_condition": "No rule for catch count when an account is deleted and a new account is created (same or new identity)",
    "guard_snippet": "Define whether catch count resets to 0 for new accounts and whether deleted identities can re-earn the badge",
    "potential_consequence": "Users could delete/recreate accounts to reset or repeatedly farm Permis de Travail with no stated safeguard"
  },
  {
    "location": "prd.md:UJ-2 / §4.3 FR-5",
    "trigger_condition": "\"Approach the marker\" implies physical proximity but no FR states whether proximity is server-verified or cosmetic",
    "guard_snippet": "Specify whether Catch requires the Job Seeker's location within the Listing's radius, and the reject path if not",
    "potential_consequence": "Either the location premise is unenforced (remote catching), or out-of-range catch attempts have no defined error UX"
  },
  {
    "location": "prd.md:§4.5 FR-12 vs §4.6 FR-14",
    "trigger_condition": "Archival hides a Listing from maps (FR-12) but Employer-side Application triage (FR-14) access to its Applications is unaddressed",
    "guard_snippet": "State that Applications on an archived Listing remain visible/actionable in the Employer dashboard",
    "potential_consequence": "Employer could lose the ability to contact/triage candidates mid-process once the parent Listing archives"
  },
  {
    "location": "prd.md:§4.3 FR-9 vs §4.1 FR-2",
    "trigger_condition": "FR-2's detail view is scoped to map-visible Listings; archived Listings are removed from the map (FR-12)",
    "guard_snippet": "Allow Listing detail view for a Job Seeker's own Application regardless of archive state",
    "potential_consequence": "Broken link/404 when a Job Seeker opens an older application's Listing from \"My Applications\""
  },
  {
    "location": "prd.md:§4.5 FR-12",
    "trigger_condition": "No ordering/locking between the 30-day archival job firing and a Catch/Apply submitted at the same instant",
    "guard_snippet": "Make archival and apply-eligibility checks atomic (single transaction / listing-status check at apply time)",
    "potential_consequence": "An Application could be accepted against an already-archived Listing, or a valid last-second Application silently dropped"
  },
  {
    "location": "prd.md:§4.5 FR-12 / §3 Glossary (Listing)",
    "trigger_condition": "No FR allows renewing/republishing a Listing before or at the 30-day auto-archive",
    "guard_snippet": "Define a renewal/republish action, or explicitly confirm none exists for v1",
    "potential_consequence": "Employers lose an actively-performing Listing with no recourse; likely unaddressed support burden"
  },
  {
    "location": "prd.md:§4.8 FR-17 / §7 Reliability",
    "trigger_condition": "Config toggle between WebSocket and polling is \"switchable... not a code change\" but effect on already-connected clients is unstated",
    "guard_snippet": "Define switch-over behavior for live sessions (e.g., server closes WS connections; clients detect and fall back)",
    "potential_consequence": "Users mid-session get stuck on the disabled transport, silently missing live updates"
  },
  {
    "location": "prd.md:UJ-2 edge case / §4.8 FR-17",
    "trigger_condition": "A listing delivered via WebSocket just before a drop could be re-delivered by the next polling cycle",
    "guard_snippet": "Dedupe incoming listing updates by Listing ID on the client",
    "potential_consequence": "Duplicate markers/\"caught\" animations for the same listing"
  },
  {
    "location": "prd.md:UJ-2 / §4.3 FR-5/FR-6",
    "trigger_condition": "No stated retry/idempotency for the Apply action if the network drops mid-submit during a Catch",
    "guard_snippet": "Idempotent Apply endpoint (client-generated request ID) with retry-safe semantics",
    "potential_consequence": "Duplicate Applications, or a Catch that appears to succeed client-side but is never persisted"
  },
  {
    "location": "prd.md:§4.5 FR-11 / §9 Monetization",
    "trigger_condition": "FR-11 validates Radius only \"at publish time\"; no rule for an already-published Listing when the Employer's tier later downgrades or lapses",
    "guard_snippet": "Define whether existing Listings are clamped to the new max, grandfathered until archive, or blocked from edits on downgrade",
    "potential_consequence": "A Listing keeps advertising reach the Employer no longer pays for, or its radius silently changes under a live listing"
  },
  {
    "location": "prd.md:§9 Monetization / Open Questions #1",
    "trigger_condition": "Standard baseline radius and Premium price/radius are both TBD, but FR-11 requires comparing Radius to \"tier maximum\"",
    "guard_snippet": "Block FR-11 build on ministry-confirmed numeric values, or ship a visibly-provisional default",
    "potential_consequence": "Radius validation cannot be correctly built/tested; risk of shipping an unbounded or arbitrary default radius"
  },
  {
    "location": "prd.md:§4.7 FR-16 / §9",
    "trigger_condition": "No FR states what a lapsed/inactive simulated billing status does to an Employer's already-published Listings",
    "guard_snippet": "Define lapse behavior explicitly (e.g., listings stay live until their own 30-day archive; new publication blocked)",
    "potential_consequence": "Job seekers stranded on listings from a non-paying employer, or listings unexpectedly disappear on lapse"
  },
  {
    "location": "prd.md:UJ-1 / FR-1",
    "trigger_condition": "No UI/message defined for a viewport or geolocation area with zero Listings",
    "guard_snippet": "Specify an explicit \"no listings nearby\" empty state distinct from loading/broken states",
    "potential_consequence": "Users in low-coverage (rural) areas may perceive the app as broken rather than legitimately empty"
  },
  {
    "location": "prd.md:UJ-1 edge case vs §4.3 FR-5",
    "trigger_condition": "Geolocation-denied fallback (manual/commune search) is specified only for anonymous browsing, not for the Catch flow",
    "guard_snippet": "Define Catch behavior when only a manually-searched location (no live GPS) is available",
    "potential_consequence": "Job Seekers without granted geolocation may be unable to catch listings, or the mechanic silently degrades with no explanation"
  },
  {
    "location": "prd.md:§7 Geographic precision / §4.5 FR-11",
    "trigger_condition": "No FR states whether Distribution Radius uses straight-line (haversine) or routed/travel distance",
    "guard_snippet": "Specify the distance calculation method used for radius inclusion",
    "potential_consequence": "Inconsistent in/out-of-range results for listings near the radius boundary"
  },
  {
    "location": "prd.md:UJ-1",
    "trigger_condition": "Only the initial-denial case is handled; no path for geolocation permission revoked mid-session after an initial grant",
    "guard_snippet": "Detect geolocation errors on later position requests and fall back to last-known/manual location gracefully",
    "potential_consequence": "Map could error or silently freeze when a later geolocation call fails after an earlier success"
  },
  {
    "location": "prd.md:§4.10 FR-21 / §4.6 FR-14 / §8 Privacy",
    "trigger_condition": "FR-21 requires erasing a Job Seeker's personal data on deletion, but FR-14 assumes Employers can still see/contact Applicants they're actively triaging",
    "guard_snippet": "Define whether transmitted Applications are the Employer's own retained record (exempt) or must be anonymized/removed, and by when",
    "potential_consequence": "Either the Employer loses contact info needed mid-hire, or the ministry's erasure promise is broken by leaving PII in the Employer's view"
  },
  {
    "location": "prd.md:§4.10 FR-21",
    "trigger_condition": "No FR states what happens to an Employer's Listings and received Applications when the Employer's account is deleted",
    "guard_snippet": "Define cascade: archive listings, notify applicants, retain/anonymize their Applications",
    "potential_consequence": "Orphaned Listings/Applications, or Job Seekers left with dangling \"My Applications\" entries"
  },
  {
    "location": "prd.md:Open Questions #3 / Assumptions Index",
    "trigger_condition": "\"Active usage period\" retention window is undefined, but FR-21's testable consequence depends on it",
    "guard_snippet": "Block erasure-logic implementation on ministry legal confirmation, or ship a flagged-provisional policy",
    "potential_consequence": "Erasure cannot be correctly implemented/tested; risk of premature deletion (breaking active applications) or non-compliant over-retention"
  },
  {
    "location": "prd.md:§4.9 FR-19 / §4.6 FR-14",
    "trigger_condition": "No FR states what happens to Applications already submitted to a Listing the Administrator removes for fraud",
    "guard_snippet": "Define an explicit terminal Application status (e.g., \"listing removed\") and whether the Job Seeker is notified",
    "potential_consequence": "Job Seekers left with silently-orphaned in-progress applications; a suspended Employer may retain applicant PII access with no legitimate use"
  },
  {
    "location": "prd.md:§4.10 FR-20 / §4.6 FR-14",
    "trigger_condition": "No FR states whether a suspended Employer retains access to Applications already received",
    "guard_snippet": "Define suspension's effect on existing Application Management access",
    "potential_consequence": "Candidates already \"contacted\" get stranded with no follow-through, or a suspended employer keeps applicant-PII access"
  },
  {
    "location": "prd.md:§4.3 FR-8 / §4.9 FR-19",
    "trigger_condition": "No rule addresses a Catch that contributed to the 10th-catch milestone when that Listing is later removed as fraudulent",
    "guard_snippet": "Define whether catch count/badge is recomputed or left as-is after a contributing Listing is moderated away",
    "potential_consequence": "A job seeker could hold a milestone badge earned in part from a fraudulent listing, with no defined reversal logic"
  },
  {
    "location": "prd.md:§4.9 FR-18/FR-19",
    "trigger_condition": "No FR addresses multiple simultaneous Reports on one Listing, or two Administrators acting on the same queue item concurrently",
    "guard_snippet": "Dedupe reports per listing in the queue view; lock/assign a queue item during admin action",
    "potential_consequence": "Duplicate queue noise, or a race where two admins take conflicting actions on the same Listing"
  },
  {
    "location": "addendum.md:Ministry technical deliverable checklist / prd.md §7 Observability",
    "trigger_condition": "Tile cache hit/miss is measured \"on a second load of the same view\" without defining what counts as the same view",
    "guard_snippet": "Define the tile cache key (e.g., exact tile x/y/z) so the hit/miss measurement is reproducible",
    "potential_consequence": "Cache metric reported for the technical review is non-reproducible/inconsistent across test runs"
  }
]
```
