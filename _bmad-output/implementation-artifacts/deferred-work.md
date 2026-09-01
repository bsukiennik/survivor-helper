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
