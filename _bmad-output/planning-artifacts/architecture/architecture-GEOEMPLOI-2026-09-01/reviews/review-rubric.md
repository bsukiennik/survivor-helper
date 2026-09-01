# Good-Spine Checklist Review — ARCHITECTURE-SPINE.md (GéoEmploi)

Reviewed: `_bmad-output/planning-artifacts/architecture/architecture-GEOEMPLOI-2026-09-01/ARCHITECTURE-SPINE.md`
Altitude: feature · Paradigm: hexagonal · Prior state: one reconciliation-and-fix round already completed against `prd.md` + `addendum.md` (see `reconcile-prd.md`, `reconcile-addendum.md` in the parent folder — their documented gaps, e.g. missing `/health` component, missing OpenAPI anchor, missing tile-cache metrics, AD-7 over-scoping, are confirmed **fixed** in the current draft via AD-9, AD-10, AD-11, AD-12, AD-13 and the corrected Capability Map).

This is a fresh, independent pass against the good-spine checklist, not a re-check of the prior reconciliation's own findings.

## Gate Verdict

**CONDITIONAL PASS** — the spine's core hexagonal structure, sovereignty boundary, and most invariants are sound and well-matched to the PRD, but two High-severity gaps (a completely silent authorization/RBAC dimension, and an under-specified concurrency guarantee inside AD-6) must be closed before a 5-person team starts building FR-6/FR-9 and the moderation/governance surfaces in parallel — both are exactly the kind of thing that would let two independently-built units diverge incompatibly.

## Findings by Severity

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 2 |
| Medium | 2 |
| Low | 3 |
| **Total** | **7** |

## Checklist Walkthrough

| Checklist dimension | Verdict |
| --- | --- |
| Fixes the real divergence points for the level below, misses none | Mostly — two dimensions are silent (see F1, F2) |
| Every AD's Rule is enforceable and actually prevents its stated divergence | 12 of 13 hold up; AD-6 does not fully prevent the race it names (see F1) |
| Nothing under Deferred could let two units diverge | Mostly — one Deferred item interacts unclearly with AD-13 (see F5) |
| Named tech is verified-current | Yes, to an unusually high standard — see below |
| Ratifies rather than contradicts a brownfield codebase | N/A — confirmed greenfield (no `apps/` tree exists yet) |
| If a spec drove it, it covers that spec's capabilities | N/A — no SPEC kernel in this project; PRD is the direct source and is fully covered (all FR-1..FR-26 appear in the Capability → Architecture Map) |
| If a parent spine is inherited, no new AD weakens/contradicts it | N/A — `companions: []`, no parent spine |
| Every dimension the altitude owns is decided, deferred, or an open question, incl. the operational/environmental envelope | Deployment/environment is explicitly decided (single local Docker Compose environment, correctly scoped against the PRD's separate hypothetical production note). Authorization/access-control is a dimension left completely silent (F2) — this is the checklist's named failure mode. |

### Tech currency (verified via web search against current — Sept 2026 — releases)

React 19.2.8, Tailwind CSS 4.3.3, and PostgreSQL 18.6 are each the exact current-latest published version. NestJS 12.0.1 is current-latest. TypeScript's stated non-adoption of 7.0.2 in favor of 6.0.3 is not staleness — it's a considered, correctly-reasoned choice (7.0 is the new Go-native compiler; the deferred rationale about the decorator/NestJS ecosystem catching up is accurate). Drizzle `~0.44.x` and Vite `8.0.9` are real, valid, pre-1.0/current-major versions but trail the very latest published patch (0.45.2 and 8.2.2 respectively) — see F7, a low-severity note, not a defect in the spine's technical judgment.

## Findings

### F1 — HIGH — AD-6's Rule does not fully prevent the race it names

**AD-6** (`ARCHITECTURE-SPINE.md` lines 62–66) states its Rule as: run `ApplyToListing` in one transaction, check-or-create under the `UNIQUE(job_seeker_id, listing_id)` constraint, then "recompute the authoritative catch count from persisted Applications" and evaluate thresholds. It claims this **prevents** "a race on the 9th→10th catch double-firing or skipping the Permis de Travail unlock."

The UNIQUE constraint genuinely prevents duplicate Applications for the *same* (JobSeeker, Listing) pair — that half of AD-6 is solid. But the count-race scenario AD-6 also claims to prevent is a **different** race: a JobSeeker with 8 existing catches applies to two *different* Listings concurrently (e.g., two open tabs). Neither insert conflicts with the UNIQUE constraint. Under Postgres's default READ COMMITTED isolation, each transaction's "recompute the count" step sees only what's already committed as of that statement — so both transactions can independently compute count = 9 (their own new row + the prior 8, without seeing each other's concurrently-committing row), and the 10th-catch threshold is never crossed by either evaluation even though the JobSeeker now legitimately has 10 Applications post-commit. This is precisely the "skipping the Permis de Travail unlock" failure AD-6's `Prevents` line names.

