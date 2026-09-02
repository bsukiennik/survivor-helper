import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArchiveExpiredListingsUseCase } from '../../application/listing/archive-expired-listings.use-case.js';
import { ListingArchivalScheduler } from './listing-archival.scheduler.js';

function makeArchiveExpiredListings(
  overrides: Partial<ArchiveExpiredListingsUseCase> = {},
): ArchiveExpiredListingsUseCase {
  return {
    execute: async () => 0,
    ...overrides,
  } as ArchiveExpiredListingsUseCase;
}

describe('ListingArchivalScheduler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to ArchiveExpiredListingsUseCase.execute() on each sweep', async () => {
    const execute = vi.fn(async () => 3);
    const scheduler = new ListingArchivalScheduler(makeArchiveExpiredListings({ execute }));

    await scheduler.handleArchivalSweep();

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('does not rethrow when the use case throws — a failed sweep just retries next hour', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const execute = vi.fn(async () => {
      throw new Error('transient DB error');
    });
    const scheduler = new ListingArchivalScheduler(makeArchiveExpiredListings({ execute }));

    await expect(scheduler.handleArchivalSweep()).resolves.toBeUndefined();
  });
});
