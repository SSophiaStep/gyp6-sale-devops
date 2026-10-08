import {
  type ISpaceRepository,
  SPACE_REPOSITORY,
} from '@catalog/domain/contracts';
import { Space } from '@catalog/domain/entities';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { SpaceService } from './space.service';

describe('SpaceService', () => {
  let service: SpaceService;
  let repository: ISpaceRepository;

  const mockSpaceRepository = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock((_id: string) => Promise.resolve(null)),
    findBySlug: mock((_slug: string) => Promise.resolve(null)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceService,
        {
          provide: SPACE_REPOSITORY,
          useValue: mockSpaceRepository,
        },
      ],
    }).compile();

    service = module.get<SpaceService>(SpaceService);
    repository = module.get<ISpaceRepository>(SPACE_REPOSITORY);

    mockSpaceRepository.findAll.mockClear();
    mockSpaceRepository.findById.mockClear();
    mockSpaceRepository.findBySlug.mockClear();
  });

  describe('findAll', () => {
    it('should return all spaces mapped to response', async () => {
      const mockSpaces = [
        new Space('1', 'Living Room', 'living-room'),
        new Space('2', 'Bedroom', 'bedroom'),
      ];
      mockSpaceRepository.findAll.mockImplementation(() =>
        Promise.resolve(mockSpaces),
      );

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Living Room',
        slug: 'living-room',
      });
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return space if found', async () => {
      const mockSpace = new Space('123', 'Kitchen', 'kitchen');
      mockSpaceRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockSpace),
      );

      const result = await service.findById('123');
      expect(result).toEqual({
        id: '123',
        title: 'Kitchen',
        slug: 'kitchen',
      });
      expect(repository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if not found', async () => {
      mockSpaceRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return space if found by slug', async () => {
      const mockSpace = new Space('456', 'Bathroom', 'bathroom');
      mockSpaceRepository.findBySlug.mockImplementation(_slug =>
        Promise.resolve(mockSpace),
      );

      const result = await service.findBySlug('bathroom');
      expect(result).toEqual({
        id: '456',
        title: 'Bathroom',
        slug: 'bathroom',
      });
      expect(repository.findBySlug).toHaveBeenCalledWith('bathroom');
    });

    it('should throw NotFoundException if not found by slug', async () => {
      mockSpaceRepository.findBySlug.mockImplementation(_slug =>
        Promise.resolve(null),
      );

      expect(service.findBySlug('some-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