Closing this requires the Rule to specify a locking/isolation strategy the current text doesn't mention — e.g., `SELECT ... FOR UPDATE` on the JobSeeker row (or an application-count column) before recomputing, or `SERIALIZABLE` isolation with retry-on-conflict. Without that, two developers implementing "one transaction, recompute the count" independently can produce different, both-plausible, both-wrong behavior under concurrency — which is exactly the divergence AD-6 exists to close off.

**Recommendation:** extend AD-6's Rule with an explicit locking directive, e.g.: "the recompute step takes a row lock on the JobSeeker (`SELECT ... FOR UPDATE`) before counting, serializing concurrent `ApplyToListing` calls for the same JobSeeker across any Listings."

### F2 — HIGH — Authorization/RBAC is a completely silent dimension

The spine defines four actors with sharply different permissions — Anonymous, JobSeeker, Employer, Administrator — and the PRD is explicit that Administrator-only actions (moderation, account governance, national metrics) and Employer-only actions (publish/manage Listings) must have **no bypass** ("No special administrative access outside the standard governance workflow, for any party" — `prd.md` line 304; "Single role in v1 (no sub-roles)" — `prd.md` line 77).

AD-4 covers *authentication* only (JWT issuance/verification). Nothing in the spine — no AD, no Consistency Convention row, no Capability Map cell — states how *authorization* is structured: where role checks live (interface-layer guard vs. inline check inside a use case vs. both), how they're expressed (a decorator + guard pattern vs. ad hoc `if (user.role !== ...)`), or that every Administrator/Employer-only endpoint must run through the same mechanism. AD-13 is adjacent but distinct — it governs how *accounts are provisioned*, not how *requests are authorized* at runtime.

This is a "whole dimension left silent" in the sense the checklist calls out by name: five developers building the moderation, governance, employer-dashboard, and metrics surfaces in parallel, with no stated authorization pattern, will very plausibly enforce role checks at different layers with different completeness — the classic incomplete-mediation outcome, and a real exposure for a government demonstrator that will be scrutinized.

**Recommendation:** add an AD (or extend AD-4) stating the authorization mechanism — e.g., "every Administrator/Employer-only route is gated by a `RolesGuard` at the `interfaces/` layer, driven by a `@Roles()` decorator; no use case trusts a role claim that hasn't passed through this guard" — and add a Capability Map / Consistency Conventions row so it's visible alongside AD-13.

### F3 — MEDIUM — NestJS 12's toolchain fork (ESM/Vitest/oxlint vs CJS/Jest/ESLint) is unaddressed

Verified via web search: NestJS 12 (pinned in the Stack table as 12.0.1, correctly the current release) ships a real fork at project-init time — the `nest new` CLI now **prompts** each developer to choose a CJS or ESM project, and an ESM choice pulls in Vitest and oxlint by default in place of Jest and ESLint, while CJS projects keep the old toolchain. This is an active per-scaffold choice, not a silent default, which raises rather than lowers the odds that five people scaffolding in the same week land on different answers.

The spine's Stack table pins the framework version but is silent on which fork the project takes, and the Consistency Conventions table (which does cover naming, dates/errors/money, mutation/config/logging, and lifecycle transitions) has no row for test runner or lint tooling. For a 2-week build this is a coordination cost, not a correctness risk, but it is a concrete, currently-real fork point this spine is silent on.

