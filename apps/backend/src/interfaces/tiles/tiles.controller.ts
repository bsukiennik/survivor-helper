import { Controller, Get, Inject, Logger, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  TILE_PROVIDER_PORT,
  type TileProviderPort,
} from '../../application/ports/tile-provider.port.js';
import { isValidTileCoordinate } from './tile-coordinates.js';

/**
 * `GET /tiles/:z/:x/:y` — dumb passthrough proxy to the OSM tile provider
 * (AD-3, Design Notes). No auth guard: this is part of the public,
 * unauthenticated map path (FR1), same as `/listings`.
 *
 * No file extension in the route on purpose — the frontend's Leaflet
 * `tileLayer` URL template points here as `/tiles/{z}/{x}/{y}` and the
 * proxy forwards the provider's real `Content-Type` header, so no suffix
 * parsing/stripping is needed.
 */
@Controller('tiles')
export class TilesController {
  private readonly logger = new Logger(TilesController.name);

  constructor(
    @Inject(TILE_PROVIDER_PORT) private readonly tileProvider: TileProviderPort,
  ) {}

  @Get(':z/:x/:y')
  @ApiExcludeEndpoint()
  async getTile(
    @Param('z', ParseIntPipe) z: number,
    @Param('x', ParseIntPipe) x: number,
    @Param('y', ParseIntPipe) y: number,
    @Res() res: Response,
  ): Promise<void> {
    // ParseIntPipe only rejects non-numeric/decimal strings — it happily
    // accepts a negative or out-of-range integer. Bounds-check separately.
    if (!isValidTileCoordinate(z, x, y)) {
      res.status(400).send();
      return;
    }

    try {
      const tile = await this.tileProvider.fetchTile(z, x, y);
      res.status(200).setHeader('Content-Type', tile.contentType).send(tile.data);
    } catch (error) {
      this.logger.warn(`Tile proxy failed for ${z}/${x}/${y}: ${(error as Error).message}`);
      // Proxy failure never crashes the frontend map (I/O matrix, Story 1.1):
      // the tile layer degrades gracefully, page stays up.
      res.status(502).send();
    }
  }
}
