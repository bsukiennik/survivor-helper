# PRD Quality Review (Round 2 — Post-Reconciliation Re-check) — GéoEmploi

This is a re-check, not a first pass. Round 1 (`review-rubric.md` + `review-adversarial.md` + `review-edge-case.md`) already ran and its fixes landed in `prd.md`. A subsequent five-source reconciliation pass (`reconcile-brief-geoemploi.md`, `reconcile-brief-chomagego.md`, `reconcile-thomas-email.md`, `reconcile-benjamin-email.md`, `reconcile-brainstorm.md`) found and fixed ~18 more gaps, including correcting a factual provenance error in `addendum.md` (the brainstorming session concluded a layered architecture, not hexagonal). This review checked whether that reconciliation pass left anything inconsistent, and re-verified the fixes it claims to have made. It does not re-litigate round-1 decisions.

## Overall verdict

The reconciliation pass is real and mostly clean — I spot-checked all five reconcile files' gap lists against the current `prd.md`/`addendum.md` and every gap they identified in `prd.md` proper is fixed, including the hexagonal/layered provenance correction, which now reads accurately. The one significant regression is that `addendum.md`'s "Ministry technical deliverable checklist" was not resynced after `prd.md` changed underneath it: it still says the local-run timing check is done by "someone outside the authoring team," directly contradicting `prd.md` §8's now-corrected "a team member who did not write the install steps" — the exact discrepancy the memlog claims was fixed. Three more items in that same checklist (AWS/GCP/Azure naming, the WebSocket kill-switch, the load-test script+"why" deliverable) are similarly stale relative to the PRD text they're supposed to mirror. Nothing else rises above minor.

## Decision-readiness — strong

Trade-offs are named with what was given up, not smoothed over. FR-5's assumption tag is a good example of the PRD arguing against its own convenience: *"as written, a Job Seeker could catch any listing nationally without moving"* (§4.3) — that's a real admission of a gap between the minister's pitch and what v1 ships, not a reassurance. FR-17's Notes make the same move: the "ALIVE" map request is *"interpreted narrowly here as real-time data delivery"* with visual liveliness explicitly punted to UX rather than silently folded into the FR. Open Questions (§12) are genuinely open — Premium pricing, verification method, retention window, production capacity, the FranceTravail data-sharing implication, the pending charter document — none of these have answers buried in the next sentence.

No findings.

## Substance over theater — strong

