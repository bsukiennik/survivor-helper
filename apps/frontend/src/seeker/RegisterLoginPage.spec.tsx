import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { readStoredAuth } from './auth-token';
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

function renderPage(initialPath = '/register'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <RegisterLoginPage />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(
  email: string,
  password: string,
  submitLabel: 'Créer mon compte' | 'Se connecter' = 'Créer mon compte',
  confirmPassword: string = password,
): Promise<void> {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: password } });
  const confirmField = screen.queryByLabelText('Confirmer le mot de passe');
  if (confirmField) {
    fireEvent.change(confirmField, { target: { value: confirmPassword } });
  }
  fireEvent.click(screen.getByRole('button', { name: submitLabel }));
}

describe('RegisterLoginPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('registers, stores the token, and shows no error on success', async () => {
    stubWorkingLocalStorage();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toBe('http://localhost:3000/auth/register');
        return { ok: true, json: async () => ({ accessToken: 'token-123' }) };
      }),
    );

    renderPage();
    await fillAndSubmit('a@b.com', 'correcthorsebattery');

    await waitFor(() => {
      expect(readStoredAuth()?.accessToken).toBe('token-123');
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the server error message on a failed registration (e.g. duplicate email)', async () => {
    stubWorkingLocalStorage();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ message: 'An account with email "a@b.com" already exists.' }),
      })),
    );

    renderPage();
    await fillAndSubmit('a@b.com', 'correcthorsebattery');

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/already exists/);
    });
    expect(readStoredAuth()).toBeNull();
  });

  it('switches to login mode and posts to /auth/login instead', async () => {
    stubWorkingLocalStorage();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toBe('http://localhost:3000/auth/login');
        return { ok: true, json: async () => ({ accessToken: 'token-456' }) };
      }),
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Déjà un compte/ }));
    await fillAndSubmit('a@b.com', 'correcthorsebattery', 'Se connecter');

    await waitFor(() => {
      expect(readStoredAuth()?.accessToken).toBe('token-456');
    });
  });

  it('opens directly in login mode when reached via /login', () => {
    stubWorkingLocalStorage();
    renderPage('/login');

    expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    expect(screen.queryByLabelText('Confirmer le mot de passe')).toBeNull();
  });

  it('rejects submission client-side when the two passwords do not match, without calling fetch', async () => {
    stubWorkingLocalStorage();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await fillAndSubmit('a@b.com', 'correcthorsebattery', 'Créer mon compte', 'different-password');

    expect(screen.getByRole('alert').textContent).toMatch(/ne correspondent pas/);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readStoredAuth()).toBeNull();
  });

  it('treats a 2xx response with no accessToken as a failure rather than storing a broken session', async () => {
    stubWorkingLocalStorage();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );

    renderPage();
    await fillAndSubmit('a@b.com', 'correcthorsebattery');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    expect(readStoredAuth()).toBeNull();
  });
});
