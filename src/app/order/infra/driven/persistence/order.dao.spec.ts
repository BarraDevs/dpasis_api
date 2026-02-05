import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { OrderDto, OrderStatusHistoryDto } from 'src/app/order/application/dtos/order.dto';
import { IOrderDao } from 'src/app/order/application/persistence/dao/order-dao.interface';
import { IOrderRepository } from 'src/app/order/application/persistence/repository/order-repository.interface';
import { Order } from 'src/app/order/domain/entities/order.entity';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { OrderModule } from 'src/app/order/order.module';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

describe('OrderDao', () => {
  let orderDao: IOrderDao;
  let orderRepo: IOrderRepository;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let companyId: string;
  let clientId: string;
  let sellerId: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;
  const accountId = 'account-admin-id';

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        OrderModule,
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    orderDao = module.get(TOKENS.OrderDao);
    orderRepo = module.get(TOKENS.OrderRepository);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);

    await prisma.order.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.product.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.account.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.client.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    // Create company
    companyId = (await createCompany.execute({
      name: 'Company Test',
      fantasyName: 'Company Fantasy Test',
      document: '61067756000142',
      ie: 'ie teste',
      zipCode: '12345-678',
      street: 'Street Test',
      number: '123',
      neighborhood: 'Neighborhood Test',
      complement: null,
      reference: null,
      city: 'City Test',
      state: 'ST',
      cellphone: '11999999999',
      phone01: '1133333333',
      phone02: null,
      email01: 'company@test.com',
      email02: null,
    })).id;

    // Create client
    clientId = (await createClient.execute({
      kind: 'Cliente Tipo 1',
      cnpj: '11222333000181',
      ie: '123456789',
      group: 'Grupo Cliente',
      type: 'Tipo Cliente',
      generateInvoice: true,
      companyName: 'Client Company',
      fantasyName: 'Client Fantasy',
      owner: 'Owner',
      headquarters: 'Headquarters',
      companyIds: [companyId],
    })).id;

    // Create seller
    sellerId = (await createSeller.execute({
      name: 'Seller',
      nickname: 'Seller Nick',
      phone: '1133333333',
      cellphone: '11999999999',
      email: 'seller@test.com',
      password: 'password123',
      commission: 5,
      zipCode: '12345-678',
      street: 'Seller Street',
      number: '456',
      complement: null,
      reference: null,
      neighborhood: 'Seller Neighborhood',
      city: 'Seller City',
      state: 'SC',
      observation: null,
      companyIds: [companyId],
    })).id;

    // Create supplier and product
    const supplierId = (await createSupplier.execute({
      cnpj: '98785630000113',
      ie: '111222333',
      group: 'Supplier Group',
      type: 'Nacional',
      companyName: 'Supplier Company',
      fantasyName: 'Supplier Fantasy',
      representative: 'Supplier Rep',
      companyIds: [companyId],
    })).id;

    product01Id = (await createProduct.execute({
      companyId,
      type: 'Product Type',
      group01: 'Group 01',
      group02: 'Group 02',
      description: 'Product Test',
      complement: null,
      manufacturerCode: 'MANUF001',
      brand: 'Brand Test',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 5,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567890',
      additionalInfo: null,
      supplierIds: [supplierId],
      images: [],
    })).id;

    product02Id = (await createProduct.execute({
      companyId,
      type: 'Product Type',
      group01: 'Group 01',
      group02: 'Group 02',
      description: 'Product Test 2',
      complement: null,
      manufacturerCode: 'MANUF002',
      brand: 'Brand Test 2',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH002',
      minimumStock: 5,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567891',
      additionalInfo: null,
      supplierIds: [supplierId],
      images: [],
    })).id;

    await prisma.product.update({
      where: { id: product01Id },
      data: { currentStock: 100 },
    });

    // Create service
    const serviceCategoryId = (await prisma.serviceCategory.create({
      data: {
        name: 'Service Category Test',
      },
    })).id;

    serviceId = (await createService.execute({
      name: 'Service Test',
      nickname: null,
      companyId,
      categoryId: serviceCategoryId,
      deadline: null,
      shippingValueInCents: null,
      warrant: null,
      weight: null,
      maxVolume: null,
      dimensions: null,
      commission: 10,
      valueInCents: 5000,
      description: null,
      productIds: [product01Id, product02Id],
    })).id;
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(orderDao).toBeDefined();
  });

  describe('findById', () => {
    it('should return null when order does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await orderDao.findById(nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return order DTO by ID', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      const result = await orderDao.findById(order.props.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<OrderDto>({
        id: order.props.id,
        budgetId: budget.id,
        status: OrderStatus.CREATED,
        trackingCode: null,
        createdBy: accountId,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        createdAt: order.props.createdAt,
        updatedAt: order.props.updatedAt,
        statusHistory: [
          {
            status: OrderStatus.CREATED,
            changedAt: expect.any(String),
            changedBy: accountId,
            observation: null,
          },
        ],
      });
    });

    it('should return order with statusHistory as array', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      // Act
      const result = await orderDao.findById(order.props.id);

      // Assert
      expect(result?.statusHistory).toBeDefined();
      expect(Array.isArray(result?.statusHistory)).toBe(true);
      expect(result?.statusHistory).toHaveLength(1);
      expect(result?.statusHistory[0]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.CREATED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: null,
      });
    });

    it('should return order with tracking code', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      order.startProduction(accountId, 'Iniciando produção');
      order.markAsInvoiced(accountId, 'NF-e emitida');
      order.ship(accountId, 'BR123456789', 'Enviado');
      await orderRepo.save(order);

      // Act
      const result = await orderDao.findById(order.props.id);

      // Assert
      expect(result?.trackingCode).toBe('BR123456789');
      expect(result?.status).toBe(OrderStatus.SHIPPED);
      expect(result?.statusHistory).toHaveLength(4);
      expect(result?.statusHistory[0]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.CREATED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: null,
      });
      expect(result?.statusHistory[1]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.PRODUCTION,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: 'Iniciando produção',
      });
      expect(result?.statusHistory[2]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.INVOICED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: 'NF-e emitida',
      });
      expect(result?.statusHistory[3]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.SHIPPED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: 'Enviado',
      });
    });

    it('should return cancelled order with cancellation data', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      order.cancel(accountId, 'Cliente desistiu');
      await orderRepo.save(order);

      // Act
      const result = await orderDao.findById(order.props.id);

      // Assert
      expect(result?.status).toBe(OrderStatus.CANCELLED);
      expect(result?.cancelledAt).toBeDefined();
      expect(result?.cancelledBy).toBe(accountId);
      expect(result?.cancellationReason).toBe('Cliente desistiu');
      expect(result?.statusHistory).toHaveLength(2);
      expect(result?.statusHistory[0]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.CREATED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: null,
      });
      expect(result?.statusHistory[1]).toEqual<OrderStatusHistoryDto>({
        status: OrderStatus.CANCELLED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: 'Cliente desistiu',
      });
    });
  });

  describe('findAll', () => {
    it('should return empty array when no orders exist', async() => {
      // Act
      const [result, total] = await orderDao.findAll({});

      // Assert
      expect(result).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all orders with default pagination', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product 1',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const budget2 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Test Service 1',
            quantity: 5,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      });

      const order1 = Order.create({ budgetId: budget1.id, createdBy: accountId });
      const order2 = Order.create({ budgetId: budget2.id, createdBy: accountId });
      await orderRepo.save(order1);
      await orderRepo.save(order2);

      // Act
      const [result, total] = await orderDao.findAll({});

      // Assert
      expect(result).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should filter orders by status', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product 1',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const budget2 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Test Service 1',
            quantity: 5,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      });

      const order1 = Order.create({ budgetId: budget1.id, createdBy: accountId });
      order1.startProduction(accountId);

      const order2 = Order.create({ budgetId: budget2.id, createdBy: accountId });

      await orderRepo.save(order1);
      await orderRepo.save(order2);

      // Act
      const [result, total] = await orderDao.findAll({ status: OrderStatus.PRODUCTION });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(OrderStatus.PRODUCTION);
      expect(total).toBe(1);
    });

    it('should filter orders by clientId', async() => {
      // Arrange
      const client2Id = (await createClient.execute({
        kind: 'Cliente Tipo 2',
        cnpj: '11599914000137',
        ie: '987654321',
        group: 'Grupo Cliente 2',
        type: 'Tipo Cliente 2',
        generateInvoice: true,
        companyName: 'Client Company 2',
        fantasyName: 'Client Fantasy 2',
        owner: 'Owner 2',
        headquarters: 'Headquarters 2',
        companyIds: [companyId],
      })).id;

      const budget1 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product 1',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const budget2 = await createBudget.execute({
        companyId,
        clientId: client2Id,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Test Service 1',
            quantity: 5,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      });

      const order1 = Order.create({ budgetId: budget1.id, createdBy: accountId });
      const order2 = Order.create({ budgetId: budget2.id, createdBy: accountId });
      await orderRepo.save(order1);
      await orderRepo.save(order2);

      // Act
      const [result, total] = await orderDao.findAll({ clientId: client2Id });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].budgetId).toBe(budget2.id);
      expect(total).toBe(1);
    });

    it('should paginate results correctly', async() => {
      // Arrange - criar 15 orders
      for (let i = 0; i < 15; i++) {
        const budget = await createBudget.execute({
          companyId,
          clientId,
          sellerId,
          freightType: 'CIF',
          shipperId: null,
          freightValueInCents: 5000 + i * 100,
          discountInCents: 1000,
          commercialProcess: null,
          commercialNote: null,
          observations: null,
          items: [
            {
              itemType: BudgetItemType.PRODUCT,
              productId: product01Id,
              serviceId: null,
              description: `Test Product ${i}`,
              quantity: 10,
              unitPriceInCents: 1500,
              discountInCents: 100,
            },
          ],
        });

        const order = Order.create({ budgetId: budget.id, createdBy: accountId });
        await orderRepo.save(order);
      }

      // Act - página 1 (limit 10)
      const [page1Data, page1Total] = await orderDao.findAll({ page: 1, limit: 10 });

      // Assert
      expect(page1Data).toHaveLength(10);
      expect(page1Total).toBe(15);

      // Act - página 2 (limit 10)
      const [page2Data, page2Total] = await orderDao.findAll({ page: 2, limit: 10 });

      // Assert
      expect(page2Data).toHaveLength(5);
      expect(page2Total).toBe(15);
    });

    it('should filter orders by date range', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const order = Order.create({ budgetId: budget.id, createdBy: accountId });
      await orderRepo.save(order);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Act - filtro dentro do range
      const [result1, total1] = await orderDao.findAll({
        dateFrom: yesterday,
        dateTo: tomorrow,
      });

      // Assert
      expect(result1).toHaveLength(1);
      expect(total1).toBe(1);

      // Act - filtro fora do range
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const [result2, total2] = await orderDao.findAll({
        dateFrom: twoDaysAgo,
        dateTo: yesterday,
      });

      // Assert
      expect(result2).toHaveLength(0);
      expect(total2).toBe(0);
    });

    it('should combine multiple filters', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Test Product 1',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      const budget2 = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Test Service 1',
            quantity: 5,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      });

      const order1 = Order.create({ budgetId: budget1.id, createdBy: accountId });
      order1.startProduction(accountId);

      const order2 = Order.create({ budgetId: budget2.id, createdBy: accountId });
      order2.startProduction(accountId);

      await orderRepo.save(order1);
      await orderRepo.save(order2);

      // Act - filtrar por status + clientId
      const [result, total] = await orderDao.findAll({
        status: OrderStatus.PRODUCTION,
        clientId,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(total).toBe(2);
      result.forEach((order) => {
        expect(order.status).toBe(OrderStatus.PRODUCTION);
      });
    });

    it('should return orders ordered by createdAt desc', async() => {
      // Arrange - criar 3 orders em sequência
      const orders = [];
      for (let i = 0; i < 3; i++) {
        const budget = await createBudget.execute({
          companyId,
          clientId,
          sellerId,
          freightType: 'CIF',
          shipperId: null,
          freightValueInCents: 5000 + i * 100,
          discountInCents: 1000,
          commercialProcess: null,
          commercialNote: null,
          observations: null,
          items: [
            {
              itemType: BudgetItemType.PRODUCT,
              productId: product01Id,
              serviceId: null,
              description: `Test Product ${i}`,
              quantity: 10,
              unitPriceInCents: 1500,
              discountInCents: 100,
            },
          ],
        });

        const order = Order.create({ budgetId: budget.id, createdBy: accountId });
        await orderRepo.save(order);
        orders.push(order);
      }

      // Act
      const [result, total] = await orderDao.findAll({});

      // Assert
      expect(result).toHaveLength(3);
      expect(total).toBe(3);
      // Mais recente primeiro (desc)
      expect(new Date(result[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result[1].createdAt).getTime()
      );
      expect(new Date(result[1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result[2].createdAt).getTime()
      );
    });
  });
});
