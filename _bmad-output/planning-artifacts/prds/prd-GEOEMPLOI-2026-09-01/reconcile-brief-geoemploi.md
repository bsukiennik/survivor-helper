# Reconciliation: `brief_geoemploi_en.pdf` (Florine Pontaillac original functional specification) vs. `prd.md` / `addendum.md`

**Source:** `/home/aureliend/Projets/epitech/year3/pool/survivor-helper/brief_geoemploi_en.pdf` — GéoEmploi Functional Specification, Ministère du Job et Bonheur / Digital and Innovation Directorate, ref. JEB/DNI/2026-001, v1.0. Authored in a legal/administrative register by Florine Pontaillac (legal advisor), with Thomas Vignal (digital advisor) and Benjamin Sellami (communications advisor) named as contacts. Treated per task instructions as the authoritative legal/functional baseline, even where a later annotated brief superseded parts of it.

**Method:** Read the source PDF in full (5 content pages: institutional context; functional scope; priority requirements; technical constraints; deliverables; points of attention) against `prd.md` and `addendum.md` in full. Checked every checkmarked (✓) requirement and every prose sentence for a corresponding FR/NFR, Non-Goal, Constraint, Open Question, or provenance note — not just a feature-level match, but whether the *nuance* (why, legal framing, disclaimer, mandatory-vs-optional) survived.

---

## Gaps found

### 1. "Secure authentication (JWT or server-side session)" — dropped with no trace
**Source (§3.1 Architecture, technical constraint, checked ✓):**
> Secure authentication (JWT or server-side session)

**PRD/addendum:** Grepped both files for `jwt`, `session`, `secure authentication` — zero matches. FR-3 ("Job seeker account creation") only says "email/password or equivalent," with no requirement for how sessions/tokens are secured. This is not in Non-Goals, not in the Assumptions Index, not in Open Questions, and not in `addendum.md`'s otherwise-thorough "Ministry technical deliverable checklist" (which faithfully carries forward OpenAPI, `.env.example`, `/health`, sovereignty, load test, etc., from Thomas Vignal's constraints, but omits this one). It reads as a genuine oversight rather than a deliberate reconciliation — nothing marks it as superseded or intentionally left to implementation discretion.

### 2. Provider (not just employer) liability disclaimer reduced to flavor text
**Source (§5 Points of attention):**
> Published listings are the responsibility of the employer. **The technical service provider is not responsible for the content of listings.** A reporting system must allow users to flag fraudulent or non-compliant listings.

This is two distinct legal claims: (a) the employer is responsible for content, and (b) the delivery team itself is explicitly indemnified from that content — a liability-shifting clause, notable precisely because the document is legal-advisor-authored.

**PRD:** §8 "Content Responsibility" only restates (a): *"Employers are responsible for their own Listing content; the Report mechanism (FR-18/FR-19) is the mitigation the ministry required, not a guarantee of content quality."* The provider's own non-liability is only quoted once, in §4.9's feature description, purely as rationale for why the Report feature exists (*"The ministry's explicit mitigation for 'the technical provider isn't responsible for listing content.'"*) — it is never asserted as a standalone constraint/guardrail protecting the delivery team. Since Constraints & Guardrails (§8) is exactly where the PRD does carry forward other legal-toned protections (Privacy, Sovereignty), the absence of an explicit "the provider bears no responsibility for listing content" line there is a real loss of the original legal nuance, not just redundant phrasing.

### 3. "The solution must support gradual scaling" — silently downgraded to an unresolved question
**Source (§3.4 Performance, checked ✓, alongside the 3-second map load time):**
> The solution must support gradual scaling

This is phrased as a mandatory architectural property, on the same footing as the load-time target.

**PRD:** No FR/NFR states an architectural requirement for gradual scaling. The only related text is Open Question 4: *"Production-scale capacity beyond the demo-scale load test (§7) — the ministry specified a 50-user/3-minute test scenario for the technical review; no stated target exists for real production concurrency."* That's an honest flag that no concrete target exists — but it treats "gradual scaling" as an *undefined* number to be clarified, not as an already-stated mandatory requirement that needs an architectural answer regardless of the exact target. Nothing in Non-Goals or the provenance notes says this requirement was deliberately descoped or reinterpreted; it just isn't restated as a requirement anywhere.

### 4. Week-1 "oral presentation: functional demo + chosen technical approach" deliverable missing
**Source (§4 Expected deliverables, Week 1 proof of concept):**
> ✓ Oral presentation: functional demo + chosen technical approach

**PRD:** §6.1 Week 1 in-scope list includes "Presentable prototype (not a developer-only screen) for the Thursday walkthrough" and a detailed promotional-video deliverable (due Friday 12:00) — but at no point states the requirement for an oral presentation covering the functional demo *and* the team's chosen technical approach. Grepped both files for "oral presentation," "functional demo," and "chosen technical approach" — no matches. The promo video is a different artifact (a scripted 2-minute capture of one user journey) and doesn't substitute for a live/oral walkthrough of technical decisions. If the Thursday walkthrough is meant to be that oral presentation, the PRD never says so explicitly — the connection is left for the reader to infer, and the "chosen technical approach" half of the requirement isn't addressed by either the walkthrough or the video description.

### 5. (Minor) "Map data: OpenStreetMap or equivalent" never named
**Source (§3.2 Mapping, checked ✓):**
> Map data: OpenStreetMap or equivalent

**PRD/addendum:** Leaflet.js is discussed (addendum, frontend stack rationale re: SSR incompatibility), and a generic "tile provider" is referenced in §7 Observability and the sovereignty checklist (server-side tile cache, no API key in the bundle) — but OpenStreetMap is never named, and no line confirms what the actual map-data source will be. Given the Sovereignty constraint (no commercial map API), OSM is the obvious implied choice, but it's left implicit rather than confirmed. Lower severity than 1–4 since the sovereignty constraint effectively forces the same outcome, but the explicit named requirement itself doesn't appear anywhere, and it isn't listed in Assumptions or Open Questions either.

---

## Not gaps (checked and confirmed the PRD explicitly reconciles these)

- **Geographic precision** — source's "district or municipality level" minimum is explicitly and knowingly overridden to street-level in PRD §7, with a stated rationale (privacy/consent implication) — a real reconciliation, not a silent drop.
- **AR / "catch" mechanic vs. simulated map layer** — explicitly addressed in Non-Goals (§5) with a citation back to the source's own Week-1 allowance for a simulated version.
- **Payment processing / admin backdoor / GDPR consent** — all three explicitly listed in `addendum.md`'s "Provenance: reconciling the two briefs" as deliberate reversals of the later annotated brief, in favor of the original Pontaillac spec.
- **30-day auto-archival, employer notification-per-application, free anonymous map browsing, authenticated-only application** — all four §2.2 priority requirements are present as FR-12, FR-13, FR-1, and FR-6 respectively.

---

## Summary

Five gaps identified, ranging from a clean miss (secure authentication constraint — Gap 1) to nuance-loss in an otherwise-covered area (provider liability disclaimer — Gap 2; scaling requirement — Gap 3; Week-1 oral presentation deliverable — Gap 4) to a minor implicit omission (named OSM map-data source — Gap 5). None of these are flagged in the PRD's Non-Goals, Open Questions, or Assumptions Index as deliberately dropped or superseded — they are simply absent, which is the condition this task was checking for.
