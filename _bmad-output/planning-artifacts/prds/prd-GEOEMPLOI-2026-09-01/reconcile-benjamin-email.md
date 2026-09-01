# Reconciliation: Benjamin Sellami email vs. PRD §4.12 / §6.1

Source: email from Benjamin Sellami (conseiller communication, Cabinet du Ministre), undated, addressed to the delivery team.
Target: `/home/aureliend/Projets/epitech/year3/pool/survivor-helper/_bmad-output/planning-artifacts/prds/prd-GEOEMPLOI-2026-09-01/prd.md`, §4.12 Brand & Naming Compliance (FR-25, FR-26) and §6.1 MVP Scope / Week 1.

## Method

Every distinct requirement/nuance was extracted from the email as a discrete line item, then checked against the PRD text (not paraphrase — actual wording quoted where relevant).

---

## 1. Ministerial graphic charter (email point 1)

| # | Email requirement | PRD coverage | Verdict |
|---|---|---|---|
| 1.1 | Full 47-page charter doc is pending (sent same day); team should not wait for it | Notes under FR-26: "The full 47-page charter document is pending; FR-26 covers the three rules already communicated. Revisit once the full document arrives." Also Open Question 6. | Covered |
| 1.2 | Institutional blue `#1B3A6B` as primary color, **never as button fill** | FR-26: "institutional blue `#1B3A6B` as primary color (never as a button fill)" | Covered |
| 1.3 | Marianne typeface for titles/headings, Spectral for body text | FR-26: "Marianne typeface for headings, Spectral for body text" | Covered |
| 1.4 | Ministry lockup (bloc-marque) top-left, respecting protected clear-zone, never over a photo | FR-26: "ministry lockup top-left with its protected clear-zone, never placed over a photo" | Covered |
| 1.5 | "Obligatoire" means **everywhere**, not just the homepage | FR-26 consequences explicitly enumerate surfaces beyond the homepage | Covered |
| 1.6 | Specific list of commonly-forgotten screens: login page, 404 error page, 500 error page, empty states ("no listings in this sector"), loading screens, transactional emails, favicon, browser tab title, PDF exports | FR-26 consequences: "login screen, 404 and 500 error pages, empty states (e.g. \"no listings in this area\"), loading states, transactional emails, favicon, browser tab title, and any PDF export" — every item on Benjamin's list is present, near-verbatim | Covered (comprehensively) |
| 1.7 | Rationale given for why these specific screens matter: they're exactly what ends up as a journalist's screenshot | Not restated in PRD (rationale, not a testable requirement) — acceptable to drop, the resulting obligation (1.6) is preserved | Not a gap (rationale, not requirement) |
| 1.8 | Deliverable: an honest per-screen list, each marked "conforme" or "à faire, prévu tel jour" (i.e. **with a projected date**, not just "à faire") | FR-26 consequences: "a per-screen list marked \"conforme\" or \"à faire (date)\"" — the "(date)" nuance is preserved | Covered |
| 1.9 | Explicit contrast: an honest partial list is fine; a charter half-applied with nobody knowing which half is not | FR-26 consequences: "an honest partial list is acceptable; an unmarked partial rollout is not" | Covered |
| 1.10 | (Implicit) Benjamin expects to receive this screen-by-screen list from the team — a deliverable *to send him*, not just an internal artifact | PRD treats it as an internal "team maintains" list; no explicit instruction to transmit it to Benjamin, and no deadline attached to that transmission | **Possible gap** — see below |

## 2. Displayed name (email point 2)

| # | Email requirement | PRD coverage | Verdict |
|---|---|---|---|
| 2.1 | On-screen/displayed name is **"GéoEmploi"**, never the Minister's pet working-name (implicitly "ChomageGo," which the team has "sans doute déjà croisé") | FR-25: renders as "GéoEmploi" and only that; explicitly excludes "ChomageGo" by name | Covered |
| 2.2 | No variant, no nickname | FR-25: "no variant, no internal codename" | Covered |
| 2.3 | Applies everywhere it could end up in front of a journalist: interface, **captures** (screenshots), everything | FR-25: "Every user-facing surface (UI text, error messages, transactional emails, **screenshots**, exports)" | Covered |

## 3. Promotional video (email point 3) — the section with the most nuance

