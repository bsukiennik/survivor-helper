import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPublishedListingsUseCase } from '../../application/listing/get-published-listings.use-case.js';
import { ListingDto } from './dto/listing.dto.js';

/**
 * Public, unauthenticated read path (FR1/FR2). No auth guard — this endpoint
 * intentionally has none, unlike every Administrator/Employer-only route
 * (AD-15 does not apply here).
 */
@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly getPublishedListings: GetPublishedListingsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List every published Listing (no authentication required)' })
  @ApiOkResponse({ type: ListingDto, isArray: true })
  async list(): Promise<ListingDto[]> {
    const listings = await this.getPublishedListings.execute();
    return listings.map((listing) => ListingDto.fromDomain(listing));
  }
}
