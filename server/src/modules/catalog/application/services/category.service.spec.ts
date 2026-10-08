import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '@catalog/domain/contracts';
import { Category } from '@catalog/domain/entities';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: ICategoryRepository;

  const mockCategoryRepository = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock((_id: string) => Promise.resolve(null)),
    findBySlug: mock((_slug: string) => Promise.resolve(null)),
    create: mock((_name: string) => Promise.resolve(null as any)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<ICategoryRepository>(CATEGORY_REPOSITORY);

    mockCategoryRepository.findAll.mockClear();
    mockCategoryRepository.findById.mockClear();
    mockCategoryRepository.findBySlug.mockClear();
    mockCategoryRepository.create.mockClear();
  });

  describe('findAll', () => {
    it('should return all categories mapped to response', async () => {
      const mockCategories = [
        new Category('1', 'Chairs', 'chairs'),
        new Category('2', 'Tables', 'tables'),
      ];
      mockCategoryRepository.findAll.mockImplementation(() =>
        Promise.resolve(mockCategories),
      );

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Chairs',
        slug: 'chairs',
      });
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a category mapped to response if found', async () => {
      const mockCategory = new Category(
        '123',
        'Office Chairs',
        'office-chairs',
      );
      mockCategoryRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockCategory),
      );

      const result = await service.findById('123');
      expect(result).toEqual({
        id: '123',
        title: 'Office Chairs',
        slug: 'office-chairs',
      });
      expect(repository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if category not found by id', async () => {
      mockCategoryRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a category mapped to response if found by slug', async () => {
      const mockCategory = new Category(
        '456',
        'Kitchen Tables',
        'kitchen-tables',
      );
      mockCategoryRepository.findBySlug.mockImplementation(_slug =>
        Promise.resolve(mockCategory),
      );

      const result = await service.findBySlug('kitchen-tables');
      expect(result).toEqual({
        id: '456',
        title: 'Kitchen Tables',
        slug: 'kitchen-tables',
      });
      expect(repository.findBySlug).toHaveBeenCalledWith('kitchen-tables');
    });

    it('should throw NotFoundException if category not found by slug', async () => {
      mockCategoryRepository.findBySlug.mockImplementation(_slug =>
        Promise.resolve(null),
      );

      expect(service.findBySlug('some-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new category and return it mapped to response', async () => {
      const mockCategory = new Category('789', 'Sofas', 'sofas');
      mockCategoryRepository.create.mockImplementation(_name =>
        Promise.resolve(mockCategory),
      );

      const result = await service.create('Sofas');
      expect(result).toEqual({
        id: '789',
        title: 'Sofas',
        slug: 'sofas',
      });
      expect(repository.create).toHaveBeenCalledWith('Sofas');
    });
  });
});
