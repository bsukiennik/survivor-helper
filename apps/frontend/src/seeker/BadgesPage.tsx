import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { authFetch, clearAuth, readStoredAuth, type StoredAuth } from './auth-token';

// `||` (not `??`) on purpose — see map/MapView.tsx for why.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface BadgesResponse {
  catchCount: number;
  permisDeTravailUnlocked: boolean;
}

function isBadgesResponse(value: unknown): value is BadgesResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return ['catchCount', 'permisDeTravailUnlocked'].every((key) => key in value);
}

/**
 * `/badges` (Story 2.4). Standalone progress view for the authenticated Job
 * Seeker's catch count and Permis de Travail unlock — `GET /me/badges` is
 * gated by `JwtAuthGuard`/`RolesGuard`/`@Roles('JobSeeker')`. Mirrors
 * `ProfilePage.tsx`'s auth-gate/load pattern: redirects to `/login` on mount
 * if `readStoredAuth()` is empty, since a page that will just 401 isn't
 * worth showing.
 */
export function BadgesPage(): React.JSX.Element | null {
  const navigate = useNavigate();
  const [auth] = useState<StoredAuth | null>(() => readStoredAuth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catchCount, setCatchCount] = useState(0);
  const [permisDeTravailUnlocked, setPermisDeTravailUnlocked] = useState(false);

  useEffect(() => {
    if (!auth) {
      void navigate('/login');
      return;
    }

    let cancelled = false;

    async function loadBadges(): Promise<void> {
      try {
        const response = await authFetch(`${API_BASE_URL}/me/badges`);
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
          throw new Error('Impossible de charger les badges.');
        }
        const data: unknown = await response.json();
        if (cancelled) {
          return;
        }
        if (!isBadgesResponse(data)) {
          setError('Réponse du serveur invalide.');
          return;
        }
        setCatchCount(data.catchCount);
        setPermisDeTravailUnlocked(data.permisDeTravailUnlocked);
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

    void loadBadges();
    return () => {
      cancelled = true;
    };
  }, [auth, navigate]);

  // No stored auth — the effect above is already navigating to /login;
  // render nothing rather than a page that would just 401.
  if (!auth) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">Mes badges</h1>
        {loading ? (
          <p className="text-sm text-slate-600">Chargement…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {error ? (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-700">
                  Candidatures envoyées :{' '}
                  <span className="font-semibold text-slate-900">{catchCount}</span>
                </p>
                {permisDeTravailUnlocked ? (
                  <p
                    role="status"
                    className="rounded bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800"
                  >
                    <span role="img" aria-label="Médaille">
                      🏅
                    </span>{' '}
                    Permis de Travail débloqué !
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    Attrapez {10 - catchCount} offre{10 - catchCount > 1 ? 's' : ''} de plus pour
                    débloquer le Permis de Travail.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
