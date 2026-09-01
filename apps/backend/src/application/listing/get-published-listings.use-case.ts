import { Inject, Injectable } from '@nestjs/common';
import type { Listing } from '../../domain/listing/listing.entity.js';
import {
  LISTING_REPOSITORY_PORT,
  type ListingRepositoryPort,
} from '../ports/listing-repository.port.js';

/**
 * Realizes the public, unauthenticated read path (FR1/FR2). Only ever
 * returns `published` Listings — the repository adapter enforces that filter
 * at the query level (see ListingRepositoryPort.findPublished).
 */
@Injectable()
export class GetPublishedListingsUseCase {
  constructor(
    @Inject(LISTING_REPOSITORY_PORT)
    private readonly listingRepository: ListingRepositoryPort,
  ) {}

  async execute(): Promise<Listing[]> {
    return this.listingRepository.findPublished();
  }
}