**Recommendation:** add one line to the Stack table or Consistency Conventions: which module system (CJS or ESM) `apps/backend` uses, and the corresponding test runner/linter.

### F4 — MEDIUM — FR-22 National Metrics has "no invariant," but the underlying terms are undefined

The Capability Map row for FR-22 reads "none — read-only aggregation, no invariant at this altitude." That's a defensible call for the query mechanics themselves, but the PRD's own FR-22 language ("active accounts (by type), Listings published, Applications submitted" — `prd.md` line 273) uses terms — "active account," in particular — that are exactly the kind of thing this spine elsewhere treats as needing a determinate, non-ambiguous definition (see the Time-bound Lifecycle convention distinguishing "mutate state" from "compute at query-time"). A subscription-lapsed-but-not-yet-removed Employer (FR-24's 7-day window), or a soft-deleted-via-moderation Listing (AD-12), are both live rows in the DB with an ambiguous "active" status. Without a shared definition or a shared read-model, the metrics dashboard and the FR-24 lapse-handling logic can silently disagree about what counts as active — visible to the ministry, in a highly-scrutinized capability.

**Recommendation:** either state that FR-22's aggregation reuses the same status fields/definitions AD-12 and the lifecycle convention already establish (no new invariant needed, just a cross-reference), or explicitly flag "active" as an open question if the PRD doesn't pin it down.

### F5 — LOW — Deferred "Employer verification exact mechanism" interacts unclearly with AD-13

The Deferred section calls Employer verification "an implementation detail within FR-10's existing PRD-level assumption, not an architectural boundary." That's fine standing alone, but AD-13's Rule is absolute ("every account... created through the same registration/governance use case. No other code path may insert an account row directly"). If verification gates whether an Employer account becomes usable, it's not obvious from the spine whether that gate lives *inside* the single registration use case (consistent with AD-13) or as a bolt-on step outside it (a second path that could drift from AD-13's guarantee). This is a minor ambiguity, not a contradiction — worth one clarifying sentence.

### F6 — LOW — Structural rules rely on manual review with no stated check

AD-1 (zero imports from `infrastructure/` into `domain/`/`application/`), AD-8 (all components consume design tokens, no ad hoc definitions), and AD-10 (every DTO carries Swagger decorators) are each individually verifiable by inspection, but the spine doesn't say how they get checked in practice (a lint/dependency-boundary rule vs. PR review only). For a 5-person/2-week build where review bandwidth is thin, this is worth one line, not a structural fix.

### F7 — LOW — Two Stack entries trail the latest published patch

Verified via web search: Vite is pinned at 8.0.9 against a current latest of 8.2.2, and Drizzle ORM at `~0.44.x` against a current latest pre-1.0 of 0.45.2. Both pinned versions are real and valid (not fabricated or wrong-major), so this isn't a currency defect in the technical judgment — just a minor, easily-updated patch-lag worth a glance before the team's first `npm install`.

## Non-Findings (checked, confirmed sound)

- AD-2's sovereignty boundary is a clean, literally-testable bar (`docker compose up` from a fresh clone, no external account) and matches the PRD's five named exclusions exactly.
- AD-5 (Listing Feed) fully covers FR-17's three structural/testable consequences (config-switchable, independent WS kill-switch, ID-based dedupe).
- AD-9 (`/health` never touches the Mapping adapter) and AD-11 (Mapping adapter hit/miss counters) correctly close the two Observability gaps the prior reconciliation round flagged.
- AD-12 (moderation soft-delete) and the corrected Capability Map now scope AD-7 to FR-21 only, resolving the prior round's AD-7 over-scoping finding.
- The Deployment & environments paragraph explicitly decides the operational envelope for this engagement (single local Docker Compose environment) and correctly scopes out the PRD's separate hypothetical-production memo — this dimension is not silent.
- Deferred items (Redis tile cache, socket.io swap, TypeScript 7, production-scale topology, full graphic charter, multi-node scaling, transactional email) are each genuinely non-architectural for v1 and correctly point back to the same port/AD rather than opening a new fork.
