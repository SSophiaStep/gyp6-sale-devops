import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '@catalog/domain/contracts/product.contract';
import { Product } from '@catalog/domain/entities';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  type IOrderRepository,
  ORDER_REPOSITORY,
} from '@order/domain/contracts/order.contract';
import { Order, OrderItem, SubOrder } from '@order/domain/entities';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { MailService } from '@/infrastructure/mail/mail.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BundleService } from '@/modules/bundle/application/services/bundle.service';

import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: IOrderRepository;
  let productRepository: IProductRepository;
  let bundleService: BundleService;
  let prismaService: PrismaService;
  let mailService: MailService;
  let configService: ConfigService;

  const mockProduct = new Product(
    'product-1',
    'sku-1',
    'Table',
    'A nice table',
    100,
    50, // stock
    1,
    1,
    '1 day',
    'ACTIVE',
    'cat-1',
    'supplier-1',
    'manufacturer-1',
    'dim-1',
    new Date(),
    new Date(),
    { id: 'cat-1', title: 'Furniture', slug: 'furniture' },
    {
      id: 'supplier-1',
      name: 'Supplier',
      email: 'supplier@example.com',
      emailVerified: true,
      image: null,
      role: 'SUPPLIER',
      banned: false,
    },
    {
      id: 'company-1',
      name: 'Supplier Corp',
      specializations: [],
      verificationStatus: 'APPROVED',
      ratingAvg: 5,
    },
    { id: 'dim-1', width: 10, height: 10, depth: 10 },
    [],
    [],
  );

  const mockOrderRepository = {
    create: mock((_order: Order) => Promise.resolve(_order)),
    findAllByBuyerId: mock((_buyerId: string) => Promise.resolve([])),
    findAllBySupplierId: mock((_supplierId: string) => Promise.resolve([])),
    findById: mock((_id: string) => Promise.resolve(null as any)),
    findSubOrderById: mock((_id: string) => Promise.resolve(null as any)),
    updateStatus: mock((_id: string, _status: any) =>
      Promise.resolve(null as any),
    ),
    updateSubOrderStatus: mock((_id: string, _status: any) =>
      Promise.resolve(null as any),
    ),
  };

  const mockProductRepository = {
    findOne: mock((_id: string) => Promise.resolve(null as any)),
  };

  const mockBundleService = {
    findById: mock((_id: string) => Promise.resolve(null as any)),
  };

  const mockMailService = {
    sendOrderConfirmation: mock(() => Promise.resolve()),
    sendSupplierNotification: mock(() => Promise.resolve()),
    sendOrderConfirmedNotification: mock(() => Promise.resolve()),
    sendOrderShippedNotification: mock(() => Promise.resolve()),
  };

  const mockPrismaService = {
    product: {
      update: mock(() => Promise.resolve({} as any)),
    },
  };

  const mockConfigService = {
    get: mock((key: string) => {
      if (key === 'BASE_URL') return 'http://localhost:8000';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: BundleService, useValue: mockBundleService },
        { provide: MailService, useValue: mockMailService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<IOrderRepository>(ORDER_REPOSITORY);
    productRepository = module.get<IProductRepository>(PRODUCT_REPOSITORY);
    bundleService = module.get<BundleService>(BundleService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);

    mockOrderRepository.create.mockClear();
    mockOrderRepository.findAllByBuyerId.mockClear();
    mockOrderRepository.findAllBySupplierId.mockClear();
    mockOrderRepository.findById.mockClear();
    mockOrderRepository.findSubOrderById.mockClear();
    mockOrderRepository.updateStatus.mockClear();
    mockOrderRepository.updateSubOrderStatus.mockClear();
    mockProductRepository.findOne.mockClear();
    mockBundleService.findById.mockClear();
    mockMailService.sendOrderConfirmation.mockClear();
    mockMailService.sendSupplierNotification.mockClear();
    mockMailService.sendOrderConfirmedNotification.mockClear();
    mockMailService.sendOrderShippedNotification.mockClear();
    mockPrismaService.product.update.mockClear();
  });

  describe('create', () => {
    it('should create an order for a valid product successfully', async () => {
      const user = {
        id: 'buyer-1',
        role: 'BUYER',
        email: 'buyer@example.com',
        name: 'John Buyer',
      };
      const dto = {
        items: [{ productId: 'product-1', quantity: 2, priceSnapshot: 100 }],
        shippingAddress: '123 Main St',
      };

      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(mockProduct),
      );
      mockOrderRepository.create.mockImplementation((order: Order) => {
        return Promise.resolve(
          new Order(
            order.id,
            order.buyerId,
            order.status,
            order.totalAmount,
            order.platformFee,
            order.subOrders.map(
              so =>
                new SubOrder(
                  so.id,
                  so.orderId,
                  so.status,
                  so.supplierId,
                  so.sourceBundleId,
                  so.items,
                  so.createdAt,
                  so.updatedAt,
                  {
                    id: so.supplierId,
                    name: 'Supplier Name',
                    email: 'supplier@example.com',
                    role: 'SUPPLIER',
                    banned: false,
                    emailVerified: true,
                  } as any,
                  {
                    id: order.buyerId,
                    name: 'John Buyer',
                    email: 'buyer@example.com',
                    role: 'BUYER',
                    banned: false,
                    emailVerified: true,
                  } as any,
                ),
            ),
            order.createdAt,
            order.updatedAt,
            {
              id: order.buyerId,
              name: 'John Buyer',
              email: 'buyer@example.com',
              role: 'BUYER',
              banned: false,
              emailVerified: true,
            } as any,
            order.shippingAddress,
          ),
        );
      });

      const result = await service.create(user as any, dto);

      expect(result.id).toBeDefined();
      expect(result.totalAmount).toBe(200);
      expect(result.platformFee).toBe(8); // 4%
      expect(orderRepository.create).toHaveBeenCalled();

      // Allow async event loop task queue processing for enqueueOrderEmails
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mailService.sendOrderConfirmation).toHaveBeenCalled();
      expect(mailService.sendSupplierNotification).toHaveBeenCalled();
    });

    it('should create an order for a bundle successfully', async () => {
      const user = {
        id: 'buyer-1',
        role: 'BUYER',
        email: 'buyer@example.com',
        name: 'John Buyer',
      };
      const dto = {
        items: [{ bundleId: 'bundle-1', quantity: 2, priceSnapshot: 200 }],
      };

      const mockBundle = {
        id: 'bundle-1',
        name: 'Office Bundle',
        items: [
          {
            product: { id: 'product-1' },
            quantity: 1,
            priceSnapshot: 100,
          },
        ],
      };

      mockBundleService.findById.mockImplementation(() =>
        Promise.resolve(mockBundle as any),
      );
      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(mockProduct),
      );

      const result = await service.create(user as any, dto);
      expect(result.totalAmount).toBe(200);
      expect(orderRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if product stock is insufficient', async () => {
      const user = { id: 'buyer-1', role: 'BUYER' };
      const dto = {
        items: [{ productId: 'product-1', quantity: 100, priceSnapshot: 100 }], // requesting 100, stock is 50
      };

      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(mockProduct),
      );

      expect(service.create(user as any, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if product is not found', async () => {
      const user = { id: 'buyer-1', role: 'BUYER' };
      const dto = {
        items: [{ productId: 'nonexistent', quantity: 1, priceSnapshot: 100 }],
      };

      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(null),
      );

      expect(service.create(user as any, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all orders placed by buyer', async () => {
      const user = { id: 'buyer-1', role: 'BUYER' };
      mockOrderRepository.findAllByBuyerId.mockImplementation(() =>
        Promise.resolve([]),
      );

      const result = await service.findAllByUser(user as any);
      expect(result).toBeDefined();
      expect(orderRepository.findAllByBuyerId).toHaveBeenCalledWith('buyer-1');
    });
  });

  describe('findReceivedOrders', () => {
    it('should return suborders received by supplier', async () => {
      const user = { id: 'supplier-1', role: 'SUPPLIER' };
      mockOrderRepository.findAllBySupplierId.mockImplementation(() =>
        Promise.resolve([]),
      );

      const result = await service.findReceivedOrders(user as any);
      expect(result).toBeDefined();
      expect(orderRepository.findAllBySupplierId).toHaveBeenCalledWith(
        'supplier-1',
      );
    });

    it('should throw ForbiddenException if user is not supplier or admin', async () => {
      const user = { id: 'buyer-1', role: 'BUYER' };
      expect(service.findReceivedOrders(user as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return main order if found and owned by buyer', async () => {
      const user = { id: 'buyer-1', role: 'BUYER' };
      const order = new Order(
        'order-1',
        'buyer-1',
        'NEW',
        100,
        4,
        [],
        new Date(),
        new Date(),
      );
      mockOrderRepository.findById.mockImplementation(() =>
        Promise.resolve(order),
      );

      const result = await service.findOne('order-1', user as any);
      expect(result.id).toBe('order-1');
    });

    it('should return sub-order if found and owned by supplier', async () => {
      const user = { id: 'supplier-1', role: 'SUPPLIER' };
      const subOrder = new SubOrder(
        'sub-1',
        'order-1',
        'NEW',
        'supplier-1',
        null,
        [],
        new Date(),
        new Date(),
      );
      mockOrderRepository.findSubOrderById.mockImplementation(() =>
        Promise.resolve(subOrder),
      );

      const result = await service.findOne('sub-1', user as any);
      expect(result.id).toBe('sub-1');
    });

    it('should throw NotFoundException if neither found or access denied', async () => {
      const user = { id: 'buyer-1', role: 'BUYER' };
      mockOrderRepository.findById.mockImplementation(() =>
        Promise.resolve(null),
      );
      mockOrderRepository.findSubOrderById.mockImplementation(() =>
        Promise.resolve(null),
      );

      expect(service.findOne('some-id', user as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update sub-order status and decrement stock if transitioning to PROCESSING', async () => {
      const user = { id: 'supplier-1', role: 'SUPPLIER' };
      const subOrder = new SubOrder(
        'sub-1',
        'order-1',
        'NEW',
        'supplier-1',
        null,
        [new OrderItem('item-1', 'sub-1', 'product-1', 2, 100, 'Title', 'sku')],
        new Date(),
        new Date(),
        undefined,
        { id: 'buyer-1', email: 'buyer@example.com', name: 'Buyer' } as any,
      );

      mockOrderRepository.findSubOrderById.mockImplementation(() =>
        Promise.resolve(subOrder),
      );

      const updatedSubOrder = { ...subOrder, status: 'PROCESSING' as const };
      mockOrderRepository.updateSubOrderStatus.mockImplementation(() =>
        Promise.resolve(updatedSubOrder),
      );

      const parentOrder = new Order(
        'order-1',
        'buyer-1',
        'NEW',
        200,
        8,
        [updatedSubOrder],
        new Date(),
        new Date(),
      );
      mockOrderRepository.findById.mockImplementation(() =>
        Promise.resolve(parentOrder),
      );
      mockOrderRepository.updateStatus.mockImplementation(() =>
        Promise.resolve(parentOrder),
      );

      const result = await service.updateStatus(
        'sub-1',
        'PROCESSING',
        user as any,
      );
      expect(result.status).toBe('PROCESSING');
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { stock: { decrement: 2 } },
      });
      expect(orderRepository.updateSubOrderStatus).toHaveBeenCalledWith(
        'sub-1',
        'PROCESSING',
      );
    });

    it('should throw BadRequestException if transition is invalid', async () => {
      const user = { id: 'supplier-1', role: 'SUPPLIER' };
      const subOrder = new SubOrder(
        'sub-1',
        'order-1',
        'SHIPPED',
        'supplier-1',
        null,
        [],
        new Date(),
        new Date(),
      );
      mockOrderRepository.findSubOrderById.mockImplementation(() =>
        Promise.resolve(subOrder),
      );

      expect(
        service.updateStatus('sub-1', 'PROCESSING', user as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkStock', () => {
    it('should return correctness checklist', async () => {
      mockProductRepository.findOne.mockImplementation(() =>
        Promise.resolve(mockProduct),
      );
      const results = await service.checkStock([
        { productId: 'product-1', quantity: 10 },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].sufficient).toBe(true);
      expect(results[0].available).toBe(50);
    });
  });
});
