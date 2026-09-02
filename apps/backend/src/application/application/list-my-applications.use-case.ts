import { Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY_PORT,
  type ApplicationRepositoryPort,
  type MyApplicationRow,
} from '../ports/application-repository.port.js';

/**
 * `GET /me/applications` (Story 2.5). Thin passthrough mirroring
 * `GetMyBadgesUseCase` — a fresh account with zero Applications yet is not
 * an error, just an empty array (I/O matrix).
 */
@Injectable()
export class ListMyApplicationsUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY_PORT)
    private readonly applicationRepository: ApplicationRepositoryPort,
  ) {}

  async execute(jobSeekerId: string): Promise<MyApplicationRow[]> {
    return this.applicationRepository.findByJobSeekerWithListing(jobSeekerId);
  }
}
