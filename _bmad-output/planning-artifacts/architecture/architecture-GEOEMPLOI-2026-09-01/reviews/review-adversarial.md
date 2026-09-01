# Adversarial Review — ARCHITECTURE-SPINE.md (GéoEmploi)

**Reviewer stance:** attack the spine as an adversary. For each finding below, two units one level down (epics/stories a 5-person team would split across people) are constructed. Each unit is checked line-by-line against every AD and Consistency Convention it touches. Each obeys the letter of every rule that binds it. Built independently — as a 2-week, 5-person demonstrator schedule forces — they do not fit together.

**Verdict: not safe to fan out as-is.** Five real incompatible pairs found, one structural (identity model) severe enough to break FK integrity across nearly every table in the ER diagram. The spine needs 3–4 tightened/new ADs before parallel build starts.

---

## Finding 1 (severe) — Unified `accounts` table vs. three separate ER-diagram entities

**The two units:**
- **Unit A — Job Seeker registration & catch flow (FR-1–FR-9).** Builder reads the ER diagram literally: `JobSeeker ||--o{ Application`, `JobSeeker ||--o{ Report`. Builds a standalone `job_seekers` table (UUIDv4 PK per the Naming convention), its own credential columns, and `ApplyToListing`'s `UNIQUE(job_seeker_id, listing_id)` constraint (AD-6's exact wording) against `job_seekers.id`.
- **Unit B — Auth, JWT issuance, and account governance (AD-4, AD-13, FR-20).** Builder reads AD-4 ("the backend issues and verifies its own JWTs") and AD-13 ("every account, including Administrator accounts, is created through the same registration/governance use case") and concludes there must be one identity surface to authenticate against. Builds a single `accounts` table (`id`, `email`, `password_hash`, `role: 'job_seeker'|'employer'|'admin'`) as the one path AD-13 demands, and mints JWTs with `sub = accounts.id`.

**Why both are AD-compliant:** AD-13's text never says whether "the same registration/governance use case" implies one physical table or three parallel per-type tables funneled through shared logic — both readings satisfy "one path, no direct insert." AD-4 never states what the JWT's subject/claims are keyed to. The ER diagram (a structural seed, not an AD) models three separate entities, which is exactly what Unit A takes as its schema contract.

**The clash:** `Application.job_seeker_id`, `Listing.employer_id`, `Report.reviewed_by` (Administrator) all target Unit A's per-type tables; Unit B's JWT `sub` and every `@CurrentUser()` guard resolve against `accounts.id`. There is no FK path from `accounts.id` to `job_seekers.id` because nothing in the spine required Unit A to keep one — a controller built against Unit B's auth guard cannot look up the JobSeeker row AD-6's `ApplyToListing` needs, and RGPD erasure (AD-7's single `DeleteAccount` use case) doesn't know whether "the account" is one row or up to two (an `accounts` row plus a `job_seekers` row) that must be deleted/anonymized together.

**AD to close it:** a tightened AD-13 (or new AD) pinning the identity model explicitly — e.g. "one `accounts` table is the sole identity/credential/JWT-subject surface; `JobSeeker`/`Employer`/`Administrator` are 1:1 profile extension tables keyed on `accounts.id`, never separate credential stores" — and updating AD-6's constraint text and the ER diagram to reference the resolved FK target.

---

## Finding 2 — Listing Feed: two adapters, no canonical event DTO

**The two units:**
- **Unit A — WebSocket adapter (default, AD-5).** Emits `{ listingId: string, type: 'created'|'updated'|'removed', payload: Listing }`.
- **Unit B — Polling adapter (AD-5's required fallback).** Emits `{ id: string, action: string, listing: Listing }`.

**Why both are AD-compliant:** AD-5 requires "both adapters emit the same event shape" — a constraint on parity between the two adapters, not a reference to any pinned schema. If one person builds both adapters, parity is trivially self-enforced; split across two people (a reasonable 5-person-team, 2-week split — WS is the "default," Polling is explicitly called out as the mandatory fallback, a natural two-ticket cut), each independently invents a shape that is internally consistent with itself but not with the other's.

**The clash:** the frontend's dedup-by-ID logic (AD-5's other requirement — "the client dedupes incoming Listings by ID regardless of active adapter") reads a different field name depending on which adapter is active (`listingId` vs `id`), and the env-var adapter switch (also AD-5) becomes a runtime schema switch, not just a transport switch — defeating AD-5's stated purpose of adapter interchangeability.

**AD to close it:** tighten AD-5 with a concrete, spine-owned `ListingFeedEvent` DTO shape (field names and the event-type enum), stated once, that both adapters must serialize to — not just "the same shape as each other."

---

## Finding 3 — Listing status vocabulary: moderation vs. lifecycle scheduled job

**The two units:**
- **Unit A — Moderation & Reporting (FR-18/19, AD-12).** AD-12's rule: "removing a Listing via moderation sets a status field (e.g. `removed`)." Builder implements `listings.status: 'active' | 'removed'` (boolean-flavored enum, moderation's only two states).
- **Unit B — Listing lifecycle: auto-archival (FR-12, 30 days) and post-lapse removal (FR-24, 7 days).** The Consistency Convention's rule: a scheduled job "mutates state at a determinate point." Builder needs a third and fourth state the moderation enum never anticipated — implements `listings.status: 'published' | 'archived' | 'lapsed'` on the same column (no `removed` value, since FR-24's capability-map note says lifecycle removal is merely "AD-12-**style**," not AD-12 itself, so Unit B doesn't feel bound to reuse Unit A's exact vocabulary).

