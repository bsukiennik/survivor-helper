import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MapView } from '../map/MapView';
import { NotFound } from '../NotFound';
import { RegisterLoginPage } from './RegisterLoginPage';
import { ProfilePage } from './ProfilePage';

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

// Renders the real route table (not ProfilePage in isolation) so the
// redirect-to-/login assertion exercises an actual navigation, matching the
// pattern already used by router.spec.tsx.
function renderAtProfile(): ReturnType<typeof render> {
  const router = createMemoryRouter(
    [
      { path: '/', element: <MapView /> },
      { path: '/login', element: <RegisterLoginPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '*', element: <NotFound /> },
    ],
    { initialEntries: ['/profile'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('ProfilePage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('redirects to /login when no account is logged in', async () => {
    stubWorkingLocalStorage();

    renderAtProfile();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
  });

  it('loads the existing profile and shows saved values in the form', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('http://localhost:3000/me/profile');
        expect((init!.headers as Headers).get('authorization')).toBe('Bearer token-abc');
        return {
          ok: true,
          json: async () => ({
            skills: 'Boulangerie',
            experience: '3 ans',
            availability: 'Immédiate',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        };
      }),
    );

    renderAtProfile();

    await waitFor(() => {
      expect(screen.getByLabelText('Compétences')).toHaveProperty('value', 'Boulangerie');
    });
    expect(screen.getByLabelText('Expérience')).toHaveProperty('value', '3 ans');
    expect(screen.getByLabelText('Disponibilité')).toHaveProperty('value', 'Immédiate');
  });

  it('shows an empty form (not an error) when the account has no profile yet', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          skills: null,
          experience: null,
          availability: null,
          updatedAt: null,
        }),
      })),
    );

    renderAtProfile();

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).toBeNull();
    });
    expect(screen.getByLabelText('Compétences')).toHaveProperty('value', '');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('saves the form via PUT with the bearer token and shows a confirmation', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return {
          ok: true,
          json: async () => ({ skills: null, experience: null, availability: null, updatedAt: null }),
        };
      }
      expect(url).toBe('http://localhost:3000/me/profile');
      expect(init.method).toBe('PUT');
      expect((init.headers as Headers).get('content-type')).toBe('application/json');
      expect((init.headers as Headers).get('authorization')).toBe('Bearer token-abc');
      expect(JSON.parse(init.body as string)).toEqual({
        skills: 'Boulangerie',
        experience: '3 ans',
        availability: 'Immédiate',
      });
      return { ok: true, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAtProfile();

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).toBeNull();
    });

    fireEvent.change(screen.getByLabelText('Compétences'), { target: { value: 'Boulangerie' } });
    fireEvent.change(screen.getByLabelText('Expérience'), { target: { value: '3 ans' } });
    fireEvent.change(screen.getByLabelText('Disponibilité'), { target: { value: 'Immédiate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(/enregistré/);
    });
  });

  it('shows the last-saved timestamp once the profile has loaded', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          skills: 'Boulangerie',
          experience: '3 ans',
          availability: 'Immédiate',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      })),
    );

    renderAtProfile();

    await waitFor(() => {
      expect(screen.getByText(/Dernière modification/)).toBeTruthy();
    });
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

    renderAtProfile();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
    expect(localStorage.getItem('geoemploi.auth')).toBeNull();
  });

  it('clears auth and redirects to /login when the PUT returns 401', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return {
          ok: true,
          json: async () => ({ skills: null, experience: null, availability: null, updatedAt: null }),
        };
      }
      return { status: 401, ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAtProfile();

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).toBeNull();
    });

    fireEvent.change(screen.getByLabelText('Compétences'), { target: { value: 'Boulangerie' } });
    fireEvent.change(screen.getByLabelText('Expérience'), { target: { value: '3 ans' } });
    fireEvent.change(screen.getByLabelText('Disponibilité'), { target: { value: 'Immédiate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    });
    expect(localStorage.getItem('geoemploi.auth')).toBeNull();
  });

  it('shows an error instead of a silent failure when the profile response is malformed', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ skills: 'Boulangerie' }),
      })),
    );

    renderAtProfile();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/invalide/);
    });
  });

  it('shows a validation error and no confirmation when the save is rejected', async () => {
    stubWorkingLocalStorage();
    storeAuth();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return {
          ok: true,
          json: async () => ({ skills: null, experience: null, availability: null, updatedAt: null }),
        };
      }
      return {
        ok: false,
        json: async () => ({ message: ['skills should not be empty'] }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAtProfile();

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).toBeNull();
    });

    fireEvent.change(screen.getByLabelText('Compétences'), { target: { value: 'Boulangerie' } });
    fireEvent.change(screen.getByLabelText('Expérience'), { target: { value: '3 ans' } });
    fireEvent.change(screen.getByLabelText('Disponibilité'), { target: { value: 'Immédiate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/should not be empty/);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
