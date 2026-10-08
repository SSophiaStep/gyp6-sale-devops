import {
  DIMENSION_REPOSITORY,
  type IDimensionRepository,
} from '@catalog/domain/contracts';
import { Dimension } from '@catalog/domain/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { DimensionService } from './dimension.service';

describe('DimensionService', () => {
  let service: DimensionService;
  let repository: IDimensionRepository;

  const mockDimensionRepository = {
    findAll: mock(() => Promise.resolve([])),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DimensionService,
        {
          provide: DIMENSION_REPOSITORY,
          useValue: mockDimensionRepository,
        },
      ],
    }).compile();

    service = module.get<DimensionService>(DimensionService);
    repository = module.get<IDimensionRepository>(DIMENSION_REPOSITORY);

    mockDimensionRepository.findAll.mockClear();
  });

  describe('findAll', () => {
    it('should return all dimensions mapped to response', async () => {
      const mockDimensions = [
        new Dimension('1', 10, 20, 30),
        new Dimension('2', 50, 60, 70),
      ];
      mockDimensionRepository.findAll.mockImplementation(() =>
        Promise.resolve(mockDimensions),
      );

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        width: 10,
        height: 20,
        depth: 30,
      });
      expect(repository.findAll).toHaveBeenCalled();
    });
  });
});
