import L from 'leaflet';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { readStoredAuth } from '../seeker/auth-token';
import { readStoredConsent } from './geolocation-consent';
import { MapView } from './MapView';

// MapView now renders react-router's <Link> (Story 2.1), which needs a
// router context even when MapView itself isn't route-matched in a test.
function renderMapView(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <MapView />
    </MemoryRouter>,
  );
}

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

    renderMapView();

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

    const { container } = renderMapView();

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

    renderMapView();

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

    renderMapView();

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

    renderMapView();

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('requests device location and hides the banner when consent is accepted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const geolocation = stubGeolocation();

    renderMapView();

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('never calls geolocation and hides the banner when consent is declined', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const geolocation = stubGeolocation();

    renderMapView();

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

    renderMapView();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('genuinely persists an accepted choice through the real consent module (not just a UI assertion)', async () => {
    stubWorkingLocalStorage();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    stubGeolocation();

    renderMapView();
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

    renderMapView();
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

    renderMapView();
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    await waitFor(() => {
      expect(screen.queryByText('Localisation en cours…')).toBeNull();
    });
  });

  it('shows a "Se connecter" link to /login when no account is logged in', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));

    renderMapView();

    const link = screen.getByRole('link', { name: 'Se connecter' });
    expect(link.getAttribute('href')).toBe('/login');
    expect(screen.queryByText('Se déconnecter')).toBeNull();
  });

  it('shows the account email and a working logout button when an account is logged in', () => {
    stubWorkingLocalStorage();
    localStorage.setItem(
      'geoemploi.auth',
      JSON.stringify({ accessToken: 'token-abc', email: 'a@b.com' }),
    );
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));

    renderMapView();

    expect(screen.getByText('a@b.com')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Se connecter' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));

    expect(screen.getByRole('link', { name: 'Se connecter' })).toBeTruthy();
    expect(readStoredAuth()).toBeNull();
  });

  const LISTING = {
    id: 'listing-1',
    title: 'Boulanger / Boulangère',
    employerName: 'Boulangerie du Marché',
    location: 'Paris',
    description: 'Poste à temps plein.',
    latitude: 48.8566,
    longitude: 2.3522,
    status: 'published',
  };

  function stubAuthenticatedFetch(
    applyResponse: () => { ok: boolean; status?: number; json: () => Promise<unknown> },
  ): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === 'http://localhost:3000/listings') {
        return { ok: true, json: async () => [LISTING] };
      }
      if (url === 'http://localhost:3000/me/applications' && init?.method === 'POST') {
        return applyResponse();
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  async function renderWithLoggedInAccountAndOpenPopup(
    fetchMock: ReturnType<typeof vi.fn>,
  ): Promise<HTMLElement> {
    stubWorkingLocalStorage();
    localStorage.setItem(
      'geoemploi.auth',
      JSON.stringify({ accessToken: 'token-abc', email: 'a@b.com' }),
    );

    const { container } = renderMapView();

    await waitFor(() => {
      expect(container.querySelector('.leaflet-marker-icon')).toBeTruthy();
    });
    fireEvent.click(container.querySelector('.leaflet-marker-icon')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Catch/i })).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/listings');
    return container;
  }

  it('shows working Postuler and Catch buttons (not the disabled stub) when logged in', async () => {
    const fetchMock = stubAuthenticatedFetch(() => ({
      ok: true,
      status: 201,
      json: async () => ({ id: 'app-1', listingId: 'listing-1', alreadyApplied: false }),
    }));

    await renderWithLoggedInAccountAndOpenPopup(fetchMock);

    const applyButton = screen.getByRole('button', { name: 'Postuler' });
    const catchButton = screen.getByRole('button', { name: /Catch/i });
    expect(applyButton.hasAttribute('disabled')).toBe(false);
    expect(catchButton.hasAttribute('disabled')).toBe(false);
  });

  it('Catch calls POST /me/applications with the bearer token and shows a success state on 201', async () => {
    const fetchMock = stubAuthenticatedFetch(() => ({
      ok: true,
      status: 201,
      json: async () => ({ id: 'app-1', listingId: 'listing-1', alreadyApplied: false }),
    }));

    await renderWithLoggedInAccountAndOpenPopup(fetchMock);
    fireEvent.click(screen.getByRole('button', { name: /Catch/i }));

    await waitFor(() => {
      expect(screen.getByText('Candidature envoyée !')).toBeTruthy();
    });

    const applyCall = fetchMock.mock.calls.find(
      (call: unknown[]) => call[0] === 'http://localhost:3000/me/applications',
    ) as [string, RequestInit];
    const init = applyCall[1];
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer token-abc');
    expect(JSON.parse(init.body as string)).toEqual({ listingId: 'listing-1' });
    // Success is terminal — no error text, no more Catch/Postuler buttons.
    expect(screen.queryByRole('button', { name: 'Postuler' })).toBeNull();
  });

  it('shows the distinct Permis de Travail confirmation when the response reports permisDeTravailUnlocked: true', async () => {
    const fetchMock = stubAuthenticatedFetch(() => ({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'app-10',
        listingId: 'listing-1',
        alreadyApplied: false,
        catchCount: 10,
        permisDeTravailUnlocked: true,
      }),
    }));

    await renderWithLoggedInAccountAndOpenPopup(fetchMock);
    fireEvent.click(screen.getByRole('button', { name: /Catch/i }));

    await waitFor(() => {
      expect(screen.getByText(/Permis de Travail débloqué/)).toBeTruthy();
    });
    // Distinct from the routine confirmation, not shown alongside it.
    expect(screen.queryByText('Candidature envoyée !')).toBeNull();
  });

  it('plain Postuler hits the same endpoint as Catch', async () => {
    const fetchMock = stubAuthenticatedFetch(() => ({
      ok: true,
      status: 201,
      json: async () => ({ id: 'app-1', listingId: 'listing-1', alreadyApplied: false }),
    }));

    await renderWithLoggedInAccountAndOpenPopup(fetchMock);
    fireEvent.click(screen.getByRole('button', { name: 'Postuler' }));

    await waitFor(() => {
      expect(screen.getByText('Candidature envoyée !')).toBeTruthy();
    });
  });

  it('shows "already caught" (not an error) when the backend reports alreadyApplied: true', async () => {
    const fetchMock = stubAuthenticatedFetch(() => ({
      ok: true,
      status: 200,
      json: async () => ({ id: null, listingId: 'listing-1', alreadyApplied: true }),
    }));

    await renderWithLoggedInAccountAndOpenPopup(fetchMock);
    fireEvent.click(screen.getByRole('button', { name: /Catch/i }));

    await waitFor(() => {
      expect(screen.getByText('Déjà postulé à cette offre')).toBeTruthy();
    });
    expect(screen.queryByText(/Échec/i)).toBeNull();
  });

  it('shows a retryable error state (not a crash) when the apply request fails', async () => {
    const fetchMock = stubAuthenticatedFetch(() => ({ ok: false, status: 500, json: async () => ({}) }));

    await renderWithLoggedInAccountAndOpenPopup(fetchMock);
    fireEvent.click(screen.getByRole('button', { name: /Catch/i }));

    await waitFor(() => {
      expect(screen.getByText(/Échec de la candidature/i)).toBeTruthy();
    });
    // Buttons remain so the Job Seeker can retry.
    expect(screen.getByRole('button', { name: 'Postuler' })).toBeTruthy();
  });

  it('shows a "Mon profil" link to /profile only when an account is logged in', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));

    renderMapView();
    expect(screen.queryByRole('link', { name: 'Mon profil' })).toBeNull();

    cleanup();
    stubWorkingLocalStorage();
    localStorage.setItem(
      'geoemploi.auth',
      JSON.stringify({ accessToken: 'token-abc', email: 'a@b.com' }),
    );

    renderMapView();
    const link = screen.getByRole('link', { name: 'Mon profil' });
    expect(link.getAttribute('href')).toBe('/profile');
  });

  it('shows a "Mes badges" link to /badges only when an account is logged in', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));

    renderMapView();
    expect(screen.queryByRole('link', { name: 'Mes badges' })).toBeNull();

    cleanup();
    stubWorkingLocalStorage();
    localStorage.setItem(
      'geoemploi.auth',
      JSON.stringify({ accessToken: 'token-abc', email: 'a@b.com' }),
    );

    renderMapView();
    const link = screen.getByRole('link', { name: 'Mes badges' });
    expect(link.getAttribute('href')).toBe('/badges');
  });

  it('shows a "Mes candidatures" link to /applications only when an account is logged in', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));

    renderMapView();
    expect(screen.queryByRole('link', { name: 'Mes candidatures' })).toBeNull();

    cleanup();
    stubWorkingLocalStorage();
    localStorage.setItem(
      'geoemploi.auth',
      JSON.stringify({ accessToken: 'token-abc', email: 'a@b.com' }),
    );

    renderMapView();
    const link = screen.getByRole('link', { name: 'Mes candidatures' });
    expect(link.getAttribute('href')).toBe('/applications');
  });
});
