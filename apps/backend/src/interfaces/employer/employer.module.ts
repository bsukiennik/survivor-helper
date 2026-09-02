import { Module } from '@nestjs/common';
import { GetMyEmployerProfileUseCase } from '../../application/employer/get-my-employer-profile.use-case.js';
import { EMPLOYER_PROFILE_REPOSITORY_PORT } from '../../application/ports/employer-profile-repository.port.js';
import { DrizzleEmployerProfileRepository } from '../../infrastructure/persistence/drizzle/employer-profile.repository.js';
import { AuthGuardsModule } from '../auth/auth-guards.module.js';
import { EmployerProfileController } from './employer-profile.controller.js';

// Imports AuthGuardsModule (not AuthModule) — same pattern as
// ProfileModule/ApplicationModule — to get `JwtAuthGuard`/`RolesGuard`
// resolvable here. Binds its own `EMPLOYER_PROFILE_REPOSITORY_PORT`
// provider (rather than importing AuthModule, which binds the same port for
// `RegisterAccountUseCase`) — mirrors how `LISTING_REPOSITORY_PORT` is
// bound independently in both `ListingsModule` and `ApplicationModule`
// (Code Map), not shared via import.
@Module({
  imports: [AuthGuardsModule],
  controllers: [EmployerProfileController],
  providers: [
    GetMyEmployerProfileUseCase,
    { provide: EMPLOYER_PROFILE_REPOSITORY_PORT, useClass: DrizzleEmployerProfileRepository },
  ],
})
export class EmployerModule {}
