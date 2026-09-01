/**
 * Consent state for requesting the visitor's device location (FR23).
 * Persisted client-side (localStorage) — this project has no backend audit
 * endpoint for anonymous consent events yet, so "auditable, independent of
 * account creation" is satisfied by the stored, timestamped record plus a
 * console log; a server-side trail is a defer item if a real audit
 * requirement shows up later.
 */

export type ConsentChoice = 'accepted' | 'declined';

export interface StoredConsent {
  choice: ConsentChoice;
  timestamp: string;
}

const STORAGE_KEY = 'geoemploi.locationConsent';

export function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.choice !== 'accepted' && parsed.choice !== 'declined') {
      return null;
    }
    return { choice: parsed.choice, timestamp: parsed.timestamp ?? '' };
  } catch {
    // Storage unavailable or corrupted — treat as "not yet asked".
    return null;
  }
}

export function recordConsent(choice: ConsentChoice): StoredConsent {
  const record: StoredConsent = { choice, timestamp: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Private browsing / storage quota — this session's in-memory choice
    // still works, it just won't survive a reload.
  }
  // eslint-disable-next-line no-console
  console.info(`[consent] location consent ${choice} recorded at ${record.timestamp}`);
  return record;
}
