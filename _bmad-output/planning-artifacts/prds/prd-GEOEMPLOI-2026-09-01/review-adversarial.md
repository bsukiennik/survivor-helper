# Adversarial Review — GéoEmploi PRD

**Reviewed:** `prd.md`, `addendum.md` (prd-GEOEMPLOI-2026-09-01)
**Lens:** Adversarial (sole lens run, per request)
**Reader:** delivery team + downstream BMad workflows (bmad-architecture, bmad-create-epics-and-stories)

## Verdict

The reconciliation logic (payment dropped, admin backdoor dropped, GDPR consent kept, AR dropped) holds up structurally in the *prose* — §5, §8, §9 correctly state the resolutions and their rationale. But several of those resolutions don't survive translation into the numbered FR/NFR list that a downstream team or skill would actually build from. The GDPR-consent requirement in particular is asserted in §8 prose but never appears as a Functional Requirement — nothing in §4 gates location collection on consent, and UJ-1's own walkthrough describes geolocation firing before any consent step is mentioned. The gamification layer (FR-5–FR-9) has no proximity gate and no application-uniqueness constraint, so "Catch" is fully satisfiable by remote, repeated, low-effort applying — which both undercuts the "physical act of looking for work" vision and creates an ungoverned spam/metric-inflation path that the stated counter-metric (SM-C1) doesn't cover. The addendum's sovereignty checklist is *mostly* mirrored into prd.md §7–8, but the specific "no API key in frontend bundle / no direct browser→provider call" clause is addendum-only — a team reading prd.md alone could build a compliant-looking cache that still leaks the tile provider to the browser. 20 findings below, all concrete and locatable.

**Total findings: 20**

---

## Findings (lens: adversarial)

### 1. No FR governs Subscription Tier assignment
- **location:** §4.4 FR-10 / §9 Monetization
- **trigger_condition:** FR-10 gates *publishing* on verification, but no FR anywhere assigns or lets an Employer select a Subscription Tier (Standard/Premium). FR-11's radius cap and FR-16's "current Subscription Tier" both presuppose a tier already exists on the account, with no stated mechanism for how it gets there.
- **guard_snippet:** Add an FR (or an explicit consequence under FR-10) stating that Employer accounts default to Standard on verification, with tier-change handled per UJ-3's "contact us" flow (manual/admin-mediated, since Premium pricing is undefined).
- **potential_consequence:** Team invents the assignment mechanism ad hoc during build, likely inconsistently with UJ-3's "contact us, not checkout" framing.

### 2. UJ-3 narrative contradicts simulated billing
- **location:** §2.3 UJ-3 ("the view/application counts make the €400/month tangible") vs §9 Monetization ("Billing is simulated... no real payment processor")
- **trigger_condition:** The journey's emotional climax hinges on €400 being a real, felt cost, but no money ever changes hands and nothing in the FRs makes non-payment consequential (no "unpaid" state, no downgrade-on-non-payment).
- **guard_snippet:** Reword UJ-3's climax to reference "reach proportional to tier" rather than felt cost, or explicitly note in §9 that the simulated tangibility is intentional narrative framing for the demo, not a functional stake.
- **potential_consequence:** Team builds a fake "payment failed" / dunning flow that isn't in scope, burning time against a 2-week deadline, or the demo script promises stakes the system doesn't enforce.

### 3. FR-16 "billing status" is undefined and possibly untestable
- **location:** §4.7 FR-16
- **trigger_condition:** "Simulated billing status" is displayed but no states are enumerated. If nothing can ever fail to be paid (simulated), there is arguably only one status ever shown — making the FR either trivial or silently expected to model failure states that were never specified.
- **guard_snippet:** Enumerate the actual states FR-16 must display (e.g., "Active (simulated)" is the only state in v1; explicitly rule out overdue/failed states).
- **potential_consequence:** Dev builds a status enum that implies real billing semantics (overdue, cancelled) with no backing logic, confusing testers and demo reviewers.

### 4. §8's GDPR consent requirement has no corresponding FR
- **location:** §8 Constraints & Guardrails / Privacy vs §4 (all FRs)
- **trigger_condition:** "requires explicit user consent" is stated once, in prose, in §8. No FR in §4 requires capturing, storing, or gating on that consent; no consequence bullet references it; no data field for it appears in the Glossary (§3). A team building strictly off the numbered FR list can satisfy every FR while shipping zero consent UI.
- **guard_snippet:** Add an explicit FR (e.g., under §4.1 or §4.2): "System must display a location-consent notice and record explicit consent before any geolocation is collected; browsing without granting consent falls back to manual location entry (per UJ-1's edge case)."
- **potential_consequence:** The single hardest legal non-negotiable in the whole PRD ships unimplemented because it was never operationalized as a requirement, not because anyone disagreed with it.

