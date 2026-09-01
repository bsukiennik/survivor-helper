import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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

// No consent gate / device geolocation yet (Story 1.3) — fixed France-wide
// default center view.
const FRANCE_CENTER: [number, number] = [46.6034, 1.8883];
const FRANCE_DEFAULT_ZOOM = 6;

interface ListingDto {
  id: string;
  title: string;
  employerName: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'published' | 'archived' | 'lapsed' | 'removed';
}

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

export function MapView(): React.JSX.Element {
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">GéoEmploi</h1>
      </header>
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
          <TileLayer
            url={`${API_BASE_URL}/tiles/{z}/{x}/{y}`}
            attribution="&copy; OpenStreetMap contributors"
          />
          {listings.filter(hasValidCoordinates).map((listing) => (
            <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
              <Popup>
                <strong>{listing.title}</strong>
                <br />
                {listing.employerName}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
