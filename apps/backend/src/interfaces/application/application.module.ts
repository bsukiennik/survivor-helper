import { Module } from '@nestjs/common';
import { ApplyToListingUseCase } from '../../application/application/apply-to-listing.use-case.js';
import { APPLICATION_REPOSITORY_PORT } from '../../application/ports/application-repository.port.js';
import { LISTING_REPOSITORY_PORT } from '../../application/ports/listing-repository.port.js';
import { DrizzleApplicationRepository } from '../../infrastructure/persistence/drizzle/application.repository.js';
import { DrizzleListingRepository } from '../../infrastructure/persistence/drizzle/listing.repository.js';
import { AuthGuardsModule } from '../auth/auth-guards.module.js';
import { ApplicationController } from './application.controller.js';

// Imports AuthGuardsModule (not the whole AuthModule) — same pattern as
// ProfileModule — to get `JwtAuthGuard`/`RolesGuard` resolvable in this
// module's DI context. Binds its own `LISTING_REPOSITORY_PORT` provider
// (rather than importing `ListingsModule`) to stay a thin
// use-case-plus-port-bindings module, same shape as `profile.module.ts`.
@Module({
  imports: [AuthGuardsModule],
  controllers: [ApplicationController],
  providers: [
    ApplyToListingUseCase,
    { provide: APPLICATION_REPOSITORY_PORT, useClass: DrizzleApplicationRepository },
    { provide: LISTING_REPOSITORY_PORT, useClass: DrizzleListingRepository },
  ],
})
export class ApplicationModule {}
