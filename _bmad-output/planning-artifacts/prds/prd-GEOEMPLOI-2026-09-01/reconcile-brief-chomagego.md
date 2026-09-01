# Reconciliation: `brief_chomage-go_en.pdf` vs. PRD (`prd.md` + `addendum.md`)

Input: `/home/aureliend/Projets/epitech/year3/pool/survivor-helper/brief_chomage-go_en.pdf` — the annotated ChomageGo revision of the GéoEmploi brief (Florine Pontaillac's original spec, struck through in places, with margin notes signed "JEB" from Minister Jean-Eudes Berlier).

Compared against:
- `/home/aureliend/Projets/epitech/year3/pool/survivor-helper/_bmad-output/planning-artifacts/prds/prd-GEOEMPLOI-2026-09-01/prd.md`
- `/home/aureliend/Projets/epitech/year3/pool/survivor-helper/_bmad-output/planning-artifacts/prds/prd-GEOEMPLOI-2026-09-01/addendum.md`

## Method

Extracted every JEB margin annotation and every piece of gamification "feel" language from the source PDF, then checked whether the PRD/addendum (a) names and resolves it with rationale, (b) silently omits it, or (c) preserves the mechanic in narrative form but drops its teeth as a testable requirement.

## Full annotation inventory and disposition

| # | JEB annotation (source) | PRD/addendum disposition | Verdict |
|---|---|---|---|
| 1 | "Go to security.microsoft.com/quarantine, release our messages, allow the sender... check it several times a day" | `prd.md` §8 "Security note (process, not a requirement)" + `addendum.md` Provenance: flagged as not acted on, routed to IT/security judgment | Explicitly resolved |
| 2 | "Florine WATERED DOWN my vision... struck-through parts are her jargon" (framing note) | Meta-commentary, not a requirement — no disposition needed | N/A |
| 3 | Pokémon GO pitch: AR listing pops up, walk toward it, catch it, apply | PRD Vision §1, FR-5 (Catch interaction), Non-Goals §5 (no real device-camera AR — source itself permits simulated) | Adopted, with explicit AR-vs-simulated call-out |
| 4 | "We don't complement, we REPLACE" FranceTravail/Apec | §2.2 Non-Users, §5 Non-Goals, Open Question 5 | Explicitly rejected, with rationale ("positioning language, not a functional requirement") |
| 5 | Job-seeker bullets: walk down the street; listings appear "in augmented reality... like creatures"; move closer and "catch" (hit Apply **at the right moment**); collect badges by catch count; unlock "JEB Work Permit" at 10 | Catch/Badge/Permis de Travail modeled (FR-5, FR-7, FR-8, Glossary) | Partially adopted — see Gap 2 below (proximity/timing mechanic dropped without note) |
| 6 | "The map is nice but it's not enough. It needs to move, it needs to be ALIVE." | FR-17 "Live Map Updates" section explicitly titled as answering "the 'alive' map the ministry asked for" | Adopted, but narrowed — see Gap 3 below |
| 7 | €400/month employer subscription; radius scales with price; Standard/Premium tiers | §9 Monetization, FR-11, FR-15, FR-16 | Adopted (as simulated billing — sovereignty constraint documented) |
| 8 | "Admin is me. Or my assistant. Give me access with the highest permissions." | §4.10 heading explicitly says "no admin backdoor for the Minister"; FR-20 consequence; `addendum.md` Provenance "specific reversals" list | Explicitly rejected, with rationale |
| 9 | Real-time map: new listing appears immediately via websockets | FR-17, NFR-Reliability | Adopted |
| 10 | Street-level precision (not district/commune) | §7 NFR Geographic precision, explicitly "elevated from the original... minimum" | Adopted, with rationale tying it back to privacy |
| 11 | GDPR reduced to an "I agree" checkbox, "my lawyer is too skittish" | FR-23 (consent gate), §8 Privacy: explicitly kept "regardless of the ministerial annotation suggesting a bare 'I agree' checkbox is sufficient" | Explicitly rejected, with rationale |
| 12 | Map load under 1 second ("people are impatient") | §7 Performance: "under 1 second is a stretch goal, not a blocking target" | Explicitly resolved (partial adoption, documented) |
| 13 | "Beautiful prototype for Thursday morning... not a developer screen" | §6.1 Week 1: "Presentable prototype (not a developer-only screen) for the Thursday walkthrough" | Adopted verbatim |
| 14 | PS: "if Florine contacts you with 'additional requirements,' you can listen out of politeness but the real spec is THIS document." | **No mention anywhere in `prd.md` or `addendum.md`.** Grep for "additional requirement", "politeness", "PS:" returns nothing. | **Gap 1 — silently dropped, no resolution** |

## Gap 1 — JEB's PS overriding Florine is never named or resolved

The brief's closing PS is a direct instruction to disregard the legal advisor's future input ("the real spec is THIS document"). The PRD's actual behavior is the opposite of what JEB asked — it treats Florine's original legal-toned requirements (GDPR consent, activity verification, content-responsibility/reporting) as authoritative, and Thomas Vignal's technical memo as "non-negotiable" (Doc Purpose, §0).

That outcome is *correct*, but unlike every other reversal (admin backdoor, real payment, checkbox consent, real AR — all explicitly named as reversals in `addendum.md`'s "Provenance: reconciling the two briefs" section, with a one-line rationale each), this specific annotation — the attempt to pre-empt and discredit any further correction from the legal advisor — is never quoted, named, or addressed. It reads as an oversight rather than a considered rejection: nothing in the PRD tells a reader "yes, we saw the instruction to disregard Florine going forward, and we did the opposite because X." Contrast with item #1 (quarantine URL), which got its own dedicated flag despite being far more clearly out-of-scope/suspicious — the PS is arguably the higher-stakes one to call out explicitly, since it's a legitimate-looking instruction about document authority, not an obvious phishing pattern.

**Recommendation:** Add one line to `addendum.md`'s Provenance section (or `prd.md` §8) naming this annotation and stating the PRD treats Florine's original requirements and any of her future corrections as authoritative regardless of JEB's PS, consistent with how the other reversals are already documented.

## Gap 2 — the physical-proximity / timing "catch" mechanic is flattened to a plain tap

JEB's bullets describe a specific interaction, not just a themed vocabulary: "they walk down the street... they move to get closer and 'catch' them (**hit the Apply button at the right moment**)." This has two components beyond "apply with a different name": (a) real-world physical movement gates the interaction, and (b) there's a timing/skill window, echoing Pokémon GO's throw mechanic.

The PRD's Vision (§1) and UJ-2 (Karim's journey) both preserve the narrative flavor ("he moves toward it, taps it, hits Apply"). But the actual functional requirement, FR-5, only says: *"selecting/approaching one and confirming triggers the Apply action... and is visually distinct as a 'Catch.'"* There is no testable consequence anywhere in the PRD requiring:
- that the Job Seeker's device be within any real-world distance of the Listing before Catch is enabled, or
- any timing/skill element to the confirm action.

Grep across `prd.md` for proximity/distance/meter/physical-gating language turns up nothing beyond the glossary's "approach the marker" (which reads as map-UI navigation — panning to a marker on screen — not real-world walking). So as currently specified, a Job Seeker could "catch" every listing on the national map from their couch without moving at all, which is a materially different game than the one JEB pitched. This isn't flagged as a deliberate simplification anywhere (unlike, say, the AR-vs-simulated call in Non-Goals, which *is* explicit about what was cut and why).

**Recommendation:** Either (a) add an explicit FR-5 consequence gating Catch on device-proximity to the Listing (even a generous radius), or (b) if that's a deliberate simplification for v1 scope/deadline reasons, add one line to Non-Goals or the FR-5 description saying so explicitly, the way AR-vs-simulated already is.

## Gap 3 — "the map needs to feel ALIVE" is narrowed to a delivery-mechanism NFR

JEB's line is about *felt* liveliness — "it needs to move" — in the context of a map that visually behaves like a Pokémon GO overworld (markers that could plausibly animate, feel dynamic, respond to the user's presence). The PRD's answer to this line is FR-17 "Live Map Updates," described as "the 'alive' map the ministry asked for, delivered in a way that survives a network that blocks outbound WebSockets" — but its actual consequences are entirely about data-sync mechanics (WebSocket vs. polling fallback, dedup by Listing ID, kill switch). There's no requirement anywhere about marker visual treatment, animation, or any UI liveliness beyond "a new pin appears without a page reload."

This is a smaller gap than #2 — reasonable, since visual/motion design is arguably a UX-spec-level concern rather than a PRD-level FR — but worth flagging because the PRD explicitly claims (in FR-17's own description) to be answering this specific line, and what it delivers is narrower than what the line asked for. A reader could reasonably expect the PRD to at least note that the "feel alive" request is being interpreted narrowly as data freshness, deferring visual liveliness to a UX pass, rather than silently substituting one for the other.

## Summary

- **2 of the source's 14 distinct JEB annotations show no explicit resolution/rationale anywhere** (Gap 1: the PS about disregarding Florine; and, to a lesser degree, the proximity/timing half of Gap 2's mechanic).
- **1 further item (Gap 3) is answered on paper but interpreted narrower than the source language**, without saying so.
- Every other JEB ask (quarantine URL, AR/Pokémon-GO framing, FranceTravail replacement, €400 subscription, admin backdoor, real-time websockets, street-level precision, GDPR checkbox, sub-1s load, Thursday prototype) is explicitly named and resolved with rationale in `prd.md` and/or `addendum.md`, per the task's stated non-gap baseline.
