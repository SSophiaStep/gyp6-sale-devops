import {
  COMPANY_REPOSITORY,
  type ICompanyRepository,
} from '@identity/domain/contracts';
import { Company } from '@identity/domain/entities';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { COMPANY_STATUSES } from '@/common/constants';

import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: ICompanyRepository;

  const mockCompany = new Company(
    'company-id',
    'Furniture Corp',
    'FC',
    '12345678',
    'Description',
    'corp@furniture.com',
    'Showroom 1',
    ['Sofa', 'Chairs'],
    '2 weeks',
    COMPANY_STATUSES.PENDING,
    'Net 30',
    4.5,
    10,
    new Date(),
  );

  const mockCompanyRepository = {
    findByTaxCode: mock((_taxCode: string) => Promise.resolve(null as any)),
    findById: mock((_id: string) => Promise.resolve(null as any)),
    update: mock((_id: string, _dto: any) => Promise.resolve(null as any)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: COMPANY_REPOSITORY,
          useValue: mockCompanyRepository,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    repository = module.get<ICompanyRepository>(COMPANY_REPOSITORY);

    mockCompanyRepository.findByTaxCode.mockClear();
    mockCompanyRepository.findById.mockClear();
    mockCompanyRepository.update.mockClear();
  });

  describe('findByTaxCode', () => {
    it('should return company if found', async () => {
      mockCompanyRepository.findByTaxCode.mockImplementation(_taxCode =>
        Promise.resolve(mockCompany),
      );

      const result = await service.findByTaxCode('12345678');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('company-id');
      expect(result!.name).toBe('Furniture Corp');
      expect(repository.findByTaxCode).toHaveBeenCalledWith('12345678');
    });

    it('should throw NotFoundException if company not found by tax code', async () => {
      mockCompanyRepository.findByTaxCode.mockImplementation(_taxCode =>
        Promise.resolve(null),
      );

      expect(service.findByTaxCode('12345678')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return company if found', async () => {
      mockCompanyRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockCompany),
      );

      const result = await service.findById('company-id');
      expect(result.id).toBe('company-id');
      expect(repository.findById).toHaveBeenCalledWith('company-id');
    });

    it('should throw NotFoundException if company not found by id', async () => {
      mockCompanyRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(service.findById('company-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update company and return it if company exists', async () => {
      mockCompanyRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockCompany),
      );
      mockCompanyRepository.update.mockImplementation((id, dto) =>
        Promise.resolve({ ...mockCompany, ...dto }),
      );

      const updateDto = { description: 'Updated Description' };
      const result = await service.update('company-id', updateDto);
      expect(result.description).toBe('Updated Description');
      expect(repository.findById).toHaveBeenCalledWith('company-id');
      expect(repository.update).toHaveBeenCalledWith('company-id', updateDto);
    });

    it('should throw NotFoundException if updating non-existent company', async () => {
      mockCompanyRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(
        service.update('company-id', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
