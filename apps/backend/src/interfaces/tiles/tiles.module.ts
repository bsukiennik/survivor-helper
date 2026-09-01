import { Module } from '@nestjs/common';
import { TILE_PROVIDER_PORT } from '../../application/ports/tile-provider.port.js';
import { OsmTileProviderAdapter } from '../../infrastructure/mapping/osm-tile-provider.adapter.js';
import { TilesController } from './tiles.controller.js';

@Module({
  controllers: [TilesController],
  providers: [{ provide: TILE_PROVIDER_PORT, useClass: OsmTileProviderAdapter }],
})
export class TilesModule {}
