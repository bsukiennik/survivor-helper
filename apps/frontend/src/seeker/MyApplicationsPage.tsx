import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { authFetch, clearAuth, readStoredAuth, type StoredAuth } from './auth-token';

// `||` (not `??`) on purpose — see map/MapView.tsx for why.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface MyApplication {
  id: string;
  listingId: string;
  listingTitle: string;
  employerName: string;
  status: string;
  createdAt: string;
}

function isMyApplicationArray(value: unknown): value is MyApplication[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      ['id', 'listingId', 'listingTitle', 'employerName', 'status', 'createdAt'].every(
        (key) => key in item,
      ),
  );
}

/**
 * `/applications` (Story 2.5). Lists the authenticated Job Seeker's
 * Applications newest first — `GET /me/applications` is gated by
 * `JwtAuthGuard`/`RolesGuard`/`@Roles('JobSeeker')`. Mirrors
 * `BadgesPage.tsx`'s auth-gate/load pattern: redirects to `/login` on mount
 * if `readStoredAuth()` is empty, since a page that will just 401 isn't
 * worth showing.
 *
 * A fresh account with zero Applications is not an error (I/O matrix) — an
 * explicit "Aucune candidature pour l'instant" empty state, never treated
 * as a load failure.
 */
export function MyApplicationsPage(): React.JSX.Element | null {
  const navigate = useNavigate();
  const [auth] = useState<StoredAuth | null>(() => readStoredAuth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<MyApplication[]>([]);

  useEffect(() => {
    if (!auth) {
      void navigate('/login');
      return;
    }

    let cancelled = false;

    async function loadApplications(): Promise<void> {
      try {
        const response = await authFetch(`${API_BASE_URL}/me/applications`);
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
          throw new Error('Impossible de charger les candidatures.');
        }
        const data: unknown = await response.json();
        if (cancelled) {
          return;
        }
        if (!isMyApplicationArray(data)) {
          setError('Réponse du serveur invalide.');
          return;
        }
        setApplications(data);
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

    void loadApplications();
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
      <div className="w-full max-w-lg rounded border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">Mes candidatures</h1>
        {loading ? (
          <p className="text-sm text-slate-600">Chargement…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune candidature pour l'instant</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((application) => (
              <li key={application.id} className="rounded border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{application.listingTitle}</p>
                <p className="text-sm text-slate-700">{application.employerName}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {application.status}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Candidature envoyée le {new Date(application.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