### 5. UJ-1's own walkthrough contradicts the consent requirement it's supposed to honor
- **location:** §2.3 UJ-1 Path step ("map loads centered on her location (browser geolocation, no account)") vs §8 Privacy
- **trigger_condition:** The primary anonymous-entry journey has geolocation firing immediately on page load, with no consent step described anywhere in the Path. If this journey is taken literally, it violates the "requires explicit user consent" constraint before FR-1 has even finished loading.
- **guard_snippet:** Insert a consent-notice beat into UJ-1's Path, before the "map loads centered on her location" step.
- **potential_consequence:** Whoever builds from the journey narrative (a common shortcut) reproduces the exact violation the reconciliation section claims was resolved.

### 6. "Street-level precision" (§7) doesn't say whose location it applies to
- **location:** §7 Geographic precision / §8 Privacy note
- **trigger_condition:** It's unclear whether street-level resolution refers to the Job Seeker's live position (high sensitivity, personal data of the browsing individual) or the Listing/Employer's published address (lower sensitivity, arguably business data). §8's Privacy note treats it as raising consent sensitivity generally but doesn't disambiguate, which matters for scoping exactly which FR needs the consent gate from finding #4.
- **guard_snippet:** State explicitly in §7: "applies to both Job Seeker device location and Listing geocoding" (or whichever is true), and cross-reference which party's consent is implicated for each.
- **potential_consequence:** Architecture team designs the wrong consent/data-handling boundary, or under-scopes what needs the notice.

### 7. Employer's own precise address is broadcast to anonymous visitors with no employer-side notice
- **location:** §4.1 FR-1/FR-2 + §7 Geographic precision vs §8 Privacy
- **trigger_condition:** FR-1 explicitly requires no auth/session to view Listing markers; combined with street-level precision, an Employer's exact address is exposed to any anonymous visitor. §8's Privacy paragraph is framed around consent from "the person whose location is collected" for browsing/geolocation — it never addresses consent/notice for the Employer whose own address is being published to the unauthenticated public.
- **guard_snippet:** Add a line to §8 or FR-11 noting the Employer is informed at listing-creation time that the address will be shown at street-level to anonymous visitors (relevant for home-based small businesses).
- **potential_consequence:** A legitimate small-business Employer publishes a listing without realizing their exact address (potentially their home) is visible to unauthenticated strangers.

### 8. Sovereignty's "no API key in frontend / no direct browser→provider call" clause is addendum-only
- **location:** `addendum.md` Ministry technical deliverable checklist vs `prd.md` §7 Observability / §8 Sovereignty
- **trigger_condition:** prd.md §7 says only "Map tile requests are cached server-side; cache hit/miss counts are exposed." It never states the addendum's specific sub-requirements: no direct browser→tile-provider call, no API key shipped in the frontend bundle. A team building strictly from prd.md (the document of record for scope, per addendum.md's own header) could implement a server-side cache that still lets the browser fall through directly to the tile provider on a cache miss, satisfying prd.md's literal text while violating the actual sovereignty intent.
- **guard_snippet:** Promote the two missing sub-bullets from the addendum checklist into prd.md §7 Observability (or §8 Sovereignty) as explicit, testable requirements.
- **potential_consequence:** A "compliant-looking" tile cache ships with a real architectural sovereignty leak that the outside timer/reviewer (§8) would likely catch on network inspection, failing delivery on a stated non-negotiable.

### 9. Tile cache hit/miss "measured" with no target threshold
- **location:** §7 Observability
- **trigger_condition:** "Cache hit/miss counts are exposed and measured explicitly on a second load of the same view" states the mechanism but not a pass/fail bar — any hit rate, including 0%, technically satisfies "measured."
- **guard_snippet:** State the expected outcome, e.g. "a second load of the same view must register at least one cache hit and zero calls to the upstream tile provider."
- **potential_consequence:** Team reports a hit/miss counter that never actually shows a hit, technically meeting the letter of the NFR while the cache doesn't work.

### 10. FR-9 has no testable consequence, unlike sibling FRs
- **location:** §4.3 FR-9
- **trigger_condition:** FR-4, FR-5, FR-11, FR-12 all carry "Consequences (testable)" bullets; FR-9 ("Job Seeker can view the status of all their ongoing Applications in one place") does not. It's unclear whether "one place" excludes archived-Listing applications, what statuses must be visible, or what "ongoing" excludes.
- **guard_snippet:** Add a consequence bullet, e.g. "All Applications remain visible with status even after the underlying Listing is archived (FR-12)."
- **potential_consequence:** QA has nothing concrete to test FR-9 against; behavior around archived-listing applications is a coin flip at build time.

