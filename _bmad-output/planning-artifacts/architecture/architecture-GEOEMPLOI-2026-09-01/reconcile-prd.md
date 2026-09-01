# PRD ↔ Architecture Spine Reconciliation — GéoEmploi

Scope: verify the spine (`ARCHITECTURE-SPINE.md`) fixes every real structural invariant implied by the PRD (`prd.md`), and does not contradict or silently drop any PRD constraint. Per the task framing: most FRs having no direct spine mention is expected and **not** a gap — only flagging (a) an implied architectural boundary the spine's AD list/Stack/Structural Seed/Capability Map doesn't cover at all, (b) a spine section that contradicts or silently ignores a PRD §7/§8 constraint, or (c) a "why" stated differently between the two documents.

## Targeted checks (as requested)

### 1. AD-2 (sovereignty) vs PRD §8 — full coverage?

PRD §8 Sovereignty/Cost: "no managed database, no managed object storage, no commercial mapping API, no commercial authentication provider, no commercial email service" + named exclusion of AWS/GCP/Azure + local-clone/`docker compose up`/no-external-account acceptance test + one-page deployment note as a separate deliverable.

AD-2's `Prevents` line enumerates: "managed DB, managed object storage, commercial map/auth/email API, AWS/GCP/Azure." That's a literal 1:1 match on the five named exclusions plus the three clouds. AD-2's `Rule` ("no adapter may require an external account to run... `docker compose up` from a fresh clone... is the only bar") matches the PRD's acceptance-test framing (though the PRD's *timed, second-person-clones* acceptance-test detail is a process/deliverable item, correctly left out of an architecture doc).

**Verdict: AD-2's text covers every named sovereignty item.** The gap is not in AD-2's wording — it's that nothing in the Stack/Structural Seed/Capability Map actually *instantiates* a self-hosted answer for "commercial email service," despite the PRD elsewhere implying email-sending is part of the product (see Gap 1 below). AD-2 states the constraint correctly; it just has no adapter to bind it to for email.

### 2. AD-5 (Listing Feed) vs FR-17 exact requirements

| FR-17 / NFR-Reliability requirement | AD-5 coverage |
| --- | --- |
| WebSocket default, polling fallback switchable by **config, not code change** | ✅ "selected by an environment variable — never a code change" |
| WS delivery can be **disabled entirely** (operator kill-switch, independent of fallback) | ✅ "WebSocket delivery can additionally be disabled entirely by config" |
| Dedup by Listing ID on **any mode switch or client reconnect** | ✅ "The client dedupes incoming Listings by ID regardless of active adapter" |
| Team **must document every behavioral difference** between the two modes | ⚠️ Not mentioned anywhere in AD-5 or Deferred. This is arguably a deliverable/documentation obligation rather than a structural invariant two builders could diverge on incompatibly — noted, but not counted as a headline gap. |

**Verdict: AD-5 matches FR-17's three testable/structural consequences precisely.** Only the documentation-deliverable clause is unaddressed, and that's process, not architecture.

### 3. AD-6 (catch integrity) vs FR-5/FR-7 exact consequences

| FR-5/FR-7 requirement | AD-6 coverage |
| --- | --- |
| Uniqueness: at most one Application per (JobSeeker, Listing) | ✅ `UNIQUE(job_seeker_id, listing_id)` DB constraint |
| Atomic evaluation (no double-fire/skip on 9th→10th catch race) | ✅ "runs in one transaction" |
| Catch count computed server-side from persisted Applications, never client-supplied | ✅ "recompute the authoritative catch count from persisted Applications... No controller, adapter, or client input can bypass it or supply a catch count directly" |
| Audit log (Job Seeker, Listing, timestamp) per Catch/Application event | ✅ present, but not in AD-6 itself — it's in the Consistency Conventions table ("every Catch/Application-creation event logs job-seeker id, listing id, timestamp (AD-6, audit trail)") |

**Verdict: fully covered**, audit log requirement satisfied via a cross-reference from the Consistency Conventions table rather than AD-6's own text — acceptable, not a gap.

### 4. Deployment & environments note vs PRD's deployment note

Spine: "single environment for this engagement — fully local via Docker Compose... No cloud, staging, or production environment is provisioned; the PRD's one-page deployment note (`prd.md` §8) separately describes the hypothetical production shape for the ministry, and is not something this spine builds."

This correctly identifies the PRD §8 one-page deployment note as a separate, non-architectural deliverable (a ministry-facing memo about a hypothetical future production shape) rather than something the spine needs to design against. **No contradiction, no gap.**

### 5. PRD §7 Observability — does it need an architectural home the spine lacks?

PRD §7 Observability requires:
- `/health` reports app status, deployed version, DB connectivity, responding **under 200ms including when the map tile provider is unresponsive**.
- Tile requests server-side proxied/cached; **cache hit/miss counts exposed and measured explicitly on a second load of the same view**.
- Catch/Application audit logging (already covered — see check 3).

The spine has **no Health/Metrics component, port, or convention anywhere** — not in the Structural Seed diagram, not in the Capability → Architecture Map, not in Consistency Conventions. This is a real gap; see Gap 2 below.

## Gaps found

### Gap 1 — No architectural home for transactional email / self-hosted notification delivery

AD-2 forbids "commercial email service" (correctly, per PRD §8). But FR-26 explicitly names "transactional emails" as a user-facing surface requiring graphic-charter compliance checks ("Charter compliance is explicitly checked... on: login screen, 404 and 500 error pages, empty states, loading states, **transactional emails**, favicon, browser tab title, and any PDF export" — FR-26 consequence list). That only makes sense if the product actually sends transactional emails (account verification, password reset, etc. — FR-3/FR-10 only specify "email/password or equivalent" for account creation, leaving the email-verification question open, but FR-26 presupposes emails exist to charter-check).

The Stack table, Structural Seed diagram, and Capability → Architecture Map contain **zero mention** of an email adapter, an `EmailPort`, or a self-hosted SMTP mechanism (e.g., a Docker Compose mail-catcher/relay container, consistent with the all-local sovereignty requirement). FR-13's in-app-not-email decision is explicit and doesn't need this — but nothing generalizes that decision to the rest of the product, and FR-26 implies at least one email-shaped surface exists elsewhere.

This is a genuine fork point: one builder could wire in a commercial ESP to satisfy FR-26's testable surface (violating AD-2), another could build zero email capability at all (leaving FR-26's "transactional emails" charter-check row permanently un-checkable), and a third could add a self-hosted SMTP container the spine never anticipated (no port to standardize behind, so it wouldn't be swappable the way AD-1 requires for every other integration).

### Gap 2 — No architectural home for `/health`'s tile-provider-latency guarantee or tile cache hit/miss metrics

PRD §7 requires `/health` to answer in <200ms **even when the tile provider is unresponsive**, and requires tile cache hit/miss counts to be "exposed and measured explicitly." Neither requirement has a component: there's no Health/Metrics module in the Structural Seed, no port in `application/`, and no Capability Map row for Observability.

This matters structurally, not just cosmetically: satisfying "<200ms including when the tile provider is unresponsive" requires `/health` to *not* synchronously depend on the Mapping adapter (or to depend on it with a hard timeout/circuit breaker) — a decision that belongs at the same altitude as AD-3/AD-5's other adapter-boundary decisions. Left unstated, one builder could wire `/health` to ping the tile provider inline (silently violating the NFR under provider outage), another could hardcode `/health` to ignore DB/tile status entirely (violating the "reports... database connectivity" requirement). Likewise, "cache hit/miss counts exposed" has no defined mechanism (log line vs. counter endpoint vs. admin-only stat) for two builders to converge on.

### Gap 3 — Capability Map cites AD-7 as governing FR-18–FR-22 and FR-24, but AD-7's rule only covers FR-21

The Capability → Architecture Map row reads: `4.9–4.11 Moderation, governance, national metrics (FR-18–FR-22, FR-24) | frontend/admin + backend domain ModerateListing/DeleteAccount use-cases | AD-7`.

But AD-7's actual `Binds`/`Rule` text is scoped explicitly and only to FR-21 ("RGPD erasure is one domain use case... **Binds:** FR-21... account deletion goes through a single `DeleteAccount` use case"). It says nothing about:
- moderation-action integrity (FR-18/FR-19 — is `ModerateListing` similarly required to be the single path for listing removal, the way `ApplyToListing`/`DeleteAccount` are for their domains?),
- account governance (FR-20's "no elevated-privilege account created outside the governed workflow" invariant — explicitly called out in the PRD as a Discovery decision, "no admin backdoor for the Minister"),
- national metrics aggregation (FR-22),
- or FR-24's specific temporal invariant (the 7-day countdown must start at the lapse *notification*, not the original payment due date — a detail a builder could easily get wrong without a stated rule, since it's the kind of "two independently-built units could diverge incompatibly" case the spine exists to prevent).

A builder reading only the Capability Map would believe these are architecturally settled under AD-7; they are not. Either AD-7 needs broadening (e.g., renamed to a general "governance use-cases are single-entry-point" rule covering `DeleteAccount`, `ModerateListing`, and a lapse-handling use case alike), or a new AD is needed for moderation/governance/lapse integrity, mirroring AD-6's pattern for catch integrity.

### Gap 4 (minor, related to Gap 3) — No architectural home for the scheduled/background nature of FR-12 and FR-24

FR-12 (30-day auto-archival) and FR-24 (7-day-post-lapse removal) both require time-triggered state changes with no user action initiating them. Nothing in the Stack, Structural Seed, or ADs mentions a scheduler/cron/worker component, nor states whether archival/removal is a background-mutated flag (needed for FR-24's audit/notification trail and for admin visibility of *why* a listing disappeared) versus a query-time computed filter (which would silently satisfy FR-12's "no longer appears on the map" wording but break FR-24's "notifies the Employer... removed... 7 days after notice" sequencing, which needs a real triggered event). This is a smaller fork point than Gaps 1–3 but sits in the same family — flagged for completeness rather than as a headline item.

## Non-gaps (checked, found consistent)

- AD-4's unilateral choice of self-issued JWT over PRD §7's "JWT or server-side session" — this is the spine correctly making the structural choice the PRD left open, with its own consistent rationale (avoids third-party auth per AD-2, avoids stateful session infra). Not a "why" contradiction.
- AD-3's frontend-never-touches-tile-provider-directly rule matches PRD §7 Observability's "browser never calls the tile provider directly, and no tile-provider API key is ever present in the frontend bundle" verbatim.
- Money-as-integer-cents convention matches PRD §9 Monetization's simulated-billing/no-float implication (not stated in PRD directly, but not contradicted either).
- Structural Seed / Deferred sections's treatment of scaling ("must support gradual scaling" NFR) as a code-level, not deployment-level, concern for v1 is a defensible altitude call, consistent with §7's own "independent of the specific production concurrency target, which remains open" framing.
