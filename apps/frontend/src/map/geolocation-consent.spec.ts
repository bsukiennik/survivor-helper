import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredConsent, recordConsent } from './geolocation-consent';

// `localStorage` is unreliable in this happy-dom/Node test environment (see
// the "ExperimentalWarning" at test-run startup) — stub a minimal working
// implementation rather than relying on the real global.
function stubLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

describe('geolocation-consent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when nothing has been stored yet', () => {
    stubLocalStorage();
    expect(readStoredConsent()).toBeNull();
  });

  it('round-trips an accepted choice through localStorage', () => {
    stubLocalStorage();
    recordConsent('accepted');
    expect(readStoredConsent()?.choice).toBe('accepted');
  });

  it('round-trips a declined choice through localStorage', () => {
    stubLocalStorage();
    recordConsent('declined');
    expect(readStoredConsent()?.choice).toBe('declined');
  });

  it('treats malformed JSON in storage as "not yet asked"', () => {
    stubLocalStorage();
    localStorage.setItem('geoemploi.locationConsent', 'not json{');
    expect(readStoredConsent()).toBeNull();
  });

  it('treats an unexpected stored choice value as "not yet asked"', () => {
    stubLocalStorage();
    localStorage.setItem(
      'geoemploi.locationConsent',
      JSON.stringify({ choice: 'maybe', timestamp: 'x' }),
    );
    expect(readStoredConsent()).toBeNull();
  });

  it('does not throw when localStorage.getItem itself throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage disabled');
      },
    });
    expect(readStoredConsent()).toBeNull();
  });

  it('does not throw when localStorage.setItem itself throws (still returns the record)', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota exceeded');
      },
    });
    const result = recordConsent('accepted');
    expect(result.choice).toBe('accepted');
  });
});
