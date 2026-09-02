import { Inject, Injectable, Logger } from '@nestjs/common';
import { LISTING_REPOSITORY_PORT, type ListingRepositoryPort } from '../ports/listing-repository.port.js';

/**
 * The 30-day archival sweep's business logic (Story 3.2), triggered hourly
 * by `infrastructure/scheduling/listing-archival.scheduler.ts`'s `@Cron`.
 * Kept deliberately generic/reusable — just delegates to the repository's
 * bulk `UPDATE ... RETURNING` — so Story 3.6 can add a sibling `@Cron`
 * method (7-day lapse-removal) later without extending this one's logic
 * (Boundaries & Constraints, Never).
 */
@Injectable()
export class ArchiveExpiredListingsUseCase {
  private readonly logger = new Logger(ArchiveExpiredListingsUseCase.name);

  constructor(
    @Inject(LISTING_REPOSITORY_PORT)
    private readonly listingRepository: ListingRepositoryPort,
  ) {}

  async execute(): Promise<number> {
    const archivedCount = await this.listingRepository.archiveExpiredListings();
    if (archivedCount > 0) {
      this.logger.log(`Archived ${archivedCount} Listing(s) past their 30-day lifetime.`);
    }
    return archivedCount;
  }
}
