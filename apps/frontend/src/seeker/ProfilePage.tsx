import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { authFetch, clearAuth, readStoredAuth, type StoredAuth } from './auth-token';

// `||` (not `??`) on purpose — see map/MapView.tsx for why.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const MAX_FIELD_LENGTH = 2000;

interface ProfileResponse {
  skills: string | null;
  experience: string | null;
  availability: string | null;
  updatedAt: string | null;
}

function isProfileResponse(value: unknown): value is ProfileResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return ['skills', 'experience', 'availability', 'updatedAt'].every((key) => key in value);
}

/**
 * `/profile` (Story 2.2, FR-ish "manage own profile"). Any authenticated
 * Job Seeker's own profile row — `GET/PUT /me/profile` are gated by
 * `JwtAuthGuard` only, no role check. Redirects to `/login` on mount if
 * `readStoredAuth()` is empty, since a form that will just 401 isn't worth
 * showing.
 */
export function ProfilePage(): React.JSX.Element | null {
  const navigate = useNavigate();
  const [auth] = useState<StoredAuth | null>(() => readStoredAuth());
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      void navigate('/login');
      return;
    }

    let cancelled = false;

    async function loadProfile(): Promise<void> {
      try {
        const response = await authFetch(`${API_BASE_URL}/me/profile`);
        if (response.status === 401) {
          // Token expired/invalidated since mount — same outcome as never
          // having been logged in, not a generic load error.
          clearAuth();
          if (!cancelled) {
            void navigate('/login');
          }
          return;
        }
        if (!response.ok) {
          throw new Error('Impossible de charger le profil.');
        }
        const data: unknown = await response.json();
        if (cancelled) {
          return;
        }
        if (!isProfileResponse(data)) {
          setError('Réponse du serveur invalide.');
          return;
        }
        setSkills(data.skills ?? '');
        setExperience(data.experience ?? '');
        setAvailability(data.availability ?? '');
        setUpdatedAt(data.updatedAt);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [auth, navigate]);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/me/profile`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skills, experience, availability }),
      });
      if (response.status === 401) {
        clearAuth();
        void navigate('/login');
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
        throw new Error(message ?? "Impossible d'enregistrer le profil.");
      }
      const saved: unknown = await response.json();
      if (isProfileResponse(saved)) {
        setUpdatedAt(saved.updatedAt);
      }
      setSavedMessage('Profil enregistré.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  // No stored auth — the effect above is already navigating to /login;
  // render nothing rather than a form that would just 401.
  if (!auth) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">Mon profil</h1>
        {loading ? (
          <p className="text-sm text-slate-600">Chargement…</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Compétences
              <textarea
                required
                rows={3}
                maxLength={MAX_FIELD_LENGTH}
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Expérience
              <textarea
                required
                rows={3}
                maxLength={MAX_FIELD_LENGTH}
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Disponibilité
              <input
                type="text"
                required
                maxLength={MAX_FIELD_LENGTH}
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
            </label>
            {updatedAt ? (
              <p className="text-xs text-slate-500">
                Dernière modification : {new Date(updatedAt).toLocaleString('fr-FR')}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {savedMessage ? (
              <p role="status" className="text-sm text-emerald-700">
                {savedMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded bg-amber-600 px-3 py-1.5 font-medium text-white disabled:opacity-60"
            >
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
