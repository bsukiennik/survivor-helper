import { Module } from '@nestjs/common';
import { PublishListingUseCase } from '../../application/listing/publish-listing.use-case.js';
import { EMPLOYER_PROFILE_REPOSITORY_PORT } from '../../application/ports/employer-profile-repository.port.js';
import { LISTING_REPOSITORY_PORT } from '../../application/ports/listing-repository.port.js';
import { DrizzleEmployerProfileRepository } from '../../infrastructure/persistence/drizzle/employer-profile.repository.js';
import { DrizzleListingRepository } from '../../infrastructure/persistence/drizzle/listing.repository.js';
import { AuthGuardsModule } from '../auth/auth-guards.module.js';
import { MyListingsController } from './my-listings.controller.js';

// Imports AuthGuardsModule (not the whole AuthModule/EmployerModule) — same
// "bind own ports, don't import the writer's module" pattern as
// `application.module.ts`/`employer.module.ts` (Code Map). Binds its own
// `LISTING_REPOSITORY_PORT` and `EMPLOYER_PROFILE_REPOSITORY_PORT`
// providers rather than importing `ListingsModule`/`EmployerModule`, which
// bind the same ports for their own use cases.
@Module({
  imports: [AuthGuardsModule],
  controllers: [MyListingsController],
  providers: [
    PublishListingUseCase,
    { provide: LISTING_REPOSITORY_PORT, useClass: DrizzleListingRepository },
    { provide: EMPLOYER_PROFILE_REPOSITORY_PORT, useClass: DrizzleEmployerProfileRepository },
  ],
})
export class EmployerListingsModule {}