| # | Email requirement | PRD coverage | Verdict |
|---|---|---|---|
| 3.1 | Under 2 minutes | §6.1: "under 2 minutes" | Covered |
| 3.2 | 1080p horizontal | §6.1: "1080p horizontal" | Covered |
| 3.3 | Voice-over optional | §6.1: "not optional voiceover" (phrased as contrast) | Covered |
| 3.4 | Burned-in subtitles **mandatory** (rationale: newsrooms cut the sound) | §6.1: "burned-in subtitles (mandatory — not optional voiceover)" | Covered |
| 3.5 | Subtitles must be **legible on a phone screen, i.e. large** ("Lisibles sur un téléphone, donc gros") | §6.1 says nothing about subtitle size/legibility — only that they exist and are burned-in | **Gap** — sizing/legibility requirement dropped |
| 3.6 | Must be a capture of the **actual running application** — not a mockup, not slides, not a reconstructed animation | §6.1: "a continuous capture of the running app (no mockups, slides, or reconstructed animation)" | Covered |
| 3.7 | Must be **one continuous journey**: open app → see map → spot a listing ~300m away → apply | §6.1: "showing one journey: open the app → see the map → spot a nearby listing → apply" (the "300m" flavor detail is reasonably generalized to "nearby") | Covered |
| 3.8 | **Explicit, named contrast**: "C'est ce parcours-là, notre récit. **Pas la liste de vos fonctionnalités.**" — Benjamin is pre-emptively ruling out a features-tour video, not just asking for a journey | §6.1 states the journey positively but does **not** carry the explicit prohibition against a feature-list-style video | **Gap (softened)** — the guardrail against the likely failure mode (a features tour disguised as a demo) is dropped, not just the positive instruction |
| 3.9 | Screen content must be **credible**: real cities, real-sounding companies, real-sounding job titles, in enough quantity for the map to "breathe"/look populated | §6.1: "realistic seed data (real-sounding cities, companies, job titles...), at a volume sufficient for the map to look populated" | Covered |
| 3.10 | **No real personal data** ("Aucune donnée personnelle réelle") | §6.1 does not mention this — only bans "test" placeholders (see 3.11) | **Gap** — a distinct privacy-flavored prohibition, not restated, and notable given how much the rest of the PRD emphasizes RGPD/consent |
| 3.11 | **No "lorem ipsum"** placeholder text, stated as a separate prohibition from "no 'test' labels" | §6.1: only "no 'test' placeholders" is stated; "lorem ipsum" is not mentioned as its own item | **Minor gap** — likely intended as covered by "realistic seed data," but the email names two distinct anti-patterns (a literal "test" title, and lorem-ipsum filler text) and the PRD only names one |
| 3.12 | Note in passing: "Ça se fabrique" (this data has to be manufactured — it's work) and "ça vous resservira toute la quinzaine" (it'll be reused all fortnight) | PRD goes further: explicit PM note ties this dataset to the NFR-7 load test (≥500 listings/≥50 communes) as the same dataset for two deliverables | Covered / expanded |
| 3.13 | Deliverable: a **5-line intention note** — the three moments chosen to show, and what was deliberately cut | §6.1: "a 5-line intention note: the three moments chosen to show, and what was deliberately cut" | Covered (content) |
| 3.14 | **This is the note Benjamin reads first** when he receives a video — its purpose is diagnostic: it tells him whether the team made a deliberate choice or "put everything in" | §6.1 states the note's required *content* but drops entirely the fact that it is read first / its function as a signal of editorial discipline | **Gap (softened)** — the note is preserved as a checklist item, but its stated priority/significance to the reader is lost, which could get it treated as a low-effort afterthought rather than the first thing scrutinized |
| 3.15 | Deadline: Friday 12:00 for the video package | §6.1: "Promotional video, due Friday 12:00" | Covered |

---

## Summary of gaps found

1. **Subtitle legibility on mobile** ("gros" / large enough to read on a phone) — present in the email, absent from PRD §6.1, which only mandates that subtitles exist and are burned-in.
2. **"Not a features list" guardrail dropped** — the PRD states the required single-journey narrative but omits Benjamin's explicit, named rejection of a feature-tour video ("Pas la liste de vos fonctionnalités"). This is a softening: a positive instruction survives, the warning against the likely failure mode does not.
3. **"No real personal data" in seed data** — a distinct privacy-flavored prohibition in the email, not present anywhere in PRD §6.1's seed-data description (which only bans "test" placeholders). Notable given the PRD is otherwise careful about RGPD/consent elsewhere.
4. **Intention note's purpose/priority dropped** — PRD keeps the note's required content (3 moments shown, what was cut) but loses the email's explicit statement that this is what Benjamin reads *first* and that it functions as a signal of editorial discipline vs. dumping everything in. This materially changes how a team would prioritize writing it.
5. **(Minor) "no lorem ipsum" as its own named prohibition** is folded into "no test placeholders" rather than kept distinct — likely low-risk since "realistic seed data" implicitly excludes both, but the email names two separate anti-patterns and the PRD only names one.
6. **(Minor/possible) No explicit instruction to send the per-screen charter compliance list to Benjamin**, nor a deadline for doing so — PRD treats the list as something "the team maintains," while the email's framing implies it's a deliverable he expects to receive (grouped with, or adjacent to, the Friday 12:00 deadline). Lower confidence than the others since the email's "envoyez-moi ça" could plausibly refer only to the video package.

## Requirements fully and faithfully captured (no gap)

- Charter's three concrete rules (color/button-fill exception, typography pairing, lockup placement/clear-zone/no-photo-overlay).
- The comprehensive "don't forget these screens" list — matched near verbatim (login, 404, 500, empty states, loading states, transactional emails, favicon, tab title, PDF exports).
- The "à faire (date)" nuance and the honest-partial-list-vs-silent-partial-rollout contrast.
- Single enforced display name "GéoEmploi," including its extension to screenshots and the explicit exclusion of "ChomageGo."
- Video technical specs (duration, resolution, subtitles-mandatory/voiceover-optional).
- "Real running app, not mockup/slides/reconstructed" constraint.
- The single continuous journey (open → map → spot listing → apply).
- Realistic seed data requirement and its volume ("map should look populated"), including a smart PRD-side addition tying it to the NFR-7 load-test dataset.
- Friday 12:00 deadline.
- Not waiting for the full 47-page charter document before starting.