### 11. FR-14's "contact the applicant" implies a feature that doesn't exist anywhere in §4
- **location:** §4.6 FR-14
- **trigger_condition:** "Employer can... contact the applicant" implies some contact channel (in-app messaging, revealed email/phone), but no messaging feature or contact-info-disclosure rule appears anywhere in the Features list (§4) or Glossary (§3).
- **guard_snippet:** Either add an explicit FR for the contact mechanism (e.g., "Employer sees the Job Seeker's profile contact fields once an Application is received") or narrow FR-14 to "Employer can view applicant profile contact info transmitted at application time (FR-6)."
- **potential_consequence:** A whole sub-feature (messaging, or contact-info exposure and its privacy implications) gets invented mid-sprint with no spec basis, eating into the 2-week timeline.

### 12. No uniqueness constraint on Application/Catch per Job Seeker per Listing
- **location:** §4.3 FR-5/FR-6, §3 Glossary "Catch"/"Application"
- **trigger_condition:** Nothing states a Job Seeker can apply/Catch a given Listing only once. Since "each successful Catch increments the Job Seeker's catch count" (Glossary), a Job Seeker could repeatedly Catch the same Listing (if the UI allows re-triggering Apply) purely to farm catch count toward Badges/Permis de Travail.
- **guard_snippet:** Add a consequence under FR-6: "One Application per (Job Seeker, Listing) pair; a repeat Catch on an already-applied Listing does not increment the catch count."
- **potential_consequence:** Catch count and Badge unlocks become trivially gameable, undermining the "Permis de Travail" as a meaningful milestone and inflating SM-2 (Applications submitted).

### 13. "Catch" has no proximity/distance gate, contradicting the vision framing
- **location:** §1 Vision ("physical act of looking for work"), §2.3 UJ-2 ("he moves toward it"), §4.3 FR-5
- **trigger_condition:** FR-5 says selecting/approaching a marker "and confirming" triggers Apply — but no FR defines any distance threshold, geofence, or proximity check gating the Catch action. As written, a Job Seeker can "Catch" any Listing on the map from anywhere in France with no enforcement of physical nearness, which is exactly what §1 and UJ-2 claim is the differentiator ("turns the physical act of looking for work into a geolocated experience").
- **guard_snippet:** Add a consequence bullet to FR-5 specifying a maximum distance (or explicitly state there is none and the "approach" language is purely presentational, so the vision claim in §1 is scoped accordingly).
- **potential_consequence:** The gamification's entire premise is unenforced; "Catch" becomes indistinguishable from "Apply" (already true per FR-5's own consequence bullet) with no local-relevance mechanic behind it at all, and the delivery team can't demo the thing the vision statement promises.

### 14. No counter-metric or moderation hook for application spam enabled by the gamification incentive
- **location:** §11 Success Metrics (SM-2, SM-C1), §4.9 Moderation & Reporting
- **trigger_condition:** SM-2 ("Applications submitted nationally") is a primary success metric that the Catch mechanic directly incentivizes maximizing. The only counter-metric, SM-C1, tracks Listing removal via moderation — nothing tracks or gates Application-side abuse. FR-18/FR-19 (Report/moderation) only let users flag *Listings*, not Applications or Job-Seeker behavior, so there's no mechanism to catch or discourage catch-farming even if finding #12's uniqueness gap is later fixed by policy rather than by a hard constraint.
- **guard_snippet:** Add a counter-metric (e.g., "SM-C2: Applications-per-active-Job-Seeker ratio, watched for anomalous spikes") or extend FR-18 to cover reporting suspicious applicant behavior.
- **potential_consequence:** A metric the ministry will look at (SM-2) can be inflated by the product's own designed incentive loop with zero visibility into whether the growth is real engagement or badge-farming.

### 15. FR-19 (moderation removal) has no real-time propagation requirement, asymmetric with FR-17
- **location:** §4.9 FR-19 vs §4.8 FR-17
- **trigger_condition:** FR-17 requires new Listings to appear live (WebSocket/polling) without a page reload. FR-19 requires an admin to be able to remove a Listing, and UJ-4 narrates it as "off the public map within the same session," but no FR/NFR states that removal propagates to already-open maps via the same live channel — only that it happens on the backend/admin side.
- **guard_snippet:** Add a consequence to FR-19 (or FR-17): "Listing removal via moderation propagates through the same live-update channel as publication, within the same latency bound."
- **potential_consequence:** A fraudulent Listing an admin just removed can remain visible and clickable on other users' already-open map sessions until their next poll/reload — undermining the moderation feature's actual purpose (getting bad content off the map promptly) while looking compliant on paper.

### 16. FR-12 (auto-archival) has the same live-removal ambiguity
- **location:** §4.5 FR-12
- **trigger_condition:** "Archived Listings no longer appear on the public or Job Seeker map" doesn't specify whether this is enforced only on fresh page loads/API calls or also pushed to already-open sessions via the FR-17 real-time channel.
- **guard_snippet:** Cross-reference FR-17's mechanism explicitly, or state archival is enforced at the data/API layer only (acceptable, but should be a stated decision, not a gap).
- **potential_consequence:** Inconsistent behavior between users depending on whether their map session predates the archival event — undefined behavior at demo time.