Four personas, all load-bearing (each drives a distinct feature cluster: Amina→public browsing, Karim→gamification integrity, Fatima→employer monetization, the moderator→governance). NFRs carry product-specific numbers, not adjectives: map load `<3s`, `/health <200ms`, 50 concurrent users/3 min/≥500 listings/≥50 communes. The Vision statement (§1) names the specific mechanic ("catch," "Permis de Travail") and the specific non-goal (not rebuilding FranceTravail's matching engine) — it wouldn't drop into another PRD unchanged.

No findings.

## Strategic coherence — strong

The thesis is stated and held to: a narrow "is there anything hiring near me right now" tool, not a FranceTravail replacement, despite the minister's own document claiming otherwise (§2.2, §5, addendum Provenance). Success Metrics are deliberately restrained — §11's header note, *"Kept to what the ministry actually asked for... no invented engagement/conversion metrics,"* and SM-C1 exists specifically to stop SM-1 (listings published) from being optimized at the expense of moderation quality.

No findings.

## Done-ness clarity — adequate

Most FRs carry testable consequences, and the gamification-integrity ones (FR-5, FR-7) are unusually rigorous — atomicity on the 9th→10th catch, server-side-only counting, dedup on repeat catches. A handful of simpler FRs (FR-14 "sort/filter received Applications by status and contact the applicant," FR-15, FR-18, FR-22) state the capability without an explicit testable consequence. This isn't new to this pass and these are low-ambiguity CRUD-shaped requirements where the risk of under-specification is low, so it doesn't move the needle to "thin" — but it's the dimension future story-writing will feel first if left alone.

### Findings
- **low** Several FRs lack explicit "Consequences" blocks (§4.6 FR-14, §4.7 FR-15, §4.9 FR-18, §4.11 FR-22) — *Fix:* not urgent; add one-line consequences if story-writing stalls on any of these specifically.

## Scope honesty — strong

Non-Goals (§5) does real work, `[ASSUMPTION]` tags are used where the PRD is inferring rather than confirming (5 of them, all correctly indexed — see Mechanical notes), and de-scoping is explicit rather than silent (e.g., "Finding #7 (30-day archival transition edge cases) reviewed and deliberately left unaddressed per user direction" — addendum, Reviewer Gate resolution). Open-items density (6 Open Questions + 5 Assumptions + 1 NOTE FOR PM) is proportionate for a launch-stakes pool-project PRD, not inflated.

No findings.

## Downstream usability — thin

This is where the reconciliation pass left a real gap. `addendum.md`'s "Ministry technical deliverable checklist" is explicitly framed as an operational artifact — *"Tracked here as an implementation checklist"* — meaning it's the document someone would work off directly rather than re-deriving from `prd.md` prose. It has fallen out of sync with the `prd.md` text it mirrors in four places, one of which is a direct contradiction rather than an omission.

### Findings
- **high** Addendum checklist contradicts the corrected PRD on who runs the local-install timing check (`addendum.md` line ~34, `prd.md` §8) — `prd.md` §8 now reads *"a team member who did not write the install steps clones into an empty directory... times the process — that measured time, reported back to Thomas Vignal, is the actual acceptance criterion."* The `.memlog.md` (line 39) records this exact correction as one of the 18 reconciliation fixes ("le testeur d'installation: Thomas demande quelqu'un DE l'équipe, pas extérieur — corrigé"). But `addendum.md`'s checklist still says *"timed by someone outside the authoring team"* — the pre-correction wording, now directly contradicting `prd.md` on a non-negotiable Thomas Vignal constraint. Anyone implementing off the addendum checklist alone would run the wrong process. *Fix:* change the addendum checklist line to match `prd.md` §8 — an internal team member who didn't write the install steps, with the measured time reported back to Thomas as the acceptance criterion.
- **medium** Same addendum checklist item omits `prd.md` §8's explicit AWS/GCP/Azure exclusion — the checklist still says only "no managed DB, no managed object storage, no commercial map API, no commercial auth, no commercial email," missing the named-cloud-provider detail that was added to `prd.md` §8 specifically because it's the constraint Thomas says he gets asked about "three times a day" (per `reconcile-thomas-email.md`). *Fix:* add the AWS/GCP/Azure exclusion to the addendum checklist line.
- **medium** Addendum checklist's WebSocket line doesn't capture the kill-switch — it says *"WebSocket live updates with polling fallback, toggle by config (not code), documented behavioral diff between modes"* but `prd.md` FR-17/§7 Reliability adds a second, distinct capability from the reviewer-gate pass: WebSocket delivery can be disabled entirely by configuration, independent of the polling fallback. The checklist as written would satisfy someone building only the fallback-on-failure behavior, not the operator-level full-disable switch. *Fix:* add the kill-switch as its own checklist line, distinct from the fallback toggle.
- **medium** Addendum checklist's load-test line is narrower than `prd.md` §7 — checklist says *"report median/p95 response time, error rate, top fix"*; `prd.md` §7 now also requires delivering *"the load-test script itself"* and the top-fix line *"and why"* (both added per `reconcile-thomas-email.md` gaps 3–4). The checklist, read alone, would pass without the script or the justification. *Fix:* sync the checklist line to require the script and the "why."
- **low** UJ-3 (§4.7/§4.5) and UJ-4 (§4.9) are never explicitly tagged "Realizes UJ-3"/"Realizes UJ-4" in their corresponding Feature sections, unlike UJ-1 (§4.1) and UJ-2 (§4.3) which are. Not a broken cross-reference (the mapping is inferable), but it's an inconsistent pattern that a downstream extraction pass would have to reconstruct manually for two of the four UJs. *Fix:* add "Realizes UJ-3" to §4.5 or §4.7, and "Realizes UJ-4" to §4.9.
- **low** Benjamin Sellami's per-screen charter compliance list (FR-26) is described as something "the team maintains" with no instruction to transmit it to Benjamin, though his email's framing implies he expects to receive it (flagged as low-confidence in `reconcile-benjamin-email.md` item 1.10/6, and left unresolved). *Fix:* low priority given the reconcile file's own low confidence — worth one line only if it turns out Benjamin does expect delivery of the list itself, not just the video.

## Shape fit — strong

Multi-stakeholder consumer-facing product with a regulatory/compliance layer (ministry constraints, GDPR) — UJs with named protagonists are correctly load-bearing here, and three of the four (Amina, Karim, Fatima) are properly named and carry context inline. The constraint-traceability the rubric calls for on regulatory work is present and is arguably this PRD's strongest feature: §8's Sovereignty/Privacy/Content-Responsibility constraints trace cleanly back to named source documents, and the addendum's Provenance section threads every JEB-vs-Florine-vs-Thomas conflict through to a stated resolution.

No findings beyond the UJ-4 protagonist-naming note captured in Mechanical notes below.

## Mechanical notes

- **UJ protagonist naming gap:** UJ-4 (§2.3) has no named protagonist — *"A ministry-side moderator handling day-to-day operations"* — unlike UJ-1/2/3 (Amina, Karim, Fatima). Minor but real: the rubric calls this out explicitly, and it's the one UJ a downstream reader can't refer back to by name.
- **Assumptions Index roundtrip: clean.** All 5 inline `[ASSUMPTION: ...]` tags (§4.3 FR-5, §4.3 FR-7, §4.4 FR-10, §4.10 FR-21, §9) are indexed in §13, and all 5 index entries have a matching inline tag. No drift.
- **ID continuity: intact but non-sequential.** FR-1 through FR-26 are all present exactly once (no gaps, no duplicates), but FR-23/FR-24 appear out of numeric order in the document (inserted after FR-2 and FR-16 respectively, reflecting when they were added during the reviewer-gate pass). This doesn't break anything — IDs are unique and every cross-reference to them resolves — but flag it if a future edit pass wants to renumber for readability.
- **Glossary case drift (very minor):** UJ-3 (§2.3) uses lowercase "distribution radius tied to her subscription tier" where the Glossary (§3) and every FR elsewhere use the capitalized proper-noun forms "Distribution Radius" / "Subscription Tier." Cosmetic only.
- **Provenance caveats applied unevenly in the addendum:** the Zod-vs-class-validator research now carries an explicit disclaimer — *"Researched during PRD Discovery, 2026-09-01 — not part of the original brainstorming session"* — correctly flagging that it isn't sourced from the brainstorm memlog (per `reconcile-brainstorm.md` gap 3). The Drizzle rationale ("stays close to raw SQL, no heavy codegen layer to fight") and the Leaflet/SSR-hydration detail in the frontend bullet carry no equivalent caveat, even though `reconcile-brainstorm.md` flagged both as unsourced in the memlog (gaps 4–5). Low stakes — the reasoning itself isn't disputed — but the disclaimer pattern is now inconsistent within the same document.
- **Frontmatter/addendum summary are stale relative to the reconciliation pass.** `prd.md`'s `review_status` frontmatter and `addendum.md`'s "Reviewer Gate resolution" section both describe only the round-1 fixes (consent gate, catch integrity, sovereignty checklist, deletion/retention, subscription lapse, WS toggle+dedupe). Neither mentions the subsequent five-source reconciliation pass (~18 more fixes, including the hexagonal-architecture provenance correction) — that history currently lives only in `.memlog.md` and the `reconcile-*.md` files, not in either live document's own self-description. Not a contradiction, just an incomplete audit trail for a reader who doesn't go looking at the reconcile files.
- **Hexagonal/layered provenance correction verified accurate.** Re-checked `addendum.md`'s "Architecture" section against `reconcile-brainstorm.md`'s extraction of the brainstorming memlog: the addendum now correctly states the brainstorming session's own closing synthesis dropped hexagonal in favor of simple layers, and that hexagonal was reopened and readopted later during PRD Discovery for a different reason (adapter-swap resilience, reinforced after the fact by the sovereignty constraint). This matches the memlog exactly and the "team size justifies NestJS but not hexagonal" insight that `reconcile-brainstorm.md` flagged as dropped is now present (addendum "Insight from brainstorming carried forward"). No residual issue here.

---

**Finding counts:** 1 high, 4 medium, 4 low. Zero critical/broken findings — nothing here blocks the PRD from being used; the high finding is a same-document-family sync gap, not a scope or requirements error in `prd.md` itself, which remains internally consistent throughout.
