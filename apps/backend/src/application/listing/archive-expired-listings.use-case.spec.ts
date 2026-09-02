import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { ArchiveExpiredListingsUseCase } from './archive-expired-listings.use-case.js';

function makeListingRepository(overrides: Partial<ListingRepositoryPort> = {}): ListingRepositoryPort {
  return {
    findPublished: async () => [],
    findById: async () => null,
    create: async () => {
      throw new Error('not used by this test');
    },
    archiveExpiredListings: async () => 0,
    ...overrides,
  };
}

describe('ArchiveExpiredListingsUseCase', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates straight to the repository and returns its count', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const archiveExpiredListings = vi.fn(async () => 3);
    const useCase = new ArchiveExpiredListingsUseCase(
      makeListingRepository({ archiveExpiredListings }),
    );

    const result = await useCase.execute();

    expect(result).toBe(3);
    expect(archiveExpiredListings).toHaveBeenCalledTimes(1);
  });

  it('logs a summary line when at least one Listing was archived', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const useCase = new ArchiveExpiredListingsUseCase(
      makeListingRepository({ archiveExpiredListings: async () => 2 }),
    );

    await useCase.execute();

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain('2');
  });

  it('does not log when nothing was archived', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const useCase = new ArchiveExpiredListingsUseCase(
      makeListingRepository({ archiveExpiredListings: async () => 0 }),
    );

    const result = await useCase.execute();

    expect(result).toBe(0);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
