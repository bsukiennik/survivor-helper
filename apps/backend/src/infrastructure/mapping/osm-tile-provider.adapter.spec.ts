import { afterEach, describe, expect, it, vi } from 'vitest';
import { OsmTileProviderAdapter } from './osm-tile-provider.adapter.js';

function stubFetch(response: {
  ok: boolean;
  status?: number;
  contentType?: string | null;
  body?: string;
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      headers: { get: (_name: string) => response.contentType ?? null },
      arrayBuffer: async () => Buffer.from(response.body ?? 'fake-bytes'),
    })),
  );
}

describe('OsmTileProviderAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when the upstream response is not ok', async () => {
    stubFetch({ ok: false, status: 404 });
    const adapter = new OsmTileProviderAdapter();

    await expect(adapter.fetchTile(5, 16, 11)).rejects.toThrow(/404/);
  });

  it('falls back to image/png when the upstream response has no content-type', async () => {
    stubFetch({ ok: true, contentType: null });
    const adapter = new OsmTileProviderAdapter();

    const tile = await adapter.fetchTile(5, 16, 11);

    expect(tile.contentType).toBe('image/png');
  });

  it('forwards the upstream content-type when present', async () => {
    stubFetch({ ok: true, contentType: 'image/webp' });
    const adapter = new OsmTileProviderAdapter();

    const tile = await adapter.fetchTile(5, 16, 11);

    expect(tile.contentType).toBe('image/webp');
  });

  it('requests the correct OSM URL with an identifying User-Agent and a timeout signal', async () => {
    stubFetch({ ok: true, contentType: 'image/png' });
    const adapter = new OsmTileProviderAdapter();

    await adapter.fetchTile(5, 16, 11);

    expect(fetch).toHaveBeenCalledWith(
      'https://tile.openstreetmap.org/5/16/11.png',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('GeoEmploi') }),
        signal: expect.anything(),
      }),
    );
  });
});
