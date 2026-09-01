import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import type { TileProviderPort } from '../../application/ports/tile-provider.port.js';
import { TilesController } from './tiles.controller.js';

function makeResStub() {
  const res = {
    status: vi.fn(),
    setHeader: vi.fn(),
    send: vi.fn(),
  };
  // Chainable, like Express's real Response.
  res.status.mockReturnValue(res);
  res.setHeader.mockReturnValue(res);
  res.send.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    setHeader: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };
}

describe('TilesController', () => {
  it('returns 502 (not a crash) when the tile provider fails', async () => {
    const failingProvider: TileProviderPort = {
      fetchTile: vi.fn(async () => {
        throw new Error('upstream unreachable');
      }),
    };
    const controller = new TilesController(failingProvider);
    const res = makeResStub();

    await controller.getTile(5, 16, 11, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.send).toHaveBeenCalled();
  });

  it('streams the tile back with its content-type on success', async () => {
    const data = Buffer.from('fake-png-bytes');
    const provider: TileProviderPort = {
      fetchTile: vi.fn(async () => ({ data, contentType: 'image/png' })),
    };
    const controller = new TilesController(provider);
    const res = makeResStub();

    await controller.getTile(5, 16, 11, res);

    expect(provider.fetchTile).toHaveBeenCalledWith(5, 16, 11);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.send).toHaveBeenCalledWith(data);
  });

  it('returns 400 for out-of-range coordinates without calling the provider', async () => {
    const provider: TileProviderPort = { fetchTile: vi.fn() };
    const controller = new TilesController(provider);
    const res = makeResStub();

    await controller.getTile(5, -1, 11, res);

    expect(provider.fetchTile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
