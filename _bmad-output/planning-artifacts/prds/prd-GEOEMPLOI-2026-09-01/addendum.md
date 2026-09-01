# Addendum: GéoEmploi — Technical & Provenance Notes

Depth captured during PRD discovery that belongs downstream (architecture, solution design) or explains a decision's provenance, but doesn't belong in the PRD's product narrative. Not authoritative on scope — `prd.md` is.

## Stack decisions (from the brainstorming session, unless noted otherwise)

*Session: `_bmad-output/brainstorming/brainstorm-geoemploi-stack-architecture-2026-09-01/`*

- **Frontend:** Vite + React + TypeScript + shadcn/ui + Tailwind. Next.js was considered and dropped — no SSR/SEO need for this product, and Leaflet's SSR incompatibility (hydration issues) was a real risk against a tight deadline.
- **Backend:** NestJS, confirmed specifically because the delivery team is 5 people — the framework's imposed structure (modules/DI) pays for itself at that headcount; it would not have been the call for a solo/duo build.
- **Validation/DTOs:** `class-validator` + `class-transformer`, not Zod. *(Researched during PRD Discovery, 2026-09-01 — not part of the original brainstorming session, which never discussed Zod.)* Zod has no native `@nestjs/swagger` support (requires a third-party wrapper — `nestjs-zod` or `@anatine/zod-nestjs`) and a known unresolved bug where `z.date()` fields crash Swagger generation ("Date cannot be represented in JSON Schema"). `class-validator` integrates directly with `@nestjs/swagger` via decorators, no wrapper layer. Sources: [nestjs/nest#15837](https://github.com/nestjs/nest/issues/15837), [nestjs-zod#184](https://github.com/BenLorantfy/nestjs-zod/issues/184).
- **ORM:** Drizzle — kept from the original stack proposal on the reasoning that it stays close to raw SQL with no heavy codegen layer to fight during a 2-week build.

## Architecture: hexagonal, deliberately restricted core — a decision that reversed mid-stream

- Ports & adapters, with the core limited to pure business logic — no framework/infra concerns inside it. **This is the current, adopted decision** — but its history matters for whoever revisits it, because it reversed once already:
- **The brainstorming session's own closing synthesis dropped hexagonal**, in favor of simple layers (controller/service/repo). Its reasoning: team size (5 people) justifies NestJS's imposed structure, but that's a *separate axis* from architectural complexity — being 5 people doesn't create a need for swappable adapters when there's one DB and one ministry-mandated map provider. That was the session's actual conclusion, not a stepping stone to hexagonal.
- **During PRD Discovery, the user reopened this and reversed it**, with a different argument than the one brainstorming had rejected: a genuine port/adapter boundary keeps a future DB or map-provider swap to adapter-level work, not a backend rewrite — argued from resilience/testability, not team coordination. That argument is what this PRD is actually built on.
- This reversal is now reinforced by Thomas Vignal's sovereignty constraint (`prd.md` §8) — DB and map-tile adapters specifically need to support a local/self-hosted swap, which is exactly the kind of change a real port/adapter boundary is for. That reinforcement arrived *after* the reversal and wasn't the original reason for it — worth knowing if this decision is ever revisited a third time.
- Two adapters to design first: persistence (DB) and map/tile provider (including the server-side tile cache, `prd.md` §7 Observability).
- **Insight carried forward from brainstorming:** the session's closing synthesis drew a distinction worth keeping visible — team size justifies framework structure (NestJS) but not architectural complexity (hexagonal), because they answer two different needs (human coordination vs. technical flexibility). The team-size argument still holds for NestJS; it doesn't, on its own, hold for hexagonal, which is justified separately by the sovereignty/adapter-swap argument above.

## Ministry technical deliverable checklist (from Thomas Vignal's email, verbatim requirements consolidated)

Tracked here as an implementation checklist; the product-facing obligations are in `prd.md` §7–8.

- [ ] OpenAPI 3.0 spec, Swagger UI live, generated pre-deployment
- [ ] Every endpoint: real request/response example, backed by a committed `.http` file or curl script
- [ ] DB schema (DBML or image): logical model, cardinalities, indexes — delivered Friday 17:00, kept in sync same-day on any column change
- [ ] `.env.example` complete; no secret in the repo, including history
- [ ] `/health`: app status + deployed version + DB connectivity, <200ms even if the tile provider is down
- [ ] Zero paid/proprietary-account third-party dependency (no managed DB, no managed object storage, no commercial map API, no commercial auth, no commercial email) — the ministry's "trusted cloud" doctrine names AWS, GCP, and Azure explicitly as excluded
- [ ] Fully local run from a fresh clone using only the repo's own instructions; timed by a team member who did NOT write the install steps (not an outsider) — the measured time itself, not a pass/fail, is what gets reported back to Thomas
- [ ] One-page deployment note: production hosting shape, resources needed, data leaving the infra and to whom
- [ ] Server-side tile cache; no direct browser→provider call, no API key in the frontend bundle; hit/miss counters exposed and measured on a second load of the same view
- [ ] WebSocket live updates with polling fallback, toggled by config (not code), documented behavioral diff between modes; WS can also be killed entirely by config (independent of the fallback), and delivery dedupes by Listing ID across any mode switch/reconnect
- [ ] Load test (k6/Locust/JMeter): 50 concurrent users, 3 minutes, map + listing-list endpoints, DB seeded with ≥500 listings across ≥50 communes; deliverables are the script itself plus a report with median/p95 response time, error rate, and the top fix **and why** — honest bad numbers beat a polished graph; due before next week's technical review

## Naming

- **GéoEmploi** is the system's name of record (Thomas's email header, the original legal reference JEB/DNI/2026-001). **ChomageGo** is Minister JEB's internal codename for the gamification concept — it drives the presentation layer (`prd.md` §4.3) but is not a legal rebrand.

