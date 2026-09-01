# Reconciliation: addendum.md vs ARCHITECTURE-SPINE.md

Scope: verify the spine formalizes every load-bearing technical decision the addendum made, without silently dropping or contradicting one. Rationale/history is expected to stay in the addendum only — its absence from the spine is not itself a gap.

## 1. Stack table

| Addendum item | Addendum reasoning (kept there, not restated in spine) | Spine Stack table | Match? |
| --- | --- | --- | --- |
| Vite + React + TS + shadcn/ui + Tailwind | No SSR/SEO need; Leaflet SSR-hydration risk | React 19.2.8, Vite 8.0.9, TypeScript 6.0.3, Tailwind 4.3.3, shadcn/ui (CLI-copied) | Match |
| NestJS | 5-person team, imposed structure pays off at that headcount | NestJS 12.0.1 | Match |
| class-validator / class-transformer, not Zod | No native `@nestjs/swagger` support for Zod; `z.date()` Swagger-generation bug (nest#15837, nestjs-zod#184) | `class-validator / class-transformer — latest matching NestJS 12 peer range` | Name matches. See §4 — the *reason* this choice was made (Swagger/OpenAPI compatibility) has no corresponding architectural anchor anywhere else in the spine. |
| Drizzle | Close to raw SQL, no heavy codegen, fits a 2-week build | Drizzle ORM ~0.44.x | Match |

Also present, not contradicted: PostgreSQL 18.6 self-hosted (consistent with AD-2 sovereignty), WebSocket adapter `@nestjs/websockets` + `ws` (consistent with AD-5, addendum's FR-17 checklist item).

**Verdict: no gap.** Every technology the addendum named is present in the spine's Stack table with a matching, non-contradictory choice. (One indirect issue carried into §4 below: the table names the *what* but the spine never anchors the *why* — OpenAPI/Swagger generation — anywhere, which matters because AD-1/AD-2 are meant to be enforceable and this is the one stack line whose addendum rationale was itself architectural, not just a preference.)

## 2. AD-1 (hexagonal) vs addendum's specific framing

Addendum framing: "the core limited to pure business logic — no framework/infra concerns inside it" + "Two adapters to design first: persistence (DB) and map/tile provider."

Spine AD-1: "domain entities and use-cases live in `domain/` and `application/` (ports only) with zero imports from `infrastructure/` or any framework package. Every concrete DB or map-provider integration lives behind a port in `infrastructure/`, swappable without touching `domain/`."

**Verdict: no gap.** This is a faithful, enforceable restatement — "pure business logic, no framework/infra" → "zero imports from infrastructure/ or any framework package"; "two adapters to design first: persistence and map/tile" → explicitly named as the two adapter types in the rule, and both appear first in the Structural Seed diagram (Persistence Adapter, Mapping Adapter) ahead of the Feed adapter, which the addendum treats as a separate, later concern (FR-17, its own checklist bullet) rather than one of the "first two." The spine's third adapter (Listing Feed, AD-5) does not contradict this — it is additive, sourced from a different addendum item, and correctly kept as a separate AD rather than folded into AD-1.

## 3. Ministry technical deliverable checklist vs spine architecture

| Checklist item | Architectural implication | Spine coverage | Verdict |
| --- | --- | --- | --- |
| OpenAPI 3.0 spec, Swagger UI, generated pre-deploy | Requires DTOs to carry `@nestjs/swagger`-compatible decorators; this is the entire reason class-validator was chosen over Zod | **Not mentioned anywhere.** No AD, no Consistency Conventions row, no mention in Structural Seed's `interfaces/` (DTOs) folder comment. | **Gap.** |
| Per-endpoint request/response examples (`.http`/curl) | Deliverable/process, not structural | — | Not architectural; no gap. |
| DB schema (DBML/image), synced same-day | Deliverable/process; spine already carries an `erDiagram` in Structural Seed | Partially satisfied by the existing ER diagram | Not a gap — the structural artifact exists, sync cadence is process. |
| `.env.example` complete, no secrets | Config convention | Consistency Conventions: "Config: env vars, validated at process boot... must match `.env.example`" | Covered. |
| `/health`: status + version + DB connectivity, <200ms **even if tile provider is down** | Real architectural constraint: the health check must not block on/depend on the Mapping adapter's upstream availability — implies a specific decoupling requirement on the Interfaces layer | **Not mentioned anywhere** — no AD, no component in Structural Seed, no row in Capability → Architecture Map | **Gap.** |
| Zero paid/proprietary third-party dependency, ministry "trusted cloud" exclusions | Sovereignty boundary on adapters | AD-2, verbatim: "no adapter may require an external account to run... `docker compose up` from a fresh clone... is the only bar" | Covered. |
| Fully local run from fresh clone, timed | Same as above | AD-2 + Deployment & environments section | Covered. |
| One-page deployment note | Deliverable, not structural (spine explicitly says the PRD's deployment note is "not something this spine builds") | Deployment & environments section addresses this directly | Covered/correctly scoped out. |
| Server-side tile cache; no direct browser→provider call; no API key in frontend bundle; **hit/miss counters exposed and measured** | The cache mechanics and no-direct-call rule are architectural; the hit/miss counters are an observability requirement tied to the same Mapping adapter that AD-1 calls out as one of the two adapters to design first | No-direct-call rule: covered by AD-3 ("frontend never calls the tile provider directly") and Structural Seed ("cached, server-side only"). **Hit/miss counters: not mentioned anywhere** — no AD, no Consistency Conventions row, no Deferred note. | **Partial gap** — cache placement/no-key-leak is covered; the metrics requirement is not. |
| WS live updates + polling fallback, config-toggled, documented behavioral diff, independent WS kill-switch, dedupe by Listing ID | Architectural | AD-5, fully — port + two adapters, config-selected, "both adapters emit the same event shape," independent kill-switch, client-side dedupe by ID | Covered. |
| Load test (k6/Locust/JMeter), seeded data, report w/ top fix | Deliverable/process, not structural | — | Not architectural; no gap. |

## 4. Zod-vs-class-validator decision: still honored?

The addendum's decision is not contradicted at the stack-choice level — the spine's Stack table does list class-validator/class-transformer, not Zod. In that narrow sense the decision is honored.

However, the addendum's reasoning for the choice was specifically that class-validator "integrates directly with `@nestjs/swagger` via decorators, no wrapper layer," in service of the ministry's OpenAPI/Swagger UI requirement. The spine:
- Never states that OpenAPI/Swagger generation is a requirement the architecture must support.
- Has no Consistency Conventions row for DTO documentation (compare: it does have rows for naming, dates/errors/money, and mutation/config/logging — API-doc generation is absent from that list despite being the ministry's checklist item #1 and the addendum's stated reason for the stack pick).
- Has no mention of the `interfaces/` DTO layer needing to carry Swagger decorators, even though `interfaces/` is named in the Structural Seed tree.

This means the class-validator choice currently reads as an arbitrary stack preference in the spine, disconnected from the one piece of addendum reasoning that made it load-bearing rather than a coin flip. If a future implementer swapped it for a lighter validation library, nothing in the spine (as opposed to the addendum) would flag that as a violation.

**Verdict: honored in name, not structurally anchored.** Recommend either a Consistency Conventions row ("API docs: every `interfaces/` DTO carries `@nestjs/swagger` decorators; spec generated pre-deploy") or folding it into a note under AD-1/AD-3, so the OpenAPI requirement — and therefore the reason Zod was rejected — has an enforceable home in the spine, not just the addendum.

## Summary of real gaps

1. **No `/health` endpoint architectural component.** Ministry-mandated, with a specific constraint (must answer <200ms even when the tile provider/Mapping adapter is down) that has real design implications (the health check must not depend on Mapping adapter availability). Absent from AD list, Structural Seed, and Capability → Architecture Map.
2. **No OpenAPI/Swagger generation requirement anchored in the spine.** This is the explicit, addendum-stated reason class-validator was chosen over Zod, and the ministry checklist's first item — yet no AD or Consistency Conventions row ties DTOs to Swagger-decorator generation. The stack choice is present but structurally unmotivated within the spine itself.
3. **Tile cache hit/miss counters/metrics not covered.** AD-3 and the Structural Seed cover the no-direct-browser-call and server-side-only rules for the Mapping adapter correctly, but the ministry's explicit "hit/miss counters exposed and measured on a second load" requirement — for one of the two adapters AD-1 flags as "design first" — has no home (no AD, no Consistency Conventions row, no Deferred note).

No contradictions were found — every gap is an omission, not a conflict, and the Stack table and AD-1's hexagonal framing both faithfully match the addendum.
