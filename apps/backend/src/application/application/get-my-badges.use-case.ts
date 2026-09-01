import { Inject, Injectable } from '@nestjs/common';
import { PERMIS_DE_TRAVAIL_THRESHOLD } from '../../domain/application/permis-de-travail.constant.js';
import {
  APPLICATION_REPOSITORY_PORT,
  type ApplicationRepositoryPort,
} from '../ports/application-repository.port.js';

export interface MyBadges {
  catchCount: number;
  permisDeTravailUnlocked: boolean;
}

/**
 * `GET /me/badges` (Story 2.4). A fresh account with zero catches yet is
 * not an error — `catchCount: 0, permisDeTravailUnlocked: false` is a
 * normal 200 (I/O matrix), mirroring `GetMyProfileUseCase`'s
 * never-404-on-empty-state pattern.
 *
 * `permisDeTravailUnlocked` is always derived live from `catchCount >= 10`
 * here too, never read from a stored flag (Boundaries & Constraints,
 * Never) — same rule as the Catch response, just via the plain
 * (non-transactional) count.
 */
@Injectable()
export class GetMyBadgesUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY_PORT)
    private readonly applicationRepository: ApplicationRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<MyBadges> {
    const catchCount = await this.applicationRepository.countByJobSeeker(accountId);
    return { catchCount, permisDeTravailUnlocked: catchCount >= PERMIS_DE_TRAVAIL_THRESHOLD };
  }
}
