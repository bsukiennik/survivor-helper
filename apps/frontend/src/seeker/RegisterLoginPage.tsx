import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { storeAuth } from './auth-token';

// `||` (not `??`) on purpose — see map/MapView.tsx for why.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type Mode = 'register' | 'login';

interface AuthResponse {
  accessToken: string;
}

function isAuthResponse(value: unknown): value is AuthResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { accessToken?: unknown }).accessToken === 'string'
  );
}

/**
 * Registration/login for a Job Seeker account (FR3). One component serves
 * both `/register` and `/login` — the route decides the initial mode (so
 * "Se connecter" in the header actually opens on the login form, not
 * register), and a toggle switches between them without a navigation.
 */
export function RegisterLoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(location.pathname === '/login' ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(
          body?.message ??
            (mode === 'register'
              ? "Impossible de créer le compte."
              : 'Identifiants invalides.'),
        );
      }
      const data: unknown = await response.json();
      if (!isAuthResponse(data)) {
        // The server said 2xx but the body isn't what we expect — treat it
        // as a failure rather than silently storing a broken/missing token.
        throw new Error('Réponse du serveur invalide.');
      }
      storeAuth(data.accessToken, email);
      void navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode(): void {
    setMode(mode === 'register' ? 'login' : 'register');
    setError(null);
    setConfirmPassword('');
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          {mode === 'register' ? 'Créer un compte' : 'Se connecter'}
        </h1>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Mot de passe
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border border-slate-300 px-2 py-1.5"
            />
          </label>
          {mode === 'register' ? (
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Confirmer le mot de passe
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded bg-amber-600 px-3 py-1.5 font-medium text-white disabled:opacity-60"
          >
            {mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>
        <button type="button" onClick={toggleMode} className="mt-3 text-sm text-slate-600 underline">
          {mode === 'register'
            ? 'Déjà un compte ? Se connecter'
            : "Pas de compte ? En créer un"}
        </button>
      </div>
    </div>
  );
}
