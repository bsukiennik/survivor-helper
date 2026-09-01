export interface Tile {
  readonly data: Buffer;
  readonly contentType: string;
}

/**
 * Port (AD-1, AD-3) — the frontend never calls the tile provider directly;
 * every tile request goes through this port's adapter. No caching/metrics
 * logic here yet (that's Epic 7 Story 7.5, per AD-11 — layered onto this
 * same endpoint later, not built now).
 */
export interface TileProviderPort {
  fetchTile(z: number, x: number, y: number): Promise<Tile>;
}

export const TILE_PROVIDER_PORT = Symbol('TILE_PROVIDER_PORT');
