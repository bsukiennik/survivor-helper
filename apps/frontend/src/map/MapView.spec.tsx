import L from 'leaflet';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredConsent } from './geolocation-consent';
import { MapView } from './MapView';

describe('MapView', () => {
  afterEach(() => {
    // vitest.config.ts has `globals: false`, so @testing-library/react's
    // automatic afterEach(cleanup) registration (which checks for a global
    // `afterEach`) never fires — without this, each test's DOM nodes leak
    // into the next test.
    cleanup();
    vi.unstubAllGlobals();
    try {
      localStorage.clear();
    } catch {
      // Not available in this test environment — nothing to clear.
    }
  });

  function stubGeolocation(
    behavior?: (
      success: PositionCallback,
      error?: PositionErrorCallback,
    ) => void,
  ): { getCurrentPosition: ReturnType<typeof vi.fn> } {
    const geolocation = {
      getCurrentPosition: vi.fn(behavior ?? (() => {})),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: geolocation,
      configurable: true,
    });
    return geolocation;
  }

  function stubWorkingLocalStorage(): void {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  }

  it('renders the map without an account/login prompt, even with zero listings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [],
      })),
    );

    render(<MapView />);

    expect(screen.getByRole('heading', { name: 'GéoEmploi' })).toBeTruthy();
    expect(screen.queryByText(/login/i)).toBeNull();
    expect(screen.queryByText(/connexion/i)).toBeNull();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/listings');
    });
  });

  it('renders a listing marker popup with full detail and a disabled Apply button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: 'listing-1',
            title: 'Boulanger / Boulangère',
            employerName: 'Boulangerie du Marché',
            location: 'Paris',
            description: 'Poste à temps plein.',
            latitude: 48.8566,
            longitude: 2.3522,
            status: 'published',
          },
        ],
      })),
    );

    const { container } = render(<MapView />);

    await waitFor(() => {
      expect(container.querySelector('.leaflet-marker-icon')).toBeTruthy();
    });

    // react-leaflet's Popup only mounts its children once opened — a real
    // Visitor clicks the marker to see the detail (FR2), so the test does too.
    fireEvent.click(container.querySelector('.leaflet-marker-icon')!);

    await waitFor(() => {
      expect(screen.getByText('Boulanger / Boulangère')).toBeTruthy();
    });
    expect(screen.getByText('Boulangerie du Marché')).toBeTruthy();
    expect(screen.getByText('Paris')).toBeTruthy();
    expect(screen.getByText('Poste à temps plein.')).toBeTruthy();

    const applyButton = screen.getByRole('button', { name: /Postuler/i });
    expect(applyButton.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Créez un compte demandeur d'emploi/i)).toBeTruthy();
  });

  it('keeps the map usable and shows a status banner when the listings fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network request failed');
      }),
    );

    render(<MapView />);

    // Map/page must not go blank — heading still renders.
    expect(screen.getByRole('heading', { name: 'GéoEmploi' })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(
        /n'ont pas pu être chargées/,
      );
    });
  });

  it('keeps the map usable and shows a status banner when the listings response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })),
    );

    render(<MapView />);

    expect(screen.getByRole('heading', { name: 'GéoEmploi' })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(
        /n'ont pas pu être chargées/,
      );
    });
  });

  it('shows the consent banner on first visit and never calls geolocation before a choice is made', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const geolocation = stubGeolocation();

    render(<MapView />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('requests device location and hides the banner when consent is accepted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const geolocation = stubGeolocation();

    render(<MapView />);

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('never calls geolocation and hides the banner when consent is declined', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const geolocation = stubGeolocation();

    render(<MapView />);

    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not re-show the banner on a later visit once a choice was already recorded', async () => {
    stubWorkingLocalStorage();
    localStorage.setItem(
      'geoemploi.locationConsent',
      JSON.stringify({ choice: 'declined', timestamp: new Date().toISOString() }),
    );
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const geolocation = stubGeolocation();

    render(<MapView />);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('genuinely persists an accepted choice through the real consent module (not just a UI assertion)', async () => {
    stubWorkingLocalStorage();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    stubGeolocation();

    render(<MapView />);
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(readStoredConsent()?.choice).toBe('accepted');
  });

  it('recenters the Leaflet map on the device position once geolocation succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const setViewSpy = vi.spyOn(L.Map.prototype, 'setView');
    stubGeolocation((success) => {
      success({
        coords: { latitude: 45.75, longitude: 4.85 },
      } as GeolocationPosition);
    });

    render(<MapView />);
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    await waitFor(() => {
      expect(setViewSpy).toHaveBeenCalledWith([45.75, 4.85], 12);
    });

    setViewSpy.mockRestore();
  });

  it('stays on the default view and shows no lingering "locating" status when geolocation fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    stubGeolocation((_success, error) => {
      error?.({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError);
    });

    render(<MapView />);
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    await waitFor(() => {
      expect(screen.queryByText('Localisation en cours…')).toBeNull();
    });
  });
});
