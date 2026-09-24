import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '@catalog/domain/contracts';
import { Product } from '@catalog/domain/entities';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { S3Service } from '@/infrastructure/s3/s3.service';
import { ProfileService } from '@/modules/identity/application/services';

import { CategoryService } from './category.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let repository: IProductRepository;
  let profileService: ProfileService;
  let categoryService: CategoryService;
  let configService: ConfigService;
  let s3Service: S3Service;

  const createMockProduct = (
    id = 'product-id',
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' = 'ACTIVE',
    supplierId = 'supplier-id',
  ) => {
    return new Product(
      id,
      'sku-123',
      'Wooden Chair',
      'Description',
      99.99,
      100,
      1,
      2,
      '2 days',
      status as any,
      'category-id',
      supplierId,
      'company-id',
      'dimension-id',
      new Date(),
      new Date(),
      { id: 'category-id', title: 'Chairs', slug: 'chairs' },
      {
        id: supplierId,
        name: 'Supplier',
        email: 'supplier@example.com',
        emailVerified: true,
        image: null,
        role: 'SUPPLIER',
        banned: false,
      },
      {
        id: 'company-id',
        name: 'Furniture Corp',
        specializations: [],
        verificationStatus: 'APPROVED',
        ratingAvg: 4,
      },
      { id: 'dimension-id', width: 50, height: 90, depth: 50 },
      [],
      [],
    );
  };

  const mockProductRepository = {
    findAll: mock(() => Promise.resolve([])),
    findBySupplier: mock((_userId: string) => Promise.resolve([])),
    findOne: mock((_id: string) => Promise.resolve(null as any)),
    findRaw: mock((_id: string) => Promise.resolve(null as any)),
    create: mock(
      (_userId: string, _companyId: string, _skuDto: any, _dto: any) =>
        Promise.resolve(null as any),
    ),
    update: mock((_id: string, _dto: any) => Promise.resolve(null as any)),
    updateStatus: mock((_id: string, _status: any) =>
      Promise.resolve(null as any),
    ),
    delete: mock((_id: string) => Promise.resolve()),
  };

  const mockProfileService = {
    getEntityByUserId: mock((_userId: string) => Promise.resolve(null as any)),
  };

  const mockCategoryService = {
    findById: mock((_id: string) => Promise.resolve(null as any)),
  };

  const mockConfigService = {
    get: mock((key: string) => {
      if (key === 'S3_URL') return 'https://s3.amazonaws.com/bucket';
      return null;
    }),
  };

  const mockS3Service = {
    copyObject: mock((_source: string, _dest: string) => Promise.resolve()),
    deleteObject: mock((_key: string) => Promise.resolve()),
  };

  const mockAbility = {
    cannot: mock((_action: string, _subject: any) => false),
    can: mock((_action: string, _subject: any) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: ProfileService, useValue: mockProfileService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<IProductRepository>(PRODUCT_REPOSITORY);
    profileService = module.get<ProfileService>(ProfileService);
    categoryService = module.get<CategoryService>(CategoryService);
    configService = module.get<ConfigService>(ConfigService);
    s3Service = module.get<S3Service>(S3Service);

    mockProductRepository.findAll.mockClear();
    mockProductRepository.findBySupplier.mockClear();
    mockProductRepository.findOne.mockClear();
    mockProductRepository.findRaw.mockClear();
    mockProductRepository.create.mockClear();
    mockProductRepository.update.mockClear();
    mockProductRepository.updateStatus.mockClear();
    mockProductRepository.delete.mockClear();
    mockProfileService.getEntityByUserId.mockClear();
    mockCategoryService.findById.mockClear();
    mockS3Service.copyObject.mockClear();
    mockS3Service.deleteObject.mockClear();
    mockAbility.cannot.mockClear();
    mockAbility.cannot.mockImplementation(() => false);
  });

  describe('findAll', () => {
    it('should return all products mapped to response', async () => {
      const mockProduct = createMockProduct();
      mockProductRepository.findAll.mockImplementation(() =>
        Promise.resolve([mockProduct]),
      );

      const result = await service.findAll({ id: 'user-id' } as any);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('product-id');
    });

    it('should return unauthorized products layout if user is null', async () => {
      const mockProduct = createMockProduct();
      mockProductRepository.findAll.mockImplementation(() =>
        Promise.resolve([mockProduct]),
      );

      const result = await service.findAll(null);
      expect(result).toHaveLength(1);
      // In ProductMapper, unauthorized mapping might omit price or supplier etc.
      expect(result[0].id).toBe('product-id');
    });
  });

  describe('findMyProducts', () => {
    it('should return products owned by the supplier', async () => {
      const mockProduct = createMockProduct();
      mockProductRepository.findBySupplier.mockImplementation(() =>
        Promise.resolve([mockProduct]),
      );

      const result = await service.findMyProducts('supplier-id');
      expect(result).toHaveLength(1);
      expect(mockProductRepository.findBySupplier).toHaveBeenCalledWith(
        'supplier-id',
      );
    });
  });

  describe('findById', () => {
    it('should return product if found', async () => {
      const mockProduct = createMockProduct();
      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(mockProduct),
      );

      const result = await service.findById('product-id');
      expect(result.id).toBe('product-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(null),
      );
      expect(service.findById('product-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create product and process S3 images successfully', async () => {
      const user = { id: 'supplier-id', role: 'SUPPLIER' };
      const dto = {
        title: 'New Chair',
        description: 'New Description',
        price: 50,
        stock: 10,
        categoryId: 'category-id',
        images: [
          'products/image1.png',
          'http://localhost:4566/furniture-wholesale-bucket/catalog/product/GYP6-xxx/0.png',
        ],
      };

      const mockProfile = {
        companyId: 'company-id',
        company: { name: 'Company Name', abbreviation: 'COMP' },
      };

      mockProfileService.getEntityByUserId.mockImplementation(() =>
        Promise.resolve(mockProfile),
      );
      mockCategoryService.findById.mockImplementation(() =>
        Promise.resolve({ id: 'category-id' } as any),
      );

      const createdProduct = createMockProduct(
        'product-new',
        'ACTIVE',
        'supplier-id',
      );
      mockProductRepository.create.mockImplementation(() =>
        Promise.resolve(createdProduct),
      );

      const result = await service.create(user as any, dto as any);
      expect(result.id).toBe('product-new');
      expect(mockProductRepository.create).toHaveBeenCalled();
      expect(mockS3Service.copyObject).toHaveBeenCalled();
      expect(mockS3Service.deleteObject).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if supplier profile has no company', async () => {
      mockProfileService.getEntityByUserId.mockImplementation(() =>
        Promise.resolve({ companyId: null }),
      );
      const user = { id: 'supplier-id', role: 'SUPPLIER' };
      const dto = { title: 'Chair', categoryId: 'cat' };

      expect(service.create(user as any, dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update product if allowed by CASL ability', async () => {
      const rawProduct = { id: 'product-id', supplierId: 'supplier-id' };
      mockProductRepository.findRaw.mockImplementation(() =>
        Promise.resolve(rawProduct),
      );

      const updatedProduct = createMockProduct('product-id');
      mockProductRepository.update.mockImplementation(() =>
        Promise.resolve(updatedProduct),
      );

      const dto = { title: 'Updated Chair', images: [] };
      const result = await service.update(
        'product-id',
        dto,
        mockAbility as any,
      );
      expect(result.id).toBe('product-id');
    });

    it('should throw ForbiddenException if user lacks update ability', async () => {
      const rawProduct = { id: 'product-id', supplierId: 'another-supplier' };
      mockProductRepository.findRaw.mockImplementation(() =>
        Promise.resolve(rawProduct),
      );
      mockAbility.cannot.mockImplementation(() => true);

      expect(
        service.update(
          'product-id',
          { title: 'Updated' } as any,
          mockAbility as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update status if allowed', async () => {
      const rawProduct = { id: 'product-id', supplierId: 'supplier-id' };
      mockProductRepository.findRaw.mockImplementation(() =>
        Promise.resolve(rawProduct),
      );

      const updated = createMockProduct('product-id', 'ACTIVE');
      mockProductRepository.updateStatus.mockImplementation(() =>
        Promise.resolve(updated),
      );

      const result = await service.updateStatus(
        'product-id',
        'ACTIVE',
        mockAbility as any,
      );
      expect(result.id).toBe('product-id');
      expect(mockProductRepository.updateStatus).toHaveBeenCalledWith(
        'product-id',
        'ACTIVE',
      );
    });
  });

  describe('delete', () => {
    it('should delete product if allowed', async () => {
      const rawProduct = { id: 'product-id', supplierId: 'supplier-id' };
      mockProductRepository.findRaw.mockImplementation(() =>
        Promise.resolve(rawProduct),
      );

      await service.delete('product-id', mockAbility as any);
      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-id');
    });
  });
});
