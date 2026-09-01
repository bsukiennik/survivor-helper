# Epic 1 Context: Public Map Discovery

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Anyone — no account, no login — can open GéoEmploi and immediately see a live, interactive map of geolocated job listings, open a marker to read its public details, and do all of this whether or not they grant device-location access. This is the free-browsing entry point the ministry required, the first thing a visitor experiences, and the map surface every later epic (catch/apply, employer publishing, real-time updates) builds on top of. Device geolocation is gated behind an explicit, auditable consent step so the product meets its privacy obligation from the very first page load, not as a retrofit.

## Stories

- Story 1.1: Anonymous Map Browsing
- Story 1.2: View Listing Details Without an Account
- Story 1.3: Consent Gate Before Device Geolocation

## Requirements & Constraints

- The map and its markers must load and be usable (pan/zoom/select) without any auth token or session — no login prompt blocks the view.
- Time to first usable map render is under 3 seconds on a standard connection (baseline; under 1 second is a stretch goal, not blocking).
- The map must render and remain usable on both mobile and desktop browsers (responsive web, no native app).
- Listing detail view (title, employer name, location, description) is public — visible without authentication.
- An Apply action must not be exposed as functional to unauthenticated visitors; it should be visibly disabled or replaced with a prompt to create an account. Applying itself is out of scope for this epic (built in Epic 2).
- A Listing that is archived or removed must never appear reachable as an open, applyable listing (e.g. via a stale link), even before moderation/lifecycle features (Epics 3/5) exist to produce that state.
- Before any browser geolocation API call fires, the user must see a clear, accessible notice (what is collected, why, how long retained) and give explicit consent — this is a legal/privacy obligation, not a negotiable UX preference, and is not weakened by street-level location precision being used elsewhere in the product.
- Declining or not yet giving consent must never block browsing: the map falls back to manual location/commune search, with no dead end.
- Consent decisions are auditable (who/when logged) and not re-asked on every page load within the same session/account.

## Technical Decisions

- Frontend is a pure client-side-rendered SPA (Vite + React + TypeScript, no SSR) that talks to the backend only via the documented REST API; it never calls the map tile provider directly and never embeds a tile-provider API key — all tile requests go through the backend's server-side Mapping adapter/proxy.
- Map tiles are sourced from OpenStreetMap (or an equivalent open dataset) via that backend proxy, consistent with the project's zero-paid-third-party-service constraint.
- `Listing.status` is a single shared enum (`published | archived | lapsed | removed`); only listings with `status = 'published'` should ever be treated as visible/open on the public map or reachable in detail view — this convention is defined for the whole project, not invented per-epic.
- Frontend module for this epic lives under `apps/frontend/src/map/` (public map, marker interaction).
- UI must consume the shared design-token module for charter colors/typography rather than hardcoding styles, and render the product name from the single i18n/strings source — both are project-wide structural conventions, not epic-1-specific work.

## Cross-Story Dependencies

- Story 1.1 (map browsing) depends on Story 1.3 (consent gate): the map must load and remain usable via manual location/commune search whenever geolocation consent hasn't been granted or was declined — there is no scenario where the map is blocked pending a consent decision.
- Story 1.2 (listing detail) depends on the `Listing.status` convention that Epics 3 (archival) and 5 (moderation) later populate — this epic only needs to respect that a listing can be non-open and exclude it, not implement the transitions themselves.
- Story 1.2's "Apply" placeholder is a forward dependency on Epic 2 (Job Seeker identity/catch), which implements the real apply flow this epic only stubs out.
