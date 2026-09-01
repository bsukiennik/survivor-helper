import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MapView } from '../map/MapView';
import { NotFound } from '../NotFound';
import { BadgesPage } from './BadgesPage';
import { RegisterLoginPage } from './RegisterLoginPage';

function stubWorkingLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

function storeAuth(): void {
  localStorage.setItem(
    'geoemploi.auth',
    JSON.stringify({ accessToken: 'token-abc', email: 'a@b.com' }),
  );
}

// Renders the real route table (not BadgesPage in isolation) so the
// redirect-to-/login assertion exercises an actual navigation, matching the
// pattern already used by ProfilePage.spec.tsx.
function renderAtBadges(): ReturnType<typeof render> {
  const router = createMemoryRouter(
    [
      { path: '/', element: <MapView /> },
      { path: '/login', element: <RegisterLoginPage /> },
      { path: '/badges', element: <BadgesPage /> },
      { path: '*', element: <NotFound /> },
    ],
    { initialEntries: ['/badges'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('BadgesPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('redirects to /login when no account is logged in', async () => {
    stubWorkingLocalStorage();

    renderAtBadges();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
  });

  it('shows the catch count and no unlock state below the threshold', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('http://localhost:3000/me/badges');
        expect((init!.headers as Headers).get('authorization')).toBe('Bearer token-abc');
        return { ok: true, json: async () => ({ catchCount: 3, permisDeTravailUnlocked: false }) };
      }),
    );

    renderAtBadges();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy();
    });
    expect(screen.queryByText(/Permis de Travail débloqué/)).toBeNull();
  });

  it('shows the distinct unlock state once the threshold is reached', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ catchCount: 10, permisDeTravailUnlocked: true }),
      })),
    );

    renderAtBadges();

    await waitFor(() => {
      expect(screen.getByText(/Permis de Travail débloqué/)).toBeTruthy();
    });
  });

  it('shows catchCount 0 and no unlock (not an error) for a fresh account', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ catchCount: 0, permisDeTravailUnlocked: false }),
      })),
    );

    renderAtBadges();

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).toBeNull();
    });
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('clears auth and redirects to /login when the GET returns 401', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 401,
        ok: false,
        json: async () => ({}),
      })),
    );

    renderAtBadges();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
    expect(localStorage.getItem('geoemploi.auth')).toBeNull();
  });

  it('shows an error instead of a silent failure when the badges response is malformed', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ catchCount: 3 }),
      })),
    );

    renderAtBadges();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/invalide/);
    });
  });
});
