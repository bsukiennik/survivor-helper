import { describe, expect, it } from 'vitest';
import type { JobSeekerProfile } from '../../domain/profile/job-seeker-profile.entity.js';
import { GetMyProfileUseCase } from '../../application/profile/get-my-profile.use-case.js';
import { SaveMyProfileUseCase } from '../../application/profile/save-my-profile.use-case.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { ProfileController } from './profile.controller.js';
import { SaveProfileDto } from './dto/save-profile.dto.js';

const USER: AuthenticatedUser = { id: 'account-1', role: 'JobSeeker' };

function makeGetUseCaseStub(profile: JobSeekerProfile | null): GetMyProfileUseCase {
  return { execute: async () => profile } as unknown as GetMyProfileUseCase;
}

function makeSaveUseCaseStub(profile: JobSeekerProfile): SaveMyProfileUseCase {
  return { execute: async () => profile } as unknown as SaveMyProfileUseCase;
}

describe('ProfileController', () => {
  it('GET returns empty/null fields (not an error) when no profile exists yet', async () => {
    const controller = new ProfileController(makeGetUseCaseStub(null), makeSaveUseCaseStub({
      accountId: USER.id,
      skills: '',
      experience: '',
      availability: '',
      updatedAt: new Date(),
    }));

    const result = await controller.get(USER);

    expect(result).toEqual({
      skills: null,
      experience: null,
      availability: null,
      updatedAt: null,
    });
  });

  it('GET maps an existing profile to the response DTO', async () => {
    const profile: JobSeekerProfile = {
      accountId: USER.id,
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const controller = new ProfileController(
      makeGetUseCaseStub(profile),
      makeSaveUseCaseStub(profile),
    );

    const result = await controller.get(USER);

    expect(result).toEqual({
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('PUT passes the authenticated account id (not anything from the body) as the accountId to save', async () => {
    let executedWith: unknown;
    const profile: JobSeekerProfile = {
      accountId: USER.id,
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const saveUseCase = {
      execute: async (input: unknown) => {
        executedWith = input;
        return profile;
      },
    } as unknown as SaveMyProfileUseCase;
    const controller = new ProfileController(makeGetUseCaseStub(null), saveUseCase);
    const dto = new SaveProfileDto();
    dto.skills = 'Boulangerie';
    dto.experience = '3 ans';
    dto.availability = 'Immédiate';

    const result = await controller.save(USER, dto);

    expect(executedWith).toEqual({
      accountId: 'account-1',
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
    });
    expect(result).toEqual({
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
