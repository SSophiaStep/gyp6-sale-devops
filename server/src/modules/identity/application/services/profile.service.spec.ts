import {
  type IProfileRepository,
  PROFILE_REPOSITORY,
} from '@identity/domain/contracts';
import { Profile } from '@identity/domain/entities';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: IProfileRepository;

  const mockProfile = new Profile('profile-id', 'user-id', 'company-id', null);

  const mockProfileRepository = {
    findByUserId: mock((_userId: string) => Promise.resolve(null as any)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PROFILE_REPOSITORY,
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    repository = module.get<IProfileRepository>(PROFILE_REPOSITORY);

    mockProfileRepository.findByUserId.mockClear();
  });

  describe('getByUserId', () => {
    it('should return profile mapped to response if found', async () => {
      mockProfileRepository.findByUserId.mockImplementation(_userId =>
        Promise.resolve(mockProfile),
      );

      const result = await service.getByUserId('user-id');
      expect(result.id).toBe('profile-id');
      expect(result.companyId).toBe('company-id');
      expect(repository.findByUserId).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if profile not found by userId', async () => {
      mockProfileRepository.findByUserId.mockImplementation(_userId =>
        Promise.resolve(null),
      );

      expect(service.getByUserId('user-id')).rejects.toThrow(NotFoundException);
      expect(service.getByUserId('user-id')).rejects.toThrow(
        'Profile not found',
      );
    });
  });

  describe('getEntityByUserId', () => {
    it('should return raw entity if found', async () => {
      mockProfileRepository.findByUserId.mockImplementation(_userId =>
        Promise.resolve(mockProfile),
      );

      const result = await service.getEntityByUserId('user-id');
      expect(result).toBe(mockProfile);
      expect(repository.findByUserId).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if entity not found by userId', async () => {
      mockProfileRepository.findByUserId.mockImplementation(_userId =>
        Promise.resolve(null),
      );

      expect(service.getEntityByUserId('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
