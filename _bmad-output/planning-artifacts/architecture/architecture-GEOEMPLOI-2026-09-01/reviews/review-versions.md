---
name: 'Version & Reality-Check Review — GéoEmploi Architecture Spine'
type: review
target: architecture-GEOEMPLOI-2026-09-01/ARCHITECTURE-SPINE.md
reviewed: '2026-09-01'
mandate: 'Verify every committed decision was web-researched or reality-checked rather than asserted from training data: current library/framework versions, that each named technology still exists and fits, and — greenfield — the live defaults of any starter it leans on. Flag anything that could be out of date and wasn't confirmed against the web, the existing project, or the current starter.'
---

# Review: Stack Version Accuracy — GéoEmploi Architecture Spine

**Scope note:** greenfield, hand-assembled stack, no starter template — the starter-defaults leg of the mandate does not apply. All findings below come from independent web searches run today (2026-09-01), not from training-data recall.

## Verdict

**Mostly reality-checked, one entry now stale, one deliberately-conservative decision independently confirmed correct.** Four of six pinned versions (React, Tailwind, NestJS, PostgreSQL) match the current npm/release-channel latest exactly — strong evidence they were actually looked up, not guessed. One (Vite) is stale by two minor releases. One (Drizzle) is stale on both its version band and its own stated rationale (calls the pre-1.0 line "beta" when it's now RC). The TypeScript 6.0.3-over-7.0.2 call is the one that most needed outside verification given how confidently-argued and unusual it is — and it holds up: independent search confirms TypeScript 7 currently breaks the NestJS CLI's build/start commands, which is a materially worse problem than the spine's own stated reasoning ("ecosystem risk," vaguely) suggests. Named technologies (shadcn/ui, class-validator/class-transformer, `ws`, socket.io, Docker Compose) all still exist, are actively maintained, and fit their stated purpose.

## Findings

### 1. Vite 8.0.9 — stale, two minor releases behind (Low severity)
Spine pins Vite `8.0.9`. Current npm latest as of 2026-09-01 is **8.2.2** (Vite 8.0.0 shipped 2026-03-12; 8 has since moved through 8.1 and into 8.2). `8.0.9` is a real, valid patch release, so this isn't fabricated — but it reads as a version that was correct at some earlier drafting point and not re-checked before being committed today. Same major, low blast radius, but it should be bumped to `~8.2.x` or reworded to "latest 8.x" to avoid the same drift recurring silently.

### 2. Drizzle ORM "~0.44.x ... do not adopt the 1.0.0-beta line" — stale on both axes (Medium severity)
Two problems with this entry:
- **Version band is behind:** current latest pre-1.0 stable is **0.45.2**, not 0.44.x. The spine's own "latest pre-1.0 stable" qualifier is therefore already false against today's registry.
- **"beta" mischaracterizes where 1.0 actually is:** Drizzle's 1.0 line reached **release-candidate** status in May 2026 (`1.0.0-rc.4`), not beta. Calling it "the 1.0.0-beta line" suggests it's further from shipping than it is. Given this is a greenfield project, the team should know 1.0 stable could plausibly land mid-engagement, which has real implications (breaking-change risk if drift happens uncontrolled, or an argument to just target 1.0 from day one if timing allows). This reads as asserted-from-memory rather than checked at commit time; recommend updating to `~0.45.x` and re-verifying 1.0's actual release status closer to implementation start.

### 3. TypeScript 6.0.3 vs 7.0.2 — the flagged decision holds up, and the real justification is stronger than what's written (worth strengthening, not changing)
This is the entry most likely to be an asserted-from-training-data judgment call, so it got the deepest check. Findings:
- TypeScript 7.0.2 is confirmed current/GA (shipped 2026-07-08) and 6.0.3 is confirmed the correct final patch of the 6.0 line (2026-04-16; 6.x now only takes security patches, per Microsoft's own messaging — no 6.1 exists or is coming).
- The spine's stated reasoning ("NestJS/decorator ecosystem risk") is vague but **directionally correct and actually understates the problem**: independent sources (GitHub `nestjs/nest-cli#3479`, `nestjs/nest#17277`) confirm that with TypeScript 7.0.2, **the NestJS CLI's build and start commands fail outright** — `nest build`, `nest start`, `nest start --watch` all break because TS7's npm package no longer exports the programmatic Compiler API the Nest CLI calls into. This isn't a stylistic decorator-syntax nuance, it's a hard "your dev loop doesn't run" blocker.
- Decorator *emission* itself (the `__decorate`/`__metadata`/`__param` helpers that `reflect-metadata` and Nest's DI container actually consume) does work under TS7's Go-native compiler as of March 2026 — so the risk is specifically in tooling/CLI integration, not in decorator semantics per se.
- NestJS has published no official position or timeline on TypeScript 7 / `tsgo` support as of this review.
- **Conclusion: the spine's TS version choice is correct and, if anything, under-argued relative to the evidence.** Recommend strengthening the Stack-note/Deferred wording from "NestJS/decorator ecosystem risk" to something like "the NestJS CLI cannot currently build or start a project under TypeScript 7.0.2 (its Compiler API is not exported); revisit once NestJS ships explicit `tsgo`/TS7 CLI support" — this is a more falsifiable, re-checkable trigger for the Deferred item than the current phrasing.

### 4. Confirmed accurate as pinned (no action needed)
- **React 19.2.8** — matches current npm latest exactly.
- **Tailwind CSS 4.3.3** — matches current npm latest exactly.
- **NestJS 12.0.1** — matches current npm latest exactly (`@nestjs/core`, published within days of this review).
- **PostgreSQL 18.6** — matches current release exactly (released 2026-08-13).

These four being exact-current is itself evidence the versions were pulled from a live source at drafting time rather than recalled — worth noting as a positive signal, in contrast to findings #1–2.

### 5. Named technologies — still current and fit their stated purpose
- **shadcn/ui**: actively developed (CLI v4 shipped March 2026, frequent releases since); the spine correctly treats it as unversioned CLI-copied source rather than an npm dependency, which matches how the project actually distributes it. No pin needed, none given — consistent.
- **class-validator / class-transformer**: still actively used and documented for NestJS validation in 2026, not deprecated. One nuance worth flagging for awareness (not a version error): NestJS 12 ships a first-class `StandardSchemaValidationPipe` alternative (Zod/Valibot/ArkType) alongside — not instead of — `ValidationPipe`. class-validator keeps working, so AD-10 (OpenAPI generated from class-validator + `@nestjs/swagger` decorators) is unaffected, but the spine's "latest matching NestJS 12 peer range" phrasing should be understood as "the supported legacy path," not "the only path" — a minor context gap, not a version accuracy problem.
- **`ws`**: actively maintained, latest 8.21.3, 50M+ weekly downloads — fits its stated role as the raw adapter behind `@nestjs/websockets`.
- **socket.io** (Deferred assumption: "drop-in swap behind AD-5's port"): confirmed still actively maintained (latest 4.8.3, healthy release cadence, ~15M weekly downloads) — the swap-in assumption remains technically sound, this was correctly left as a self-flagged assumption rather than a hard claim.
- **Docker Compose**: the spine's `docker compose up` (no hyphen) matches the currently correct invocation — Compose v1 (hyphenated `docker-compose`) has been deprecated since 2023/2024, and v2 (the plugin form the spine assumes) is what ships built into Docker Engine/Desktop today. This detail being right is a small but real signal the spine wasn't drafted from stale training-data habits (which often still say `docker-compose`).

## Summary Table

| Pinned item | Spine value | Verified current value | Status |
| --- | --- | --- | --- |
| React | 19.2.8 | 19.2.8 | Match |
| Vite | 8.0.9 | 8.2.2 | **Stale — update** |
| TypeScript | 6.0.3 (vs 7.0.2 deferred) | 6.0.3 is correct final 6.x patch; 7.0.2 is correct GA | Match; reasoning **confirmed correct**, recommend sharpening the stated justification |
| Tailwind CSS | 4.3.3 | 4.3.3 | Match |
| NestJS | 12.0.1 | 12.0.1 | Match |
| Drizzle ORM | ~0.44.x, "1.0.0-beta line" | 0.45.2 stable; 1.0.0-**rc.4** (not beta) | **Stale — update version band and "beta" wording** |
| PostgreSQL | 18.6 | 18.6 | Match |
| shadcn/ui | unversioned | actively maintained | OK as-is |
| class-validator/class-transformer | "latest matching NestJS 12 peer range" | still current, not deprecated | OK, minor context nuance noted |
| ws | unversioned | 8.21.3, actively maintained | OK as-is |
| socket.io (assumption) | — | 4.8.3, actively maintained | Assumption holds |
| Docker Compose | v2 syntax assumed | v2 is current standard | OK as-is |
