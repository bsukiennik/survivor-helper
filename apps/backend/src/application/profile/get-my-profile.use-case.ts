import { Inject, Injectable } from '@nestjs/common';
import type { JobSeekerProfile } from '../../domain/profile/job-seeker-profile.entity.js';
import {
  JOB_SEEKER_PROFILE_REPOSITORY_PORT,
  type JobSeekerProfileRepositoryPort,
} from '../ports/job-seeker-profile-repository.port.js';

/**
 * `GET /me/profile`. A fresh account with no profile row yet is not an
 * error — returns `null`, which the controller maps to a 200 with
 * empty/null fields (never a 404).
 */
@Injectable()
export class GetMyProfileUseCase {
  constructor(
    @Inject(JOB_SEEKER_PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: JobSeekerProfileRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<JobSeekerProfile | null> {
    return this.profileRepository.findByAccountId(accountId);
  }
}
