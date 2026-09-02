- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: No CI configuration wires lint/test/build into an automated pipeline on push.
  evidence: Blind-hunter review — nothing currently enforces the scripts beyond manual local runs.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: Listing.status defaults to 'published' at the DB level; Epic 3's write path (Story 3.2) must set it explicitly via domain logic rather than relying on that default once employers can create Listings.
  evidence: Blind-hunter review — a future insert path that omits status would go straight to public/live with no moderation gate.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: Listing.employerName is a bare string; once Epic 3/AD-14's employer_profiles table exists, this should become an employerId FK.
  evidence: Blind-hunter review — will likely force a breaking migration once employer accounts exist.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: listings table has no createdAt/updatedAt columns; Epic 7's lifecycle jobs (auto-archive, lapse) will need listing age.
  evidence: Blind-hunter review — add these columns when Epic 3 Story 3.2 (publish) or Epic 7 first needs them.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: GET /listings has no pagination or geographic bounding-box filtering; risks the NFR1 3-second map-load budget once Epic 7's 500-listing seed dataset lands.
  evidence: Blind-hunter + edge-case review — currently fine with a handful of seed rows, will not scale.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: No rate limiting on the public /listings or /tiles endpoints.
  evidence: Blind-hunter review — both are fully public and unauthenticated; worth a security pass before real deployment.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: docker-compose backend/frontend services have no healthcheck (only db does); Dockerfiles run as root with no USER directive.
  evidence: Blind-hunter review — low risk for a local-only demonstrator, worth a hardening pass before any real deployment.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: CORS is wide open (`cors: true`, any origin) in main.ts; revisit once Epic 2 adds authenticated endpoints.
  evidence: Blind-hunter review — risk is partly mitigated by AD-4's bearer-token-in-header auth (not cookie-based), but deserves a deliberate look once auth ships.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: MapView has no loading state between mount and the /listings fetch resolving.
  evidence: Blind-hunter review — cosmetic, not blocking.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: No accessible/keyboard-driven fallback exists for anonymous map browsing — a purely mouse-driven Leaflet map has no non-visual alternative. Possibly a PRD-level gap (no accessibility/RGAA requirement was captured for a public-sector product) rather than just an implementation detail.
  evidence: Blind-hunter review — flagged prominently for product/PM attention, not just a code fix.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: No marker clustering; plotting every marker individually will get visually unusable as listing volume grows (relevant once Epic 7's 500-listing dataset lands).
  evidence: Blind-hunter review.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-anonymous-map-browsing.md`
  summary: Each Dockerfile copies the other app's package.json purely to satisfy the pnpm workspace install, invalidating the backend image's install-layer cache on unrelated frontend changes (and vice versa).
  evidence: Blind-hunter review — build-time inefficiency, not a correctness issue.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-view-listing-details-without-an-account.md`
  summary: Listing.location has no non-empty/length validation at the DB or DTO level.
  evidence: Blind-hunter review — no write path exists yet in this story (seed-only data), so no user input can currently violate it; revisit once Epic 3's employer-publish flow adds real input.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-view-listing-details-without-an-account.md`
  summary: No guard exists for a future dedicated Listing detail page/route showing an archived/removed listing — today's AC is only incidentally satisfied via the /listings published-only filter feeding the map Popup.
  evidence: Blind-hunter review — relevant if/when a shareable detail URL is built later.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-view-listing-details-without-an-account.md`
  summary: listings.location has no DB index, even though it's a natural future search/filter dimension.
  evidence: Blind-hunter review — not required for this story's read-only scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-consent-gate-before-device-geolocation.md`
  summary: Consent choice is stored with no expiry/versioning — if the notice's wording/purpose ever changes, previously recorded choices are silently honored forever with no re-prompt.
  evidence: Blind-hunter review — relevant once the notice text is finalized/legally reviewed.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-consent-gate-before-device-geolocation.md`
  summary: No UI lets a visitor later change a recorded consent choice (e.g. a privacy/settings control) — only clearing browser storage manually works today.
  evidence: Blind-hunter review — privacy-adjacent, connects to the broader accessibility/non-visual-alternative gap already deferred from Story 1.1.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-consent-gate-before-device-geolocation.md`
  summary: Consent event "logging" is console.info + localStorage only — no backend audit trail with a visitor identifier, since no audit endpoint exists in the architecture yet.
  evidence: Blind-hunter review — the PRD's "auditable (who/when)" language isn't fully met by a client-only record; revisit if a real audit requirement emerges.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-consent-gate-before-device-geolocation.md`
  summary: No literal "manual location/commune search" UI exists on consent decline — the epics AC names this explicitly, but declining currently just leaves the existing pannable/zoomable France-wide map, which the team judged to satisfy "browsing still works" without a dedicated search box.
  evidence: User decision during Story 1.3 review — build the real commune search as its own future story rather than folding it into this consent-gate change.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: No rate limiting/lockout on POST /auth/login or /auth/register — open to credential-stuffing and registration spam.
  evidence: Blind-hunter review — needs a rate-limiting library/middleware decision, not a trivial patch.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: No email verification step — accounts are usable immediately with an unconfirmed address.
  evidence: Blind-hunter review — would need email-sending infra, which the PRD's sovereignty constraint restricts to a self-hosted relay (not built yet).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: No password-reset ("forgot password") flow — a Job Seeker who forgets their password has no way back into their account.
  evidence: Blind-hunter review — same email-infra dependency as email verification.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: No token revocation strategy (24h JWT can't be invalidated early; "logout" is client-side localStorage removal only) and no frontend handling of an expired/invalidated token during an open session (no 401 interceptor).
  evidence: Blind-hunter review — meaningful scope (refresh tokens or a blocklist), revisit once more of the app is behind auth and the exposure is worth the complexity.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: JWT stored in localStorage (readable by any script on the page) rather than an httpOnly cookie — consistent with AD-4's bearer-token-in-header design, but the XSS tradeoff was never explicitly discussed.
  evidence: Blind-hunter review — flagged for awareness, not changed, since it follows the already-adopted architecture decision (AD-4).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: No guard against an already-authenticated user re-submitting /register or /login — they can silently overwrite their stored session with a new one.
  evidence: Blind-hunter review — low impact, minor UX polish.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-job-seeker-account-creation.md`
  summary: RolesGuard (AD-15) is opt-in per route (@UseGuards + @Roles), not registered globally — a future author must remember to add both on a new sensitive route, with no "deny unless explicitly public" default.
  evidence: Blind-hunter review — this matches the architecture spine's stated design (AD-15 describes per-route gating, not a global guard), so changing it would be an architectural decision, not a patch; revisit if Epic 3/5's protected routes reveal this is error-prone in practice.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-professional-profile-management.md`
  summary: job_seeker_profiles.accountId has no onDelete behavior on its FK to accounts.id — deleting an account with a profile will hit a raw FK violation instead of being handled gracefully.
  evidence: Blind-hunter + edge-case review — the real fix belongs with Story 5.4's account-deletion use case (AD-7), which should anonymize/clean up related rows deliberately, not this story guessing at cascade behavior.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-professional-profile-management.md`
  summary: No live test proves JwtAuthGuard + RolesGuard actually compose correctly when stacked on one route.
  evidence: Blind-hunter review — no route in the codebase stacks both guards yet (Story 2.2 uses JwtAuthGuard only, by design); revisit once Epic 3/5 adds the first route that needs both.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-professional-profile-management.md`
  summary: No optimistic-concurrency handling on profile save — two concurrent PUTs (e.g. two open tabs) silently last-write-wins with no staleness warning.
  evidence: Blind-hunter review — low priority for a simple profile form.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-professional-profile-management.md`
  summary: ProfilePage doesn't sync across browser tabs — if auth is cleared in one tab, another open tab keeps using the stale token until its next action fails.
  evidence: Edge-case review — niche, no `storage` event listener wired up.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-catch-interaction-direct-application.md`
  summary: If a Listing or the caller's account is deleted between ApplyToListingUseCase's existence check and the transaction's insert, the FK violation surfaces as a raw unhandled 500 instead of a clean 404/409.
  evidence: Edge-case + blind-hunter review — currently unreachable (no account- or listing-deletion feature exists anywhere yet); revisit once Story 5.4 (account deletion) or a listing-deletion path lands.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-catch-interaction-direct-application.md`
  summary: applications table only has a composite UNIQUE(job_seeker_id, listing_id) index (leading column job_seeker_id); Epic 3's employer-side triage view (Story 3.4) will need to query by listing_id alone, which this index serves poorly.
  evidence: Blind-hunter review — add a secondary index on listing_id when Story 3.4 builds that query.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-catch-interaction-direct-application.md`
  summary: MapView's catch/apply error state shows the same generic "réessayez" (retry) message for every failure, including a 404 (listing no longer exists) where retrying can never succeed.
  evidence: Blind-hunter review — minor UX polish, not incorrect or crash-prone, just not maximally helpful.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-catch-interaction-direct-application.md`
  summary: apps/backend/tsconfig.json excludes **/*.spec.ts from type-checking entirely, so a test file whose mocks fall out of sync with an interface (as happened here with ListingRepositoryPort.findById) compiles and runs "green" with a real type error hiding inside it.
  evidence: Verification-gap review — confirmed via a direct `tsc --noEmit --strict --ignoreConfig` run against the affected spec file, which surfaced two real TS2741 errors invisible to both `tsc --noEmit` (project config) and vitest (esbuild transpile-only, no type-checking).

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-catch-count-badges-permis-de-travail-unlock.md`
  summary: catchCount (both the in-transaction and standalone countByJobSeeker queries) counts every applications row for a Job Seeker unconditionally, with no status filter — if Applications ever gain a withdrawn/cancelled/rejected state, catchCount would silently include them.
  evidence: Blind-hunter review — not reachable today (Epic 3/Story 3.4 hasn't introduced any status transitions yet), but should be revisited exactly when that story lands.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-catch-count-badges-permis-de-travail-unlock.md`
  summary: the "exactly-once" 9th→10th unlock guarantee is proven at the repository/transaction level (real Postgres, real row lock) but not through a full HTTP-request-path (controller/e2e) concurrency test — two real concurrent POST /me/applications requests racing through Nest's request pipeline has never been exercised.
  evidence: Blind-hunter review — the repository-level integration test already exercises the actual locking mechanism, so this is lower-priority hardening, not a known gap in current coverage.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-application-tracking.md`
  summary: findByJobSeekerWithListing uses an innerJoin, so an Application whose Listing row was deleted would silently vanish from "My Applications" instead of showing a placeholder/fallback.
  evidence: Edge-case-hunter review — not reachable today (no Listing-deletion feature exists anywhere in this codebase yet, same precondition as the FK-violation gap already deferred from Story 2.3); revisit if/when a Listing-deletion path lands.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-application-tracking.md`
  summary: "My Applications" doesn't surface whether the applied-to Listing is still published vs. archived/lapsed/removed — a Job Seeker can't tell from this page alone that a listing they applied to is no longer live.
  evidence: Blind-hunter review — legitimate future enhancement; out of this story's stated minimal scope (title/employerName only, no other Listing detail).

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-employer-account-creation-with-verification.md`
  summary: employer_profiles.accountId has no onDelete cascade — same known landmine already deferred for job_seeker_profiles; a future account-deletion feature must delete employer_profiles before accounts or hit a FK violation.
  evidence: Blind-hunter review — not reachable today (no account-deletion feature exists anywhere in this codebase yet); revisit alongside the job_seeker_profiles entry whenever that story lands.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-employer-account-creation-with-verification.md`
  summary: Employer registration (account + employer_profiles + token issuance) is three separate non-transactional writes stitched together with application-level compensating deletes, not a single DB transaction — a process crash between any two steps leaves a permanently orphaned accounts row that nothing will ever clean up. The compensating-delete rollback (fixed during review) covers exception-based failures but not a hard process crash mid-flow.
  evidence: Blind-hunter + verification-gap review — a true db.transaction() fix would require making the account/employer-profile repository ports transaction-aware, a bigger refactor than this story's scope; the compensating-delete pattern already matches this codebase's only prior precedent (Story 2.1's JobSeeker rollback).

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-employer-account-creation-with-verification.md`
  summary: No uniqueness/dedupe check on companyName — two different Employer accounts can register with the identical company name today, with nothing flagging it.
  evidence: Blind-hunter review — legitimate future anti-fraud consideration; out of this story's explicit scope (verification is a manual admin action, Epic 5's job).

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-publish-a-geolocated-listing.md`
  summary: distributionRadiusKm is captured, validated (capped at 10km), and persisted, but nothing anywhere reads it to actually gate who sees a Listing — the public GET /listings endpoint has no viewer-position parameter and returns every published Listing regardless of distance. The AC's own wording ("appears on the public/job-seeker map... within my Distribution Radius") implies this should eventually filter visibility, but this story's own spec never addressed it in Boundaries/Never — a genuine gap in the spec itself, not an implementer deviation.
  evidence: Blind-hunter review, confirmed by re-reading the spec — implementing real distance-based filtering requires the public GET /listings path (Epic 1, already shipped) to accept a viewer position, out of this story's stated file scope. Needs a future story (likely Epic 4's real-time map work) to resolve.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-publish-a-geolocated-listing.md`
  summary: No GET /me/listings (or any way) for an Employer to review/list what they've published — only POST exists.
  evidence: Blind-hunter review — likely Story 3.5's job (its dashboard already needs to show per-Listing view/application counts).

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-publish-a-geolocated-listing.md`
  summary: listings.employerId has no onDelete cascade — same known landmine already deferred for job_seeker_profiles/employer_profiles.
  evidence: Blind-hunter review — not reachable today (no account-deletion feature exists); revisit alongside the other two entries whenever that story lands.
