import { Inject, Injectable } from '@nestjs/common';
import type { JobSeekerProfile } from '../../domain/profile/job-seeker-profile.entity.js';
import {
  JOB_SEEKER_PROFILE_REPOSITORY_PORT,
  type JobSeekerProfileRepositoryPort,
} from '../ports/job-seeker-profile-repository.port.js';

export interface SaveMyProfileInput {
  accountId: string;
  skills: string;
  experience: string;
  availability: string;
}

/**
 * `PUT /me/profile`. Required-field validation (`@IsNotEmpty()`) happens at
 * the DTO layer before this ever runs — this use case assumes it already
 * received complete data and always upserts.
 */
@Injectable()
export class SaveMyProfileUseCase {
  constructor(
    @Inject(JOB_SEEKER_PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: JobSeekerProfileRepositoryPort,
  ) {}

  async execute(input: SaveMyProfileInput): Promise<JobSeekerProfile> {
    return this.profileRepository.upsert(input);
  }
}
