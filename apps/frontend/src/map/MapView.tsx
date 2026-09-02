import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { authFetch, clearAuth, readStoredAuth, type StoredAuth } from '../seeker/auth-token';
import { ConsentBanner } from './ConsentBanner';
import { readStoredConsent, recordConsent } from './geolocation-consent';

// Bundlers rewrite Leaflet's default marker image URLs to hashed asset
// paths, which breaks Leaflet's own path-guessing logic — the standard
// fix is to point the default icon at the bundled URLs explicitly.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// `||` (not `??`) on purpose: an explicitly-set-but-empty
// VITE_API_BASE_URL must also fall back, not resolve to `''`.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Default view when no device position is available/consented to.
const FRANCE_CENTER: [number, number] = [46.6034, 1.8883];
const FRANCE_DEFAULT_ZOOM = 6;
const USER_LOCATION_ZOOM = 12;

interface ListingDto {
  id: string;
  title: string;
  employerName: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'published' | 'archived' | 'lapsed' | 'removed';
}

// Per-Listing state for the popup's Apply/Catch controls (Story 2.3) — keyed
// by listing.id, tracked client-side only, reset on reload. `already-caught`,
// `applied`, and `unlocked` are all terminal "no error" outcomes (I/O
// matrix): the popup must never show a repeat catch as a failure.
// `unlocked` (Story 2.4) is `applied` plus the response's
// `permisDeTravailUnlocked: true` — a distinct confirmation from a routine
// catch, never re-fired past the 10th.
type ApplicationStatus = 'idle' | 'submitting' | 'applied' | 'unlocked' | 'already-caught' | 'error';

// A single Listing with a bad (non-finite/out-of-range) coordinate would
// otherwise make Leaflet throw while rendering *all* markers, blanking the
// whole map rather than just skipping the one bad marker.
function hasValidCoordinates(listing: ListingDto): boolean {
  return (
    Number.isFinite(listing.latitude) &&
    Number.isFinite(listing.longitude) &&
    listing.latitude >= -90 &&
    listing.latitude <= 90 &&
    listing.longitude >= -180 &&
    listing.longitude <= 180
  );
}

// react-leaflet's `center`/`zoom` props only apply on initial mount — this
// re-centers the already-created Leaflet map instance when consent resolves
// to a device position after that first render.
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }): null {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// The consent banner sits above MapContainer in normal flex flow, so
// showing/hiding it resizes the map's container div — without telling
// Leaflet, the map can render with blank tile regions until the user pans.
function InvalidateSizeOnLayoutChange({ layoutTrigger }: { layoutTrigger: unknown }): null {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [layoutTrigger, map]);
  return null;
}

