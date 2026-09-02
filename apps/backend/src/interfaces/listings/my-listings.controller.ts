import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PublishListingUseCase } from '../../application/listing/publish-listing.use-case.js';
import { EmployerNotVerifiedError } from '../../domain/profile/employer-not-verified.error.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { MyListingResponseDto } from './dto/my-listing-response.dto.js';

/**
 * `POST /me/listings` (Story 3.2) — a sibling controller/module to
 * `listings.controller.ts`/`listings.module.ts`, which stay untouched: that
 * controller's own comment says it is unauthenticated by design (Code Map).
 * Same guard stack as `EmployerProfileController`
 * (`@UseGuards(JwtAuthGuard, RolesGuard) @Roles('Employer')`).
 */
@ApiTags('listings')
@ApiBearerAuth()
@Controller('me/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Employer')
export class MyListingsController {
  constructor(private readonly publishListing: PublishListingUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Publish a new Listing as the authenticated, verified Employer' })
  @ApiCreatedResponse({ type: MyListingResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ): Promise<MyListingResponseDto> {
    try {
      const listing = await this.publishListing.execute({
        employerId: user.id,
        title: dto.title,
        location: dto.location,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distributionRadiusKm: dto.distributionRadiusKm,
      });
      return MyListingResponseDto.fromDomain(listing);
    } catch (error) {
      if (error instanceof EmployerNotVerifiedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
