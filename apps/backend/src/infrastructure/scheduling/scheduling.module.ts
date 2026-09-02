import { Module } from '@nestjs/common';
import { ArchiveExpiredListingsUseCase } from '../../application/listing/archive-expired-listings.use-case.js';
import { LISTING_REPOSITORY_PORT } from '../../application/ports/listing-repository.port.js';
import { DrizzleListingRepository } from '../persistence/drizzle/listing.repository.js';
import { ListingArchivalScheduler } from './listing-archival.scheduler.js';

// `ListingArchivalScheduler` and its `ArchiveExpiredListingsUseCase` +
// `LISTING_REPOSITORY_PORT` binding (Story 3.2) live here rather than
// inside `ListingsModule`, which stays untouched per the Code Map — the
// hourly sweep isn't scoped to any one HTTP-facing module. Same "bind your
// own copy of a port, don't import another module for it" pattern as
// `ApplicationModule`/`EmployerListingsModule`. Nothing exported — nothing
// outside this module needs the scheduler or its use case.
@Module({
  providers: [
    ArchiveExpiredListingsUseCase,
    ListingArchivalScheduler,
    { provide: LISTING_REPOSITORY_PORT, useClass: DrizzleListingRepository },
  ],
})
export class SchedulingModule {}
