import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Application } from '../../domain/application/application.entity.js';
import { PERMIS_DE_TRAVAIL_THRESHOLD } from '../../domain/application/permis-de-travail.constant.js';
import { ListingNotFoundError } from '../../domain/listing/listing-not-found.error.js';
import {
  APPLICATION_REPOSITORY_PORT,
  type ApplicationRepositoryPort,
} from '../ports/application-repository.port.js';
import { LISTING_REPOSITORY_PORT, type ListingRepositoryPort } from '../ports/listing-repository.port.js';

export interface ApplyToListingInput {
  jobSeekerId: string;
  listingId: string;
}

export interface ApplyToListingResult {
  application: Application;
  catchCount: number;
  permisDeTravailUnlocked: boolean;
}

/**
 * `POST /me/applications` — this codebase's first transactional use case
 * (Design Notes). The row-lock + insert-or-no-op itself lives behind
 * `ApplicationRepositoryPort.applyToListing` (infrastructure owns the
 * `db.transaction()`/`.for('update')` mechanics, AD-1); this use case only
 * orchestrates the pre-transaction existence check, the AD-6 log line, and
 * (Story 2.4) the `permisDeTravailUnlocked` derivation.
 *
 * Returns the created `Application` plus the recomputed `catchCount` and
 * `permisDeTravailUnlocked` (true only exactly on the 10th distinct catch —
 * never re-fired past it), or `null` when the (jobSeekerId, listingId) pair
 * already existed — a silent no-op, not an error (I/O matrix) — so the
 * controller can map created vs already-applied to 201 vs 200.
 */
@Injectable()
export class ApplyToListingUseCase {
  private readonly logger = new Logger(ApplyToListingUseCase.name);

  constructor(
    @Inject(LISTING_REPOSITORY_PORT)
    private readonly listingRepository: ListingRepositoryPort,
    @Inject(APPLICATION_REPOSITORY_PORT)
    private readonly applicationRepository: ApplicationRepositoryPort,
  ) {}

  async execute(input: ApplyToListingInput): Promise<ApplyToListingResult | null> {
    // Unknown or non-published listingId is rejected before any
    // transaction/lock opens (I/O matrix) — the controller maps this error
    // to 404. Published-only matches the only visibility path that exists
    // today (the map only ever shows `findPublished()` results), and avoids
    // leaking the existence of a non-public Listing to a crafted request.
    const listing = await this.listingRepository.findById(input.listingId);
    if (!listing || listing.status !== 'published') {
      throw new ListingNotFoundError(input.listingId);
    }

    const result = await this.applicationRepository.applyToListing({
      jobSeekerId: input.jobSeekerId,
      listingId: input.listingId,
    });

    if (!result) {
      return null;
    }

    // AD-6 — one line, only on the created path, never on the no-op
    // (repeat catch) path.
    this.logger.log(
      `Application created: jobSeekerId=${input.jobSeekerId} listingId=${input.listingId} at=${new Date().toISOString()}`,
    );

    // Only true exactly on the 10th distinct catch — a fresh (never
    // stored) derivation from the just-recomputed `catchCount`, so it never
    // re-fires on the 11th+ (Boundaries & Constraints, Never).
    const permisDeTravailUnlocked = result.catchCount === PERMIS_DE_TRAVAIL_THRESHOLD;
    if (permisDeTravailUnlocked) {
      this.logger.log(`Permis de Travail unlocked: jobSeekerId=${input.jobSeekerId}`);
    }

    return { ...result, permisDeTravailUnlocked };
  }
}
