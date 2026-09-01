# PRD Quality Review — GéoEmploi (prd-GEOEMPLOI-2026-09-01)

## Overall verdict

This is a genuinely decision-ready PRD: it names what the minister wanted, what it dropped, and why, without smoothing the conflict away, and its NFRs are specific enough to build and test against rather than aspirational. What's at risk is downstream extraction, not decision quality — a couple of dangling references to an undocumented "Discovery decision," one unnamed UJ protagonist, and Success Metrics that measure adoption volume but never touch whether the map/gamification mechanic itself is working are the kind of gaps that cost a story-writer or architect a Slack message to clarify, not a re-plan.

## Decision-readiness — strong

The PRD states reversals of the minister's asks as decisions, not as balanced considerations. §8 Privacy: "this stands regardless of the ministerial annotation suggesting a bare 'I agree' checkbox is sufficient; it is a legal obligation, not a negotiable UX preference" — direct, names what was overridden and why. §4.10's description states outright "no special-case bypass ... no admin backdoor for the Minister." FR-13 carries an explicit `[DECISION: in-app, not commercial email — see Constraints & Guardrails / Sovereignty]` tag at the one place where a real trade-off (notification UX vs. the sovereignty constraint's ban on commercial email) was live.

Open Questions (§12) read as genuinely open, not rhetorical: Premium tier price/radius, employer verification method, the exact data-retention window, production-scale capacity beyond the demo load test, and whether "we replace FranceTravail" implies a future data-sharing obligation. None of these have an answer smuggled into the next sentence.

### Findings
- **medium** Reconciliation rationale points to an undocumented "Discovery decision" / "Discovery reconciliation" (§4.10, §5) — `Description: ... (see Discovery decision: no admin backdoor for the Minister)` and `(see Discovery reconciliation)` reference something that isn't a named section anywhere. The addendum's actual section is titled "Provenance: reconciling the two briefs" (`addendum.md` §"Provenance"), which is close in substance but not in name, so the pointer doesn't resolve for a reader following it literally — including a downstream workflow trying to source-extract the rationale. *Fix:* either rename the addendum section to "Discovery reconciliation" or change the PRD's inline pointers to name the actual section ("see addendum.md § Provenance").

## Substance over theater — strong

No findings — this dimension is clean. Four personas, each tied to a UJ that in turn drives a distinct feature cluster (Amina/UJ-1 → FR-1/FR-2; Karim/UJ-2 → FR-5/7/8; Fatima/UJ-3 → FR-11/13/14/15/16; admin/UJ-4 → FR-18/19/20) — none of them are decorative. NFRs are concrete, not boilerplate: "Map load time under 3 seconds ... under 1 second is a stretch goal, not a blocking target," "`/health` responds in under 200ms, including when the map tile provider is unresponsive," a load-test spec with exact concurrency, duration, seed data, and required report fields (§7). The Vision statement (§1) is specific to this engagement (mentions the catch mechanic, Permis de Travail, the FranceTravail/Apec positioning) rather than a swappable generic paragraph.

## Strategic coherence — adequate

The thesis is stated plainly (§1: turning "is there anything hiring near me right now" into "a two-tap answer") and the Week 1 / Week 2 MVP split (§6.1) follows it — bare map-and-publish first, gamification and dashboards second, not "what's easy first." A counter-metric exists (SM-C1, moderation removal rate, guarding against SM-1 growth via under-moderation).

### Findings
- **medium** Success Metrics don't validate the map/gamification thesis itself (§11). SM-1 (listings published), SM-2 (applications submitted), and SM-3 (active accounts) are volume/adoption counts — they'd look identical for a plain list-based job board. Nothing measures whether the "catch" mechanic or proximity framing is actually doing the work the Vision claims (e.g., share of applications submitted via the Catch flow vs. plain Apply, or a discovery-speed measure). §11's own note — "Kept to what the ministry actually asked for ... no invented engagement/conversion metrics" — makes this a disclosed, deliberate scope choice, not an oversight, so this is a thin spot rather than a defect. *Fix:* if instrumentation budget allows in Week 2, add one behavioral metric (e.g., Catch-vs-plain-Apply share) without reopening the "no invented metrics" discipline elsewhere.

## Done-ness clarity — adequate

Most FRs carry explicit "Consequences (testable)" bullets, and they're used precisely where ambiguity would otherwise hide (FR-1 no-auth-required, FR-5 Catch-and-Apply-share-one-record, FR-12 archived listings disappear from both maps, FR-17 WebSocket-with-config-only-fallback, FR-21 no-retention-beyond-active-use). No instances of "handles gracefully" / "reasonable performance" / "user-friendly" hedge language were found anywhere in the document — NFRs use bounds ("under 3 seconds," "≥500 Listings across ≥50 communes," "under 200ms") rather than adjectives.

### Findings
- **low** FR-14 ("Employer can sort/filter received Applications by status and contact the applicant") doesn't specify the contact channel. This matters more than a typical gap here because FR-13 explicitly carries a `[DECISION: in-app, not commercial email]` tag driven by the sovereignty constraint, and §8 Privacy puts real weight on consent scope — whether "contact the applicant" stays in-app or exposes an email/phone outside the platform is exactly the kind of thing that decision should also cover. *Fix:* state the channel explicitly, and if it differs from FR-13's in-app-only stance, note the consent implication.
- **low** FR-7 ("awards Badges at milestone thresholds") has no resolvable done-ness condition beyond the 10th-catch Permis de Travail (FR-8) — the intermediate thresholds are explicitly flagged `[ASSUMPTION: ... confirm or drop]`, which is honest, but it does mean FR-7 as written can't be built or tested until that assumption is resolved. Not a defect (it's disclosed), but worth surfacing since Done-ness clarity is what downstream story-writing leans on hardest.
- **low** FR-9 and FR-22 lack explicit "Consequences (testable)" blocks that most peer FRs have (e.g. what Application statuses exist for FR-9's "status" concept; refresh cadence / definition of "aggregate" for FR-22). The FR text is concrete enough to infer intent, so this is a minor consistency gap rather than a real ambiguity.

## Scope honesty — adequate

Non-Goals (§5) does real work — each bullet states what was excluded and why, including explicitly treating the minister's "we replace FranceTravail/Apec" as "positioning language, not a functional requirement." The Assumptions Index (§13) round-trips cleanly: all four inline `[ASSUMPTION: ...]` tags (FR-7, FR-10, FR-21, §9) are indexed, and no index entry lacks an inline counterpart. Open-item density (5 Open Questions + 4 Assumptions against 22 FRs) is on the high side for a green-light-to-build engagement, but nearly all of it traces to gaps the ministry's own source documents left open (Premium pricing, verification method, retention window) rather than to the PRD's own laziness — that's a legitimate reason to keep it, and the PRD says so.

### Findings
- **medium** No `[NOTE FOR PM]` callouts appear anywhere in the document (confirmed by search — zero hits). This PRD is exactly the shape the rubric built that device for: reconciling a legal-toned brief against a minister's scope-creep annotations against a technical advisor's non-negotiables. The substance of those tensions is present (via Non-Goals prose, the `[DECISION]`/`[ASSUMPTION]` tags, and addendum's Provenance section), so nothing is silently dropped — but a reader scanning specifically for flagged unresolved tensions (the callout's purpose) won't find the marker at all, which weakens scannability for exactly the audience (a PM doing final sign-off) the tag exists for. *Fix:* not required for correctness, but consider tagging the reconciliation points in §5/§8/§9 with `[NOTE FOR PM]` alongside the existing prose, or explicitly note in §0 that this PRD uses `[DECISION]`/`[ASSUMPTION]` in place of `[NOTE FOR PM]`.

## Downstream usability — adequate

Glossary (§3) terms are used consistently in FR/UJ text (Listing, Distribution Radius, Application, Job Seeker, Employer, Catch, Badge all capitalized consistently where used as defined terms). FR IDs (FR-1–FR-22), UJ IDs (UJ-1–UJ-4), and SM IDs (SM-1–SM-3, SM-C1) are contiguous with no gaps or duplicates.

### Findings
- **low** UJ-4's protagonist is unnamed ("A ministry-side moderator handling day-to-day operations" / "An administrator handles a flagged listing," §2.3) where UJ-1/2/3 all name theirs (Amina, Karim, Fatima). The rubric's "no floating UJs" check exists for exactly this — a nameless protagonist is easier to lose track of when this UJ is pulled out alone downstream. *Fix:* give the admin persona a name for consistency, since the PRD already chose to write a UJ for this role rather than treating it as pure capability-spec.
- **low** Two of the four Assumptions/Open-Questions pairs are tracked in both places with near-identical wording — employer verification method (FR-10 assumption ≈ Open Question #2) and the retention window (FR-21 assumption ≈ Open Question #3). Not wrong, but a downstream reader resolving one won't necessarily know to close the other, and the two lists can drift out of sync if only one is updated.

## Shape fit — strong

This is a multi-stakeholder product (job seeker / employer / ministry admin) with meaningful UX, sitting inside a regulatory/institutional engagement — both push toward named-protagonist UJs and constraint traceability, and the PRD delivers both: UJs are load-bearing (mostly — see UJ-4 above) and §8's Constraints & Guardrails traces cleanly to the two source documents via the addendum's Provenance section. §0 explicitly names this as chain-top (feeds `bmad-architecture` and `bmad-create-epics-and-stories`), which is the right call given the FR/Glossary/ID discipline on display, and correctly raises the stakes on the downstream-usability findings above.

## Mechanical notes

- **Assumptions Index roundtrip:** clean — all 4 inline `[ASSUMPTION: ...]` tags (§4.3 FR-7, §4.4 FR-10, §4.10 FR-21, §9) are indexed in §13, and no index entry is orphaned.
- **ID continuity:** FR-1–FR-22, UJ-1–UJ-4, SM-1–SM-3/SM-C1 — no gaps, no duplicates.
- **Cross-references:** mostly resolve (`§ Monetization` → §9, `§ Constraints & Guardrails / Sovereignty` → §8's "Sovereignty / Cost" subsection — close enough to find). The two "Discovery decision" / "Discovery reconciliation" pointers do not (see Decision-readiness finding above) — worth a global search-and-fix pass since the phrase appears twice.
- **Glossary drift:** none of real concern. "tier" appears lowercase and unspecified in a few places (§2.1, UJ-3, §9) against the Glossary's capitalized "Subscription Tier," but usage is internally consistent (informal shorthand, not competing terms) and not worth a fix on its own.
- **Required sections for stakes:** all present — Vision, Target User (JTBD/Non-Users/UJs), Glossary, Features, Non-Goals, MVP Scope, NFRs, Constraints & Guardrails, Monetization, Platform, Success Metrics, Open Questions, Assumptions Index. Appropriate for a chain-top PRD feeding architecture and story creation.
