import { Module } from '@nestjs/common';
import { GetPublishedListingsUseCase } from '../../application/listing/get-published-listings.use-case.js';
import { LISTING_REPOSITORY_PORT } from '../../application/ports/listing-repository.port.js';
import { DrizzleListingRepository } from '../../infrastructure/persistence/drizzle/listing.repository.js';
import { ListingsController } from './listings.controller.js';

@Module({
  controllers: [ListingsController],
  providers: [
    GetPublishedListingsUseCase,
    { provide: LISTING_REPOSITORY_PORT, useClass: DrizzleListingRepository },
  ],
})
export class ListingsModule {}
