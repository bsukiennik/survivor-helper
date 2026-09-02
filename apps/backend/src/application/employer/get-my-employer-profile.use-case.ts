import { Inject, Injectable } from '@nestjs/common';
import type { EmployerProfile } from '../../domain/profile/employer-profile.entity.js';
import {
  EMPLOYER_PROFILE_REPOSITORY_PORT,
  type EmployerProfileRepositoryPort,
} from '../ports/employer-profile-repository.port.js';

/**
 * `GET /me/employer-profile` (Story 3.1). Unlike `GetMyProfileUseCase`
 * (JobSeeker), a missing row here is not a normal empty-state — every
 * Employer account gets its `employer_profiles` row created atomically at
 * registration (`RegisterAccountUseCase`), so `null` only happens if that
 * invariant was broken out-of-band. The controller maps it to 404 rather
 * than fabricating a response.
 */
@Injectable()
export class GetMyEmployerProfileUseCase {
  constructor(
    @Inject(EMPLOYER_PROFILE_REPOSITORY_PORT)
    private readonly employerProfileRepository: EmployerProfileRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<EmployerProfile | null> {
    return this.employerProfileRepository.findByAccountId(accountId);
  }
}