## Provenance: reconciling the two briefs

The "ChomageGo" source document is the original Florine Pontaillac brief, with strikethrough edits and margin annotations from Minister JEB layered on top. Where JEB's annotations conflicted with either (a) Florine's original legal-toned requirements or (b) Thomas Vignal's separately-sent, explicitly non-negotiable technical constraints, the PRD resolved in favor of (a)/(b) and logged the reasoning inline (see `prd.md` §5, §8, §9, and Open Questions). Specific reversals: real payment processing dropped (violates sovereignty), a personal admin backdoor for the minister dropped (violates account governance), the GDPR consent notice kept despite JEB waving it off (legal, not negotiable), true device-camera AR dropped in favor of a gamified map layer (out of scope, and the source document itself permits a simulated version for Week 1).

One of JEB's annotations instructed the reader to visit `security.microsoft.com/quarantine` and release/allowlist a mail sender. This was not acted on during this session and is called out in `prd.md` §8 as a process flag, not a product requirement — route it through the team's own IT/security judgment.

The ChomageGo document's closing PS reads: "if Florine contacts you with 'additional requirements,' you can listen out of politeness but the real spec is THIS document." This PRD does the opposite on every point that matters — Florine's and Thomas's requirements are treated as authoritative throughout (§5, §8, §9). That's a deliberate, direct response to this PS, not an oversight: legal/compliance obligations (GDPR consent) and a separately-sent technical advisor's non-negotiable constraints (sovereignty, API docs, load testing) don't get overridden by an internal memo, regardless of who signs it or what it says about who to listen to.

## Reviewer Gate resolution (2026-09-01)

A rubric + adversarial + edge-case pass ran against `prd.md`/`addendum.md`. Findings and full detail are preserved in `review-rubric.md`, `review-adversarial.md`, `review-edge-case.md` in this same folder. Seven load-bearing findings were fixed directly in `prd.md` (FR-23 consent gate, FR-5/FR-7 catch-integrity guards, explicit sovereignty checklist in §7, FR-21 deletion/retention rewrite, FR-24 subscription-lapse removal, FR-17 WebSocket kill-switch + dedupe). One finding (30-day archival transition edge cases — in-flight Applications, Employer triage access post-archive, no renewal path) was reviewed and deliberately left unaddressed per user direction; revisit if it becomes a real support burden.

## Seed data: one dataset, two deliverables

Thomas's load test (§7: ≥500 Listings across ≥50 communes) and Benjamin's promotional video (§6.1 Week 1: realistic seed data, no placeholders) both need a populated, credible dataset. Build one seed dataset and reuse it for both rather than building two.
