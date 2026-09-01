# Reconciliation: brainstorming memlog vs. addendum.md

Source A (ground truth): `_bmad-output/brainstorming/brainstorm-geoemploi-stack-architecture-2026-09-01/.memlog.md`
Source B (target): `_bmad-output/planning-artifacts/prds/prd-GEOEMPLOI-2026-09-01/addendum.md`
Context read: `prd.md` (same folder)

## 1. Full extract of memlog decisions (source of truth)

| # | Line | Type | Content |
|---|------|------|---------|
| 1 | 9 | direction (user) | Stack envisagée: React + TS, NestJS, Drizzle ORM, peut-être Next.js, shadcn/ui + Tailwind |
| 2 | 10 | direction (user) | Archi hexagonale proposée; flowchart Frontend->API REST->DB relationnelle, tuiles carto externe (OSM), FranceTravail/Apec hors périmètre |
| 3 | 11 | direction (user) | Veut que le coach challenge stack + archi |
| 4 | 12 | decision | Stance: Creative Partner |
| 5 | 13 | technique | Assumption Reversal démarré |
| 6 | 14 | decision (user) | Accepte les renversements: **drop Next.js, drop archi hexagonale**, questionner NestJS |
| 7 | 15 | decision (coach) | Frontend: Vite + React + TS (CSR pur, pas de SSR) au lieu de Next.js |
| 8 | 16 | decision (coach) | Archi: **couches simples (controller/service/repo) au lieu d'hexagonale** pour ce scope 2 semaines |
| 9 | 17 | decision (coach) | NestJS: à garder seulement si plusieurs devs codent le backend en parallèle (valeur = structure partagée), sinon Express/Fastify plus léger |
| 10 | 18 | decision (user) | Équipe de 5 personnes -> NestJS confirmé (structure utile à plusieurs) |
| 11 | 19 | direction (user) | Clôture de la session |
| 12 | 20 | **insight (synthesis)** | Vite+React+TS+shadcn/Tailwind (front), NestJS en couches simples **(controller/service/repo, sans hexagonale)** + Drizzle (back). Next.js et **l'archi hexagonale abandonnés** (pas de besoin SSR/SEO, une seule DB/un seul fournisseur carto). NestJS confirmé car équipe de 5 (coordination) — **insight: taille d'équipe justifie la structure du framework mais pas la complexité architecturale (deux besoins distincts: coordination humaine vs flexibilité technique)** |

Notable absences from the memlog: no mention anywhere of Zod, `class-validator`, `class-transformer`, DTO validation, `@nestjs/swagger`, or any GitHub issue research. No discussion of *why* Drizzle was kept beyond it appearing in the initial framing (item 1). No mention of Leaflet or SSR-hydration risk specifically.

## 2. Comparison against addendum.md

### Frontend (addendum "Stack decisions" bullet 1)
Addendum: "Next.js was considered and dropped — no SSR/SEO need for this product, and Leaflet's SSR incompatibility (hydration issues) was a real risk against a tight deadline."
- "No SSR/SEO need" — matches memlog synthesis (item 12). Accurate.
- "Leaflet's SSR incompatibility (hydration issues)" — **not in the memlog**. No entry discusses Leaflet or hydration. This is added reasoning with no traceable provenance in this session. Either sourced elsewhere (undocumented) or fabricated during addendum drafting.

### Backend / NestJS (bullet 2)
Addendum: "confirmed specifically because the delivery team is 5 people — the framework's imposed structure (modules/DI) pays for itself at that headcount; it would not have been the call for a solo/duo build."
- Matches memlog items 9–10 accurately. Good fidelity.

### Validation/DTOs — Zod vs class-validator (bullet 3)
Addendum: detailed finding with two cited GitHub issues (nestjs/nest#15837, nestjs-zod#184), stated as "Verified via web research (2026-09-01)."
- **Not present in the memlog at all.** The memlog's `status: complete` front matter and its 21 logged entries never touch validation libraries, Zod, or Swagger. This is either genuine research that happened outside/after this brainstorming session (in which case the addendum's placement under "Stack decisions (from brainstorming session, ...)" misattributes its provenance to this memlog) or unsupported content. Flag for verification: where did this research actually happen, and should it be re-labeled as sourced from elsewhere rather than implied to be part of this brainstorm?