export function MapView(): React.JSX.Element {
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());
  const [applicationStatus, setApplicationStatus] = useState<Record<string, ApplicationStatus>>(
    {},
  );

  function handleLogout(): void {
    clearAuth();
    setAuth(null);
  }

  // Both the plain "Postuler" and the visually distinct "Catch" affordance
  // call this same endpoint (Boundaries & Constraints) — a re-click on an
  // already-caught Listing shows "already caught" state, not an error.
  async function handleApply(listingId: string): Promise<void> {
    setApplicationStatus((prev) => ({ ...prev, [listingId]: 'submitting' }));
    try {
      const response = await authFetch(`${API_BASE_URL}/me/applications`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }
      const data = (await response.json()) as {
        alreadyApplied: boolean;
        permisDeTravailUnlocked?: boolean;
      };
      let nextStatus: ApplicationStatus;
      if (data.alreadyApplied) {
        nextStatus = 'already-caught';
      } else if (data.permisDeTravailUnlocked) {
        nextStatus = 'unlocked';
      } else {
        nextStatus = 'applied';
      }
      setApplicationStatus((prev) => ({ ...prev, [listingId]: nextStatus }));
    } catch {
      setApplicationStatus((prev) => ({ ...prev, [listingId]: 'error' }));
    }
  }
  const [locatingDevice, setLocatingDevice] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(FRANCE_CENTER);
  const [mapZoom, setMapZoom] = useState(FRANCE_DEFAULT_ZOOM);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  // Attempts to center the map on the visitor's device location. Any
  // failure (denied, unsupported, timeout) is not an error state — it just
  // means we stay on the France-wide default, silently.
  function requestDeviceLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    setLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) {
          return;
        }
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setMapZoom(USER_LOCATION_ZOOM);
        setLocatingDevice(false);
      },
      () => {
        // Denied at the OS/browser level, or unavailable — default view.
        if (isMountedRef.current) {
          setLocatingDevice(false);
        }
      },
      // maximumAge avoids the browser silently returning an old cached fix;
      // enableHighAccuracy isn't needed for city-level map centering.
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  useEffect(() => {
    // Consent gate (FR23): no navigator.geolocation call happens before
    // this resolves. A stored choice from a previous visit is honored
    // without re-asking; only "no choice yet" shows the banner.
    const stored = readStoredConsent();
    if (stored === null) {
      setShowConsentBanner(true);
    } else if (stored.choice === 'accepted') {
      requestDeviceLocation();
    }
    // Declined: nothing to do, default view already set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAcceptConsent(): void {
    recordConsent('accepted');
    setShowConsentBanner(false);
    requestDeviceLocation();
  }

  function handleDeclineConsent(): void {
    recordConsent('declined');
    setShowConsentBanner(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadListings(): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/listings`);
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        const data = (await response.json()) as ListingDto[];
        if (!cancelled) {
          setListings(data);
        }
      } catch (err) {
        // Fetching listings failing must not blank the page — the map
        // itself still renders with no markers.
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load listings');
        }
      }
    }

    void loadListings();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">GéoEmploi</h1>
        {auth ? (
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Link to="/profile" className="font-medium text-amber-700 underline">
              Mon profil
            </Link>
            <Link to="/badges" className="font-medium text-amber-700 underline">
              Mes badges
            </Link>
            <Link to="/applications" className="font-medium text-amber-700 underline">
              Mes candidatures
            </Link>
            <span>{auth.email}</span>
            <button type="button" onClick={handleLogout} className="text-slate-600 underline">
              Se déconnecter
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-sm font-medium text-amber-700 underline">
            Se connecter
          </Link>
        )}
      </header>
      {showConsentBanner ? (
        <ConsentBanner onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />
      ) : null}
      {locatingDevice ? (
        <p role="status" className="bg-blue-50 px-4 py-1 text-sm text-blue-800">
          Localisation en cours…
        </p>
      ) : null}
      {error ? (
        <p role="status" className="bg-amber-50 px-4 py-1 text-sm text-amber-800">
          Certaines annonces n'ont pas pu être chargées. La carte reste utilisable.
        </p>
      ) : null}
      <div className="min-h-0 flex-1">
        <MapContainer
          center={FRANCE_CENTER}
          zoom={FRANCE_DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom
        >
          <RecenterMap center={mapCenter} zoom={mapZoom} />
          <InvalidateSizeOnLayoutChange layoutTrigger={showConsentBanner || locatingDevice} />
          <TileLayer
            url={`${API_BASE_URL}/tiles/{z}/{x}/{y}`}
            attribution="&copy; OpenStreetMap contributors"
          />
          {listings.filter(hasValidCoordinates).map((listing) => (
            <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
              <Popup>
                {/* Public listing detail (FR2). Applying requires a Job
                    Seeker account (Epic 2, Story 2.3) — logged-out visitors
                    still see the disabled stub below. */}
                <div className="max-h-64 max-w-xs overflow-y-auto">
                  <strong className="block text-sm font-semibold">{listing.title}</strong>
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-medium">Employeur : </span>
                    {listing.employerName}
                  </p>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Lieu : </span>
                    {listing.location}
                  </p>
                  <p className="mt-2 text-sm text-slate-800">{listing.description}</p>
                  {auth ? (
                    (() => {
                      const status = applicationStatus[listing.id] ?? 'idle';
                      const submitting = status === 'submitting';
                      const caught =
                        status === 'applied' || status === 'unlocked' || status === 'already-caught';
                      if (caught && status === 'unlocked') {
                        // Distinct confirmation on the 10th catch (Story
                        // 2.4, Boundaries & Constraints) — visually
                        // different from the routine "Candidature envoyée !"
                        // below, not just a text swap.
                        return (
                          <p
                            role="status"
                            className="mt-3 rounded border-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 shadow"
                          >
                            <span role="img" aria-label="Médaille">
                              🏅
                            </span>{' '}
                            Permis de Travail débloqué !
                          </p>
                        );
                      }
                      return caught ? (
                        <p className="mt-3 rounded bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                          {status === 'already-caught'
                            ? 'Déjà postulé à cette offre'
                            : 'Candidature envoyée !'}
                        </p>
                      ) : (
                        <>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleApply(listing.id)}
                              className="flex-1 rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Postuler
                            </button>
                            {/* Visually distinct "Catch" affordance (Boundaries
                                & Constraints) — same endpoint as plain
                                Postuler, accent styling marks it as the
                                "catch" gesture from Epic 2's map metaphor. */}
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleApply(listing.id)}
                              title="Attrapez cette offre !"
                              className="flex-1 rounded bg-amber-500 px-3 py-1.5 text-sm font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              🎣 Catch
                            </button>
                          </div>
                          {status === 'error' ? (
                            <p className="mt-1 text-xs text-red-600">
                              Échec de la candidature, réessayez.
                            </p>
                          ) : null}
                        </>
                      );
                    })()
                  ) : (
                    <>
                      {/* `disabled` alone pulls the button out of the tab
                          order, so screen-reader/keyboard users would never
                          see the `title` tooltip explaining why — the reason
                          is also rendered as visible text below the button. */}
                      <button
                        type="button"
                        disabled
                        aria-describedby={`apply-reason-${listing.id}`}
                        className="mt-3 w-full cursor-not-allowed rounded bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500"
                      >
                        Postuler — connexion requise
                      </button>
                      <p id={`apply-reason-${listing.id}`} className="mt-1 text-xs text-slate-500">
                        Créez un compte demandeur d'emploi pour postuler.
                      </p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
