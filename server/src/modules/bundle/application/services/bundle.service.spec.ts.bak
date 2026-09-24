import {
  BUNDLE_REPOSITORY,
  type IBundleRepository,
} from '@bundle/domain/contracts';
import { Bundle, BundleItem } from '@bundle/domain/entities';
import {
  BundleNotFoundException,
  BundleNotSharedError,
  CannotForkSupplierBundleError,
} from '@bundle/domain/exceptions';
import { ProductService, SpaceService } from '@catalog/application/services';
import { Product, Space } from '@catalog/domain/entities';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { BundleService } from './bundle.service';

describe('BundleService', () => {
  let service: BundleService;
  let repository: IBundleRepository;
  let spaceService: SpaceService;
  let productService: ProductService;
  let configService: ConfigService;

  const mockSpace = new Space(
    'space-id',
    'Living Room',
    'living-room',
    new Date(),
    new Date(),
  );
  const mockProduct = new Product(
    'product-id',
    'sku-abc',
    'title-abc',
    'desc-abc',
    100,
    10,
    'ACTIVE',
    'category-id',
    'supplier-id',
    'company-id',
    [],
    new Date(),
    new Date(),
    null,
    null,
    null,
  );

  const createMockBundle = (
    id = 'bundle-id',
    type: 'SUPPLIER' | 'USER' = 'USER',
    userId = 'user-id',
  ) => {
    return new Bundle(
      id,
      type,
      1,
      userId,
      'space-id',
      null,
      [],
      new Date(),
      new Date(),
      'My Bundle',
      'Desc',
      'DRAFT',
      false,
      null,
      mockSpace,
    );
  };

  const mockBundleRepository = {
    findAllByUserId: mock((_userId: string, _type: any) => Promise.resolve([])),
    findAllSuppliers: mock((_params: any) => Promise.resolve([])),
    findById: mock((_id: string) => Promise.resolve(null as any)),
    findByShareToken: mock((_token: string) => Promise.resolve(null as any)),
    create: mock((_entity: Bundle) => Promise.resolve(_entity)),
    update: mock((_id: string, _dto: any) => Promise.resolve(null as any)),
    findRaw: mock((_id: string) => Promise.resolve(null as any)),
    addItem: mock((_id: string, _item: BundleItem) =>
      Promise.resolve(null as any),
    ),
    removeItem: mock((_id: string) => Promise.resolve()),
    delete: mock((_id: string) => Promise.resolve()),
  };

  const mockSpaceService = {
    findById: mock((_id: string) => Promise.resolve(null as any)),
  };

  const mockProductService = {
    findById: mock((_id: string) => Promise.resolve(null as any)),
  };

  const mockConfigService = {
    get: mock((key: string) => {
      if (key === 'BASE_URL') return 'http://localhost:8000';
      return null;
    }),
  };

  const mockAbility = {
    cannot: mock((_action: string, _subject: any) => false),
    can: mock((_action: string, _subject: any) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleService,
        { provide: BUNDLE_REPOSITORY, useValue: mockBundleRepository },
        { provide: SpaceService, useValue: mockSpaceService },
        { provide: ProductService, useValue: mockProductService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BundleService>(BundleService);
    repository = module.get<IBundleRepository>(BUNDLE_REPOSITORY);
    spaceService = module.get<SpaceService>(SpaceService);
    productService = module.get<ProductService>(ProductService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear mocks
    mockBundleRepository.findAllByUserId.mockClear();
    mockBundleRepository.findAllSuppliers.mockClear();
    mockBundleRepository.findById.mockClear();
    mockBundleRepository.findByShareToken.mockClear();
    mockBundleRepository.create.mockClear();
    mockBundleRepository.update.mockClear();
    mockBundleRepository.findRaw.mockClear();
    mockBundleRepository.addItem.mockClear();
    mockBundleRepository.removeItem.mockClear();
    mockBundleRepository.delete.mockClear();
    mockSpaceService.findById.mockClear();
    mockProductService.findById.mockClear();
    mockAbility.cannot.mockClear();
    mockAbility.cannot.mockImplementation(() => false);
  });

  describe('findAllByUser', () => {
    it('should return mapped bundles', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findAllByUserId.mockImplementation(() =>
        Promise.resolve([mockBundle]),
      );

      const result = await service.findAllByUser('user-id');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bundle-id');
    });
  });

  describe('findAllSuppliers', () => {
    it('should return mapped bundles for supplier parameters', async () => {
      const mockBundle = createMockBundle(
        'bundle-supplier',
        'SUPPLIER',
        'supplier-id',
      );
      mockBundleRepository.findAllSuppliers.mockImplementation(() =>
        Promise.resolve([mockBundle]),
      );

      const result = await service.findAllSuppliers({
        supplierId: 'supplier-id',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bundle-supplier');
    });
  });

  describe('findById', () => {
    it('should return mapped bundle if found', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );

      const result = await service.findById('bundle-id');
      expect(result.id).toBe('bundle-id');
    });

    it('should throw BundleNotFoundException if not found', async () => {
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(null),
      );
      expect(service.findById('bundle-id')).rejects.toThrow(
        BundleNotFoundException,
      );
    });
  });

  describe('findByShareToken', () => {
    it('should return mapped bundle if found', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findByShareToken.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );

      const result = await service.findByShareToken('token');
      expect(result.id).toBe('bundle-id');
    });

    it('should throw BundleNotSharedError if not found', async () => {
      mockBundleRepository.findByShareToken.mockImplementation(() =>
        Promise.resolve(null),
      );
      expect(service.findByShareToken('token')).rejects.toThrow(
        BundleNotSharedError,
      );
    });
  });

  describe('create', () => {
    it('should create bundle if role matches bundle type', async () => {
      mockSpaceService.findById.mockImplementation(() =>
        Promise.resolve(mockSpace),
      );
      const user = { id: 'user-id', role: 'SUPPLIER' };
      const dto = {
        name: 'New Bundle',
        bundleType: 'SUPPLIER' as const,
        spaceTypeId: 'space-id',
      };

      const result = await service.create(user as any, dto);
      expect(result.name).toBe('New Bundle');
      expect(mockBundleRepository.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if buyer tries to create supplier bundle', async () => {
      const user = { id: 'user-id', role: 'BUYER' };
      const dto = {
        name: 'New Bundle',
        bundleType: 'SUPPLIER' as const,
        spaceTypeId: 'space-id',
      };

      expect(service.create(user as any, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if space type is not found', async () => {
      mockSpaceService.findById.mockImplementation(() => Promise.resolve(null));
      const user = { id: 'user-id', role: 'SUPPLIER' };
      const dto = {
        name: 'New Bundle',
        bundleType: 'USER' as const,
        spaceTypeId: 'space-id',
      };

      expect(service.create(user as any, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update bundle if allowed', async () => {
      const raw = { id: 'bundle-id', userId: 'user-id' };
      mockBundleRepository.findRaw.mockImplementation(() =>
        Promise.resolve(raw),
      );
      const mockBundle = createMockBundle();
      mockBundleRepository.update.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );

      const result = await service.update(
        'bundle-id',
        { name: 'Updated' },
        mockAbility as any,
      );
      expect(result.id).toBe('bundle-id');
    });

    it('should throw ForbiddenException if update not allowed', async () => {
      const raw = { id: 'bundle-id', userId: 'another-user' };
      mockBundleRepository.findRaw.mockImplementation(() =>
        Promise.resolve(raw),
      );
      mockAbility.cannot.mockImplementation(() => true);

      expect(
        service.update('bundle-id', { name: 'Updated' }, mockAbility as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('share & unshare', () => {
    it('should enable sharing if owned', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );
      mockBundleRepository.update.mockImplementation((id, data) =>
        Promise.resolve({ ...mockBundle, ...data }),
      );

      const result = await service.share('bundle-id', { id: 'user-id' } as any);
      expect(result.isShared).toBe(true);
      expect(result.shareToken).not.toBeNull();
    });

    it('should disable sharing if owned', async () => {
      const mockBundle = createMockBundle();
      mockBundle.enableSharing();
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );
      mockBundleRepository.update.mockImplementation((id, data) =>
        Promise.resolve({ ...mockBundle, ...data }),
      );

      const result = await service.unshare('bundle-id', {
        id: 'user-id',
      } as any);
      expect(result.isShared).toBe(false);
      expect(result.shareToken).toBeNull();
    });
  });

  describe('fork', () => {
    it('should duplicate a user bundle to a new owner', async () => {
      const mockBundle = createMockBundle('bundle-id', 'USER', 'owner-1');
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );

      const result = await service.fork('bundle-id', { id: 'owner-2' } as any);
      expect(result.name).toBe('My Bundle (copy)');
    });

    it('should throw error if bundle is a SUPPLIER bundle', async () => {
      const mockBundle = createMockBundle('bundle-id', 'SUPPLIER', 'owner-1');
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );

      expect(
        service.fork('bundle-id', { id: 'owner-2' } as any),
      ).rejects.toThrow(CannotForkSupplierBundleError);
    });
  });

  describe('addItem', () => {
    it('should add a product item to a user bundle successfully', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );
      mockProductService.findById.mockImplementation(() =>
        Promise.resolve(mockProduct as any),
      );

      const updatedBundle = createMockBundle();
      mockBundleRepository.addItem.mockImplementation(() =>
        Promise.resolve(updatedBundle),
      );

      const result = await service.addItem(
        'bundle-id',
        { productId: 'product-id', quantity: 3, priceSnapshot: 100 },
        { id: 'user-id' } as any,
      );
      expect(result.id).toBe('bundle-id');
    });

    it('should throw NotFoundException if product is not found', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );
      mockProductService.findById.mockImplementation(() =>
        Promise.resolve(null),
      );

      expect(
        service.addItem(
          'bundle-id',
          { productId: 'nonexistent', quantity: 3, priceSnapshot: 100 },
          { id: 'user-id' } as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully if owned', async () => {
      const mockBundle = createMockBundle();
      mockBundleRepository.findById.mockImplementation(() =>
        Promise.resolve(mockBundle),
      );

      await service.removeItem('bundle-id', 'item-id', {
        id: 'user-id',
      } as any);
      expect(mockBundleRepository.removeItem).toHaveBeenCalledWith('item-id');
    });
  });

  describe('delete', () => {
    it('should delete if allowed', async () => {
      const raw = { id: 'bundle-id', userId: 'user-id' };
      mockBundleRepository.findRaw.mockImplementation(() =>
        Promise.resolve(raw),
      );

      await service.delete('bundle-id', mockAbility as any);
      expect(mockBundleRepository.delete).toHaveBeenCalledWith('bundle-id');
    });
  });
});