### ORM / Drizzle (bullet 4)
Addendum: "Drizzle — confirmed, stays close to raw SQL, no heavy codegen layer to fight during a 2-week build."
- The memlog never revisits Drizzle after the initial user framing (item 1) — there is no decision entry, challenge, or reasoning recorded for it. The addendum presents specific reasoning ("stays close to raw SQL, no heavy codegen") as if it were argued/decided in-session; it wasn't logged. Minor gap: reasoning is plausible but unsourced from this memlog.

### Architecture — hexagonal (addendum section "Architecture: hexagonal, deliberately restricted core")
This is the **major discrepancy**. Addendum states hexagonal architecture (ports & adapters, restricted core) is the adopted approach, and frames it as: "Initially challenged during brainstorming (single DB, single mandated map provider — no obvious swap need) and the team's counter-argument was accepted: a hexagonal boundary means a DB or map-provider swap is adapter-level work..."

The memlog says the opposite:
- Item 6: user explicitly accepts dropping hexagonal architecture.
- Item 8: coach decision — simple layers (controller/service/repo) instead of hexagonal, for the 2-week scope.
- Item 12 (synthesis/insight, the session's own closing summary): "Next.js et l'archi hexagonale **abandonnés** (pas de besoin SSR/SEO, une seule DB/un seul fournisseur carto)."

The memlog never records a "counter-argument being accepted" that reinstates hexagonal — it records the reverse: hexagonal was proposed, challenged, and abandoned in favor of simple layered architecture, with the session ending on that decision. The addendum's narrative ("initially challenged... counter-argument accepted") could be read as describing a later, separate decision (e.g. made during PRD drafting after the sovereignty constraint surfaced) that overturns the brainstorm's conclusion — but if so, the addendum does not say so; it reads as describing the brainstorming session itself, misrepresenting what was actually decided there. Given this file's own stated purpose (capturing provenance accurately), this is a fidelity break, not just a missing detail: it inverts a decision instead of omitting or softening it. If reinstating hexagonal was a genuine, deliberate later call (e.g. justified by Thomas Vignal's sovereignty requirement in `prd.md` §8), the addendum should say explicitly "this reverses the brainstorming session's decision" rather than implying continuity with it.

### Team-size insight (memlog item 12's meta-insight)
The memlog's closing synthesis contains an explicit second-order insight: team size justifies NestJS's structural overhead, but does *not* by itself justify architectural complexity (hexagonal) — these are framed as two distinct axes (human coordination vs. technical/architectural flexibility).
- This insight is **not reflected anywhere in addendum.md**. The backend bullet cites team size only to justify NestJS (consistent with half the insight), but the architecture section never contrasts this against team size, nor states that architectural complexity was judged on a separate axis (need for swappable adapters) rather than headcount. Losing this insight is significant because it's precisely the reasoning that would explain *why* NestJS-with-structure and hexagonal-without-need could reach different verdicts from the same brainstorm — and it's also the detail that would have flagged the architecture-section rewrite above as a reversal rather than a restatement.

## 3. Summary of gaps

1. **Architecture decision inverted.** Memlog: hexagonal architecture explicitly abandoned in favor of simple layers (controller/service/repo), confirmed in the session's own closing synthesis. Addendum: presents hexagonal as adopted, framed as though the brainstorming session itself accepted a counter-argument reinstating it — which the memlog contradicts. If this was a legitimate later reversal (e.g. driven by the sovereignty constraint discovered during PRD work), the addendum doesn't say so and instead misattributes it to the brainstorming session's resolution.
2. **Team-size / architecture-complexity insight dropped entirely.** The memlog's synthesis insight — team size justifies framework structure (NestJS) but is a separate axis from architectural complexity (hexagonal) — appears nowhere in the addendum. This is the exact "why" the task flagged as likely to get lost, and it did.
3. **Zod-vs-class-validator research has no traceable source in this memlog.** The memlog contains zero mentions of Zod, class-validator, or Swagger compatibility. The addendum presents this as sourced "from brainstorming session" content, but it isn't in the session log — either it happened in an undocumented side-channel or the provenance label is wrong.
4. **Drizzle ORM "confirmed" reasoning is unsourced.** The memlog never revisits Drizzle beyond the initial stack framing; the addendum's specific rationale ("stays close to raw SQL, no heavy codegen") isn't backed by any logged decision or discussion.
5. **Leaflet/SSR-hydration detail added to the Next.js-drop reasoning has no memlog basis.** Minor, but same pattern as #3/#4 — plausible-sounding technical detail attributed to this session without a corresponding entry.

No gaps found in: the frontend's core SSR/SEO rationale, and the NestJS/team-size-of-5 rationale — both trace cleanly to the memlog.
