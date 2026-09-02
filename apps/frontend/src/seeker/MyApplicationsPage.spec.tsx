import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MapView } from '../map/MapView';
import { NotFound } from '../NotFound';
import { MyApplicationsPage } from './MyApplicationsPage';
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

// Renders the real route table (not MyApplicationsPage in isolation) so the
// redirect-to-/login assertion exercises an actual navigation, matching the
// pattern already used by BadgesPage.spec.tsx.
function renderAtApplications(): ReturnType<typeof render> {
  const router = createMemoryRouter(
    [
      { path: '/', element: <MapView /> },
      { path: '/login', element: <RegisterLoginPage /> },
      { path: '/applications', element: <MyApplicationsPage /> },
      { path: '*', element: <NotFound /> },
    ],
    { initialEntries: ['/applications'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('MyApplicationsPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('redirects to /login when no account is logged in', async () => {
    stubWorkingLocalStorage();

    renderAtApplications();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
  });

  it('shows an explicit empty state (not an error) for a fresh account with no Applications', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('http://localhost:3000/me/applications');
        expect((init!.headers as Headers).get('authorization')).toBe('Bearer token-abc');
        return { ok: true, json: async () => [] };
      }),
    );

    renderAtApplications();

    await waitFor(() => {
      expect(screen.getByText('Aucune candidature pour l\'instant')).toBeTruthy();
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows each Application with its listing title, employer, and status, newest first', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: 'app-2',
            listingId: 'listing-2',
            listingTitle: 'Fleuriste',
            employerName: 'Fleurs du Coin',
            status: 'submitted',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
          {
            id: 'app-1',
            listingId: 'listing-1',
            listingTitle: 'Boulanger / Boulangère',
            employerName: 'Boulangerie du Marché',
            status: 'shortlisted',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })),
    );

    renderAtApplications();

    await waitFor(() => {
      expect(screen.getByText('Fleuriste')).toBeTruthy();
    });
    expect(screen.getByText('Fleurs du Coin')).toBeTruthy();
    expect(screen.getByText('submitted')).toBeTruthy();
    expect(screen.getByText('Boulanger / Boulangère')).toBeTruthy();
    expect(screen.getByText('Boulangerie du Marché')).toBeTruthy();
    expect(screen.getByText('shortlisted')).toBeTruthy();

    // Newest first — the fleuriste application appears before the boulanger one.
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Fleuriste');
    expect(items[1]?.textContent).toContain('Boulanger');
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

    renderAtApplications();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
    expect(localStorage.getItem('geoemploi.auth')).toBeNull();
  });

  it('shows an error instead of a silent failure when the response is malformed', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ id: 'app-1' }],
      })),
    );

    renderAtApplications();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/invalide/);
    });
  });

  it('shows an error instead of a silent failure when the request fails', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })),
    );

    renderAtApplications();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });
});
