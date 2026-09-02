import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArchiveExpiredListingsUseCase } from '../../application/listing/archive-expired-listings.use-case.js';

/**
 * This codebase's first scheduled job (Story 3.2, `@nestjs/schedule`).
 * Fires hourly and delegates straight to `ArchiveExpiredListingsUseCase` —
 * the trigger wiring itself isn't deeply tested (impractical/flaky per the
 * Verification notes); the archival business logic is what gets real
 * integration-test coverage, in `listing.repository.spec.ts`.
 *
 * Framework-coupled by design (`infrastructure/`) — kept as a thin
 * scheduling shell so Story 3.6 can register a sibling `@Cron` method here
 * for 7-day lapse-removal later, without touching this one's logic.
 */
@Injectable()
export class ListingArchivalScheduler {
  private readonly logger = new Logger(ListingArchivalScheduler.name);

  constructor(private readonly archiveExpiredListings: ArchiveExpiredListingsUseCase) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleArchivalSweep(): Promise<void> {
    try {
      await this.archiveExpiredListings.execute();
    } catch (error) {
      // A failed sweep just retries next hour — never crash the process
      // over a transient DB error inside a @Cron handler.
      this.logger.error('Archival sweep failed', error instanceof Error ? error.stack : error);
    }
  }
}