**Why both are AD-compliant:** AD-12 literally says "e.g. `removed`" — an example, not a pinned enum — and binds only FR-18/19. The Time-bound lifecycle convention specifies *when* mutation happens, not *what value* it writes. Neither text requires the two units to share one enum on `listings.status`.

**The clash:** one column, two independently-invented value sets (`active`/`removed` vs `published`/`archived`/`lapsed`) written by two different use cases (`ModerateListing` and the scheduled job) with no shared type. Depending on merge order, one migration's `CHECK` constraint or Postgres enum type rejects the other's writes, or (if left as free-text) the map-discovery filter ("show only active listings," FR-1-family) silently mishandles whichever vocabulary its builder didn't know about.

**AD to close it:** define the full `ListingStatus` enum once in the spine (all values across moderation + lifecycle: e.g. `published | archived | removed | lapsed`) and state which use cases may transition which values — closing both AD-12's "e.g." and the lifecycle convention's silence on vocabulary.

---

## Finding 4 — Application mutation on Listing removal: two owners, no assigned writer

**The two units:**
- **Unit A — Employer application management & dashboard (FR-14–FR-16).** Reads Applications joined live against `listings.status` to show "still active" vs. "listing removed" — treats `Application` rows as immutable after `ApplyToListing` creates them (a literal reading of AD-6: "a single `ApplyToListing` use case ... is the only path that creates an Application" — creation, not later mutation, so this unit never writes to Application post-creation).
- **Unit B — Moderation (FR-18/19, AD-12).** `ModerateListing` runs in the domain layer (satisfying the Consistency Convention that "all persistence mutation goes through the domain/service layer") and, to make the removal visible without a join, denormalizes an `application.listing_removed_at` timestamp onto every affected Application row when a Listing is removed.

**Why both are AD-compliant:** AD-6 governs *creation* of Applications, not who may update them later — it says nothing about a second writer. AD-12 governs the Listing row ("never hard-deleted") and is silent on whether related Applications may or must be touched. Both units independently interpolate a reasonable, AD-consistent answer to a question the spine never assigns an owner for.

**The clash:** Unit B writes to an `Application` column (`listing_removed_at`) that Unit A's schema, queries, and DTOs never expect to exist or be written by anything other than `ApplyToListing`'s single-transaction path — a direct violation of Unit A's mental model of AD-6 ("no controller, adapter, or client input can bypass it") even though `ModerateListing` is domain-layer code, not a controller. One dashboard's "candidature" list silently drifts from the other unit's data source of truth for "is this listing still live."

**AD to close it:** extend AD-6 (or add a new AD) to state explicitly which use cases besides `ApplyToListing` may write to `Application` rows post-creation, and require moderation-triggered status changes to be read via a join on `Listing.status` (per Finding 3's resolved enum) rather than a denormalized field on `Application` — one designated read path, one designated writer.

---

## Finding 5 — FR-24 "removal" read as literal hard delete vs. AD-12's audit-trail intent

**The two units:**
- **Unit A — Moderation (FR-18/19).** Builds `ModerateListing` per AD-12's explicit text: soft-delete only, Applications preserved.
- **Unit B — Subscription lapse → removal scheduled job (FR-24).** AD-12 is scoped ("**Binds:** FR-18, FR-19") — it does not bind FR-24. The capability map's note that FR-24 is merely "AD-12-**style**" is a hint in a non-normative table, not a rule. Builder takes FR-24's own word, "removal," at face value and hard-deletes the Listing row (and cascades to its Applications via a FK `ON DELETE CASCADE`, the default a fast 2-week build reaches for) once the 7-day post-lapse window closes — nothing in an AD actually forbids it for this specific FR.

**Why both are AD-compliant:** AD-12's binding list is explicit text, and explicit text excludes FR-24. Unit B can point to the letter of AD-12 to argue it was never bound by the soft-delete rule at all.

**The clash:** Application/audit history for any listing that lapses is destroyed, contradicting the whole point AD-12 exists for ("Prevents: a moderation action that cascades away Application history or breaks the audit trail") — the intent clearly should cover FR-24 too, but the binding scope as written lets a literal-minded builder route around it, and a national-metrics dashboard (FR-22) built against Unit A's assumption ("Applications are never hard-deleted, ever") gets wrong historical counts for any listing that ever lapsed.

**AD to close it:** widen AD-12's `Binds` to include FR-24 explicitly (promote the capability map's "AD-12-style" hint into the AD's own binding line), removing any literal-scope loophole.

---

## Summary of recommended AD changes

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Identity: unified accounts vs. 3 ER entities | New/tightened AD-13: pin `accounts` as sole credential/JWT-subject table; role tables are 1:1 extensions keyed on `accounts.id` |
| 2 | Listing Feed event shape unpinned | Tighten AD-5: define the literal `ListingFeedEvent` DTO once, shared by both adapters |
| 3 | Listing status vocabulary split | Tighten AD-12 + lifecycle convention: one `ListingStatus` enum, one table of who may write which transition |
| 4 | Application mutation ownership after removal | Extend AD-6: name every use case allowed to write to `Application` post-creation; mandate join-based reads over denormalization |
| 5 | FR-24 hard-delete loophole | Widen AD-12's `Binds` to explicitly include FR-24 |
