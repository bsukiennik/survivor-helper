import { Injectable } from '@nestjs/common';
import type { Tile, TileProviderPort } from '../../application/ports/tile-provider.port.js';

const OSM_TILE_BASE_URL = 'https://tile.openstreetmap.org';
const DEFAULT_CONTACT_EMAIL = 'ministry-demo@localhost';
const FETCH_TIMEOUT_MS = 5000;

function buildUserAgent(): string {
  // OSM's tile usage policy requires an identifying User-Agent with a
  // reachable contact. The default is a non-reachable placeholder — real
  // deployments must set OSM_TILE_CONTACT_EMAIL (see .env.example).
  const contactEmail = process.env.OSM_TILE_CONTACT_EMAIL ?? DEFAULT_CONTACT_EMAIL;
  return `GeoEmploi/0.1 (contact: ${contactEmail})`;
}

/**
 * Dumb passthrough adapter (Design Notes): fetch the OSM tile, stream it
 * back. No cache, no headers logic beyond content-type. Epic 7 Story 7.5
 * adds caching and hit/miss counters on top of this same port — not built
 * here.
 */
@Injectable()
export class OsmTileProviderAdapter implements TileProviderPort {
  async fetchTile(z: number, x: number, y: number): Promise<Tile> {
    const response = await fetch(`${OSM_TILE_BASE_URL}/${z}/${x}/${y}.png`, {
      headers: {
        'User-Agent': buildUserAgent(),
      },
      // A hung upstream must not hang the proxied request indefinitely —
      // the frontend map has to be able to give up on a tile and move on.
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`OSM tile provider responded with ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      data: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') ?? 'image/png',
    };
  }
}