### 17. FR-21's deletion trigger contradicts the "user requests deletion" framing
- **location:** §4.10 FR-21
- **trigger_condition:** "User can request deletion of their account; system erases personal data once the account is no longer in active use" describes a user-initiated, presumably-immediate action, but ties the actual erasure to a passive, delayed condition ("no longer in active use") that isn't itself defined in relation to the request. As worded, a user who explicitly requests deletion while their account is still "active" would not have data erased — which reads as a right-to-erasure gap, not merely a missing number (the Assumptions Index at §13 only flags the retention-window *value*, not this logical/sequencing conflict).
- **guard_snippet:** Reword to: "On deletion request, the account is immediately deactivated and personal data is erased after [retention window] or immediately if the account has no pending obligations (open Applications/Listings), whichever is sooner."
- **potential_consequence:** As specified, a deletion request can be legally satisfied by doing nothing until some undefined "inactive" threshold is reached — likely non-compliant with GDPR's erasure-on-request expectation, and worse, it's the kind of gap easy to miss because it looks resolved (there IS a consequence bullet and an Assumptions Index entry, just not for this specific conflict).

### 18. "View count" (FR-15) has no integrity/definition, feeding an unaudited product-truth metric
- **location:** §4.7 FR-15, referenced narratively in UJ-3
- **trigger_condition:** "View count" isn't defined — not deduplicated per session/user, no bot/refresh mitigation, unclear whether anonymous (FR-2) views count. UJ-3's climax explicitly leans on this number as proof the €400 "produced real, qualified interest," but nothing in the NFRs (§7) requires any anti-inflation safeguard for it.
- **guard_snippet:** Define "view" precisely (e.g., one count per unique session per Listing per day) and note it explicitly as a known-gameable v1 limitation if a robust dedup isn't in scope for 2 weeks.
- **potential_consequence:** The one number the PRD says makes the paid tier's value "tangible" to Employers can be trivially inflated by a page-refresh script, undermining the exact narrative it's meant to support.

### 19. Assumptions Index (§13) is materially incomplete relative to the gaps this review found
- **location:** §13 Assumptions Index
- **trigger_condition:** §13 lists 4 items (badge ladder, verification method, retention window, baseline radius). It doesn't include the consent-FR gap (#4), the catch-uniqueness/proximity gaps (#12, #13), the deletion-trigger conflict (#17), the view-count integrity gap (#18), or the tier-assignment mechanism (#1) — all of which are unstated assumptions of the same kind already being tracked. Because §0 states this PRD is consumed directly by `bmad-architecture` and `bmad-create-epics-and-stories`, and §13 is the canonical "here's what's still open" list, downstream work is likely to trust it as complete and miss these.
- **guard_snippet:** Fold this review's findings into §13 (or a follow-up addendum) before handing off to architecture/story-breakdown.
- **potential_consequence:** Downstream skills treat §13 as exhaustive, build confidently on unstated assumptions that were never surfaced to the ministry contact for confirmation, and rediscover these gaps mid-build under time pressure.

### 20. FR-17's "real-time" has no latency bound, so the polling fallback's "documented behavioral difference" has nothing to be measured against
- **location:** §4.8 FR-17, §7 NFR-Reliability
- **trigger_condition:** NFR-Reliability requires the polling-fallback's behavioral difference from WebSocket mode to be documented, but no maximum polling interval (or WebSocket latency target) is specified anywhere in prd.md or addendum.md. A polling interval of, say, 5 minutes would technically satisfy "a polling fallback must exist... and the team must document every behavioral difference" while making "real-time listing appearance" (FR-17's own title) meaningless.
- **guard_snippet:** Add a concrete bound, e.g. "WebSocket updates surface within Ns; polling fallback interval must not exceed Ms," to §7 NFR-Reliability.
- **potential_consequence:** The polling fallback ships technically compliant but practically useless (or, conversely, the team over-engineers a very tight polling interval that isn't actually required, wasting time against the deadline).

---

## Cross-cutting observation

Several of the sharpest gaps (#4, #12, #13, #17) share a pattern: the PRD's prose (§5, §8, Glossary) states the *correct* resolution or intent, but the corresponding §4 FR either doesn't exist or doesn't carry the constraint as a testable consequence. The document is internally aware of most of the right tensions — it just doesn't always close the loop from "resolved in prose" to "enforced in a numbered, buildable requirement." That's the single highest-leverage fix: an editing pass that checks every §5/§8 constraint against §4 for a corresponding FR/consequence, not just a mention.
