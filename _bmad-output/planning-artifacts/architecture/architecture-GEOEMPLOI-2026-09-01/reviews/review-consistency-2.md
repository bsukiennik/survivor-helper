# Consistency Review 2 — ARCHITECTURE-SPINE.md (post fix-pass)

**Scope:** internal consistency only (AD-14 vs AD-4/AD-6/AD-13, AD-12 status enum propagation, AD-15 vs AD-13, any other contradiction the fix pass may have introduced). Not re-relitigating whether the fixes were the right call.

**Verdict: FAIL — 2 clear internal contradictions, 1 unresolved gap worth flagging.**

---

## Finding 1 (contradiction) — ERD still carries a leftover pre-AD-14 Listing relationship

Lines 174–185 (erDiagram):

```
Account ||--o{ Listing : publishes
...
EmployerProfile ||--o{ Listing : owns
```

AD-14 unifies identity into `accounts`, with `job_seeker_profiles`/`employer_profiles` as role-specific *satellite* tables FK'd to `accounts.id`. AD-6 was correctly updated to match this: `job_seeker_id` on `Application` references `accounts.id`, not a `JobSeeker`/profile table (line 66, 114). Listing was not given the same treatment.

The ERD now draws **two independent FK relationships into the same `Listing` entity**: one from `Account` ("publishes") and one from `EmployerProfile` ("owns"). Nothing else in the doc has this doubled pattern — `Report` has exactly one relationship each for "files" and "reviews", both from `Account` (lines 179–180), consistent with AD-14. The `Listing` case reads as the pre-AD-14 model (where `Listing` FK'd directly to a separate `Employer` table) left half-migrated: the new `Account → Listing` edge was added to match AD-14, but the old `EmployerProfile → Listing` edge wasn't removed or reconciled. As written, it's ambiguous (and structurally redundant) which column is Listing's actual owning FK — `employer_id → accounts.id` (the AD-6-consistent pattern) or `employer_profile_id → employer_profiles.id`.

**Fix suggestion:** drop one of the two edges. Given AD-6 already established "role-specific FK columns point at `accounts.id`," the natural fix is to delete `EmployerProfile ||--o{ Listing : owns` and keep only `Account ||--o{ Listing : publishes`, keeping `EmployerProfile ||--|| SubscriptionTier : holds` (the one relationship that legitimately belongs on the profile table, not the account).

## Finding 2 (contradiction) — AD-5's event-shape enum does not actually match AD-12's `Listing.status` enum

Line 60:

> Both adapters emit the identical canonical shape `{ listingId: string, eventType: 'created' | 'archived' | 'lapsed' | 'removed', listing: ListingSummaryDto }` (`eventType` values match `Listing.status`, AD-12).

AD-12 (line 102) defines `Listing.status` as exactly: `published | archived | lapsed | removed`.

Comparing the two sets:

| AD-5 `eventType` | AD-12 `Listing.status` |
| --- | --- |
| `created` | — (no such status value) |
| — | `published` (no corresponding eventType) |
| `archived` | `archived` |
| `lapsed` | `lapsed` |
| `removed` | `removed` |

Three of four values line up; `created` vs. `published` do not. The parenthetical explicitly claims they match AD-12 — they don't. This looks like exactly the kind of drift AD-12 was written to prevent ("two independently-invented status vocabularies for the same column"), just reintroduced at the event layer instead of the DB layer.

**Fix suggestion:** rename `'created'` to `'published'` in the `eventType` union (a newly-published Listing's status is `published`, and a fresh listing entering the feed for the first time is exactly that transition), then the parenthetical becomes true and no separate note is needed.

## Finding 3 (gap, not a strict text contradiction) — AD-15 vs AD-13: no duplication, but an unaddressed admin-bootstrap tension

AD-13 (lines 104–108) and AD-15 (lines 116–120) govern different concerns — account *provisioning* vs. route *authorization* — and their rule text doesn't duplicate or override each other. No conflict in what each AD asserts.

However, read together they leave a gap the doc doesn't resolve: AD-13 says *every* account, including the first Administrator, must go through the single governed registration/governance use case, and forbids any other code path inserting an account row ("no admin backdoor"). AD-15 says every Administrator-only route is gated by `RolesGuard`, requiring an already-authenticated Administrator. If creating an Administrator account is itself reached via an Administrator-only route (the natural reading of "governance use case" for a privileged role), there's no path to create the *first* Administrator without either (a) a seed/manual DB insert — which AD-13 explicitly bans — or (b) an unguarded admin-creation endpoint, which would undercut AD-15's blanket "every Administrator-only route is gated" framing and AD-13's "no admin backdoor" intent simultaneously.

This isn't a contradiction between the two ADs' literal text, but it is a hole neither AD closes, and it sits exactly at their intersection. Flagging it since it's precisely the kind of seam the two invariants were pointed at (AD-13: "prevents ... quietly creating a pre-elevated account outside the governed workflow"). Worth either a one-line resolution in AD-13 (e.g., "the first Administrator account is provisioned by a one-time bootstrap step in the same use case, gated by [X], not a backdoor insert") or an explicit note deferring the mechanism, the way employer-verification mechanism is already deferred.

## Other checks performed, no issues found

- **AD-14 vs AD-4:** JWT `sub` = `accounts.id` (line 54) — consistent, correctly cross-referenced.
- **AD-14 vs AD-6:** `job_seeker_id` FK and the row-lock target both correctly point at `accounts` (lines 65–66) — consistent.
- **AD-14 vs AD-13:** provisioning rule correctly names `accounts` table and cross-references AD-14 (line 108) — consistent.
- **No leftover separate `JobSeeker`/`Employer`/`Administrator` *table* references** in the source tree (lines 189–205), Structural Seed prose, or Capability Map — these only ever appear as role/glossary terms or directory names (`frontend/seeker`, `frontend/employer`, `frontend/admin`), not as DB tables, so they don't contradict AD-14.
- **Minor, non-blocking observation:** the Naming Convention row (line 126) still lists domain-entity glossary terms as "JobSeeker, Employer, Administrator" without mentioning `Account`/`JobSeekerProfile`/`EmployerProfile`, the entities AD-14 actually introduces at the persistence layer. Not a contradiction (glossary terms are arguably role concepts, distinct from table/entity names), but it's the same seam that produced Finding 1, and tightening it would remove the ambiguity at the root rather than just in the ERD.
- **Listing status elsewhere:** Time-bound lifecycle convention (line 129), "Active" definitions convention (line 130), and the Capability Map's FR-24 row (line 217) all use `archived`/`lapsed`/`removed`/`published` correctly per AD-12 — only AD-5 (Finding 2) drifted.
- **AD-15 binds range vs Capability Map:** FR ranges cross-checked (AD-15: FR-10–16, FR-19–22; Capability Map rows for 4.4–4.7, 4.9, 4.10, 4.11) — consistent; FR-18 (filing a report, presumably public) and FR-17/23/24/25/26 being outside AD-15's range is coherent with them being non-admin/non-employer routes.
- Stack table, Deferred section, AD-1/2/3/7/8/9/10/11 — no interaction with the AD-14/AD-12/AD-15 changes, nothing to flag.
