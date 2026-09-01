import { Module } from '@nestjs/common';
import { GetMyProfileUseCase } from '../../application/profile/get-my-profile.use-case.js';
import { SaveMyProfileUseCase } from '../../application/profile/save-my-profile.use-case.js';
import { JOB_SEEKER_PROFILE_REPOSITORY_PORT } from '../../application/ports/job-seeker-profile-repository.port.js';
import { DrizzleJobSeekerProfileRepository } from '../../infrastructure/persistence/drizzle/job-seeker-profile.repository.js';
import { AuthGuardsModule } from '../auth/auth-guards.module.js';
import { ProfileController } from './profile.controller.js';

// Imports AuthGuardsModule (not the whole AuthModule) to get `JwtAuthGuard`
// (and the `JwtModule` it's built on) resolvable in this module's DI
// context — `@UseGuards(JwtAuthGuard)` on ProfileController would otherwise
// fail to construct it. AuthGuardsModule is deliberately slim: it doesn't
// drag in AuthController, the register/login use cases, or the account
// repository/password hasher just to resolve a guard.
@Module({
  imports: [AuthGuardsModule],
  controllers: [ProfileController],
  providers: [
    GetMyProfileUseCase,
    SaveMyProfileUseCase,
    { provide: JOB_SEEKER_PROFILE_REPOSITORY_PORT, useClass: DrizzleJobSeekerProfileRepository },
  ],
})
export class ProfileModule {}
