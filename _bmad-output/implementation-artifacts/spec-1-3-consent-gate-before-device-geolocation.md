---
title: 'Consent Gate Before Device Geolocation'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
context: []
route: 'one-shot'
---

# Consent Gate Before Device Geolocation

## Intent

**Problem:** The map has centered on a fixed France-wide default since Story 1.1, deliberately not requesting the visitor's device location. FR23 requires a clear, accessible notice with explicit accept/decline before any `navigator.geolocation` call fires.

**Approach:** A `ConsentBanner` shown on first visit, gating a `navigator.geolocation.getCurrentPosition` call behind Accept; the choice persists to `localStorage` so it isn't re-asked. `[ASSUMPTION, confirmed with the human during review]`: declining leaves the existing pannable/zoomable France-wide map as the fallback — the epics AC's literal "manual location/commune search" is treated as a separate future feature, not built here; tracked in `deferred-work.md`.

## Suggested Review Order

**Consent gate & persistence**

- Consent module — read/write, defensive against unavailable/throwing `localStorage`.
  [`geolocation-consent.ts:19`](../../apps/frontend/src/map/geolocation-consent.ts#L19)
  [`geolocation-consent.ts:36`](../../apps/frontend/src/map/geolocation-consent.ts#L36)

- Banner — accessible dialog (`aria-modal`, `aria-describedby`), focus moved to it on mount.
  [`ConsentBanner.tsx:23`](../../apps/frontend/src/map/ConsentBanner.tsx#L23)

**Geolocation request lifecycle**

- Gate + request, with an unmount guard (`isMountedRef`) so a slow/unresolved `getCurrentPosition` never sets state after unmount, and `maximumAge` so a stale cached fix isn't silently used.
  [`MapView.tsx:83`](../../apps/frontend/src/map/MapView.tsx#L83)
  [`MapView.tsx:95`](../../apps/frontend/src/map/MapView.tsx#L95)

- Leaflet gotcha: the banner/loading text resize the map's container in normal flex flow, so `invalidateSize()` runs on every layout change or the map can render with blank tile regions.
  [`MapView.tsx:68`](../../apps/frontend/src/map/MapView.tsx#L68)

**Tests**

- Real recenter assertion (spies on `L.Map.prototype.setView`) rather than only checking `getCurrentPosition` was called.
  [`MapView.spec.tsx`](../../apps/frontend/src/map/MapView.spec.tsx)

- Consent module's error/malformed-storage branches, tested in isolation.
  [`geolocation-consent.spec.ts`](../../apps/frontend/src/map/geolocation-consent.spec.ts)
