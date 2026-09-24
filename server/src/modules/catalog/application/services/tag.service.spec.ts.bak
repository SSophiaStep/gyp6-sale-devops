import { type ITagRepository, TAG_REPOSITORY } from '@catalog/domain/contracts';
import { Tag } from '@catalog/domain/entities';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { TagService } from './tag.service';

describe('TagService', () => {
  let service: TagService;
  let repository: ITagRepository;

  const mockTagRepository = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock((_id: string) => Promise.resolve(null)),
    findBySlug: mock((_slug: string) => Promise.resolve(null)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: TAG_REPOSITORY,
          useValue: mockTagRepository,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    repository = module.get<ITagRepository>(TAG_REPOSITORY);

    mockTagRepository.findAll.mockClear();
    mockTagRepository.findById.mockClear();
    mockTagRepository.findBySlug.mockClear();
  });

  describe('findAll', () => {
    it('should return all tags mapped to response', async () => {
      const mockTags = [
        new Tag('1', 'Tag 1', 'tag-1'),
        new Tag('2', 'Tag 2', 'tag-2'),
      ];
      mockTagRepository.findAll.mockImplementation(() =>
        Promise.resolve(mockTags),
      );

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Tag 1',
        slug: 'tag-1',
      });
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a tag mapped to response if found', async () => {
      const mockTag = new Tag('123', 'Sample Tag', 'sample-tag');
      mockTagRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockTag),
      );

      const result = await service.findById('123');
      expect(result).toEqual({
        id: '123',
        title: 'Sample Tag',
        slug: 'sample-tag',
      });
      expect(repository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if tag not found by id', async () => {
      mockTagRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a tag mapped to response if found by slug', async () => {
      const mockTag = new Tag('456', 'Another Tag', 'another-tag');
      mockTagRepository.findBySlug.mockImplementation(_slug =>
        Promise.resolve(mockTag),
      );

      const result = await service.findBySlug('another-tag');
      expect(result).toEqual({
        id: '456',
        title: 'Another Tag',
        slug: 'another-tag',
      });
      expect(repository.findBySlug).toHaveBeenCalledWith('another-tag');
    });

    it('should throw NotFoundException if tag not found by slug', async () => {
      mockTagRepository.findBySlug.mockImplementation(_slug =>
        Promise.resolve(null),
      );

      expect(service.findBySlug('some-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
