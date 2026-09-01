/**
 * Auth state for a logged-in account (Story 2.1). Persisted client-side
 * (localStorage, same pattern as `map/geolocation-consent.ts`) and read on
 * boot to reflect logged-in state in the header — bearer token, no session
 * store (AD-4).
 *
 * The email is stored alongside the token (rather than decoded from the
 * JWT, which only carries `sub`/`role` — see
 * `backend/src/infrastructure/auth/jwt-token-issuer.adapter.ts`) since the
 * register/login form already has it at the moment the token is issued.
 */

export interface StoredAuth {
  accessToken: string;
  email: string;
}

const STORAGE_KEY = 'geoemploi.auth';

export function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.email !== 'string') {
      return null;
    }
    return { accessToken: parsed.accessToken, email: parsed.email };
  } catch {
    // Storage unavailable or corrupted — treat as "not logged in".
    return null;
  }
}

export function storeAuth(accessToken: string, email: string): StoredAuth {
  const record: StoredAuth = { accessToken, email };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Private browsing / storage quota — this session's in-memory state
    // still works, it just won't survive a reload.
  }
  return record;
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not available — nothing to clear.
  }
}

/**
 * `fetch` wrapper that attaches the stored bearer token (Story 2.2) — used
 * by any request that hits a `JwtAuthGuard`-gated route (e.g. `/me/profile`).
 * With no stored auth, this is a plain unauthenticated `fetch`; the caller
 * is expected to have already redirected to /login in that case rather than
 * relying on this to reject.
 */
export function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const auth = readStoredAuth();
  const headers = new Headers(init.headers);
  if (auth) {
    headers.set('authorization', `Bearer ${auth.accessToken}`);
  }
  return fetch(url, { ...init, headers });
}
