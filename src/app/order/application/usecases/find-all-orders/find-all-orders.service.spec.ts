import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { OrderModule } from 'src/app/order/order.module';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { OrderDto } from '../../dtos/order.dto';
import { CreateOrderFromBudget } from '../create-order-from-budget/create-order-from-budget.service';
import { FindAllOrders } from './find-all-orders.service';

describe('FindAllOrders (Integration)', () => {
  let sut: FindAllOrders;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createProduct: CreateProduct;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let createOrderFromBudget: CreateOrderFromBudget;
  let companyId: string;
  let clientId1: string;
  let clientId2: string;
  let sellerId1: string;
  let sellerId2: string;
  let productId: string;
  const accountId = 'account-admin-id';

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        OrderModule,
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllOrders);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createProduct = module.get(CreateProduct);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);
    createOrderFromBudget = module.get(CreateOrderFromBudget);

    await prisma.truncate();

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

    // Create clients
    clientId1 = (await createClient.execute({
      kind: 'Cliente Tipo 1',
      cnpj: '22333444000181',
      ie: '123456789',
      group: 'Grupo Cliente 1',
      type: 'Tipo Cliente 1',
      generateInvoice: true,
      companyName: 'Client 1 Company',
      fantasyName: 'Client 1',
      owner: 'Owner 1',
      headquarters: 'Headquarters 1',
      companyIds: [companyId],
    })).id;

    clientId2 = (await createClient.execute({
      kind: 'Cliente Tipo 2',
      cnpj: '09819047000156',
      ie: '987654321',
      group: 'Grupo Cliente 2',
      type: 'Tipo Cliente 2',
      generateInvoice: true,
      companyName: 'Client 2 Company',
      fantasyName: 'Client 2',
      owner: 'Owner 2',
      headquarters: 'Headquarters 2',
      companyIds: [companyId],
    })).id;

    // Create sellers
    sellerId1 = (await createSeller.execute({
      name: 'Seller 1',
      email: 'seller1@test.com',
      password: 'Password123!',
      phone: '11987654321',
      nickname: 'Seller 1',
      cellphone: '11987654321',
      commission: 10,
      zipCode: '12345-678',
      street: 'Seller 1 Street',
      number: '123',
      complement: null,
      reference: null,
      neighborhood: 'Seller 1 Neighborhood',
      city: 'Seller 1 City',
      state: 'ST',
      observation: null,
      companyIds: [companyId],
    })).id;

    sellerId2 = (await createSeller.execute({
      name: 'Seller 2',
      email: 'seller2@test.com',
      password: 'Password123!',
      phone: '11987654322',
      nickname: 'Seller 2',
      cellphone: '11987654322',
      commission: 10,
      zipCode: '12345-678',
      street: 'Seller 2 Street',
      number: '123',
      complement: null,
      reference: null,
      neighborhood: 'Seller 2 Neighborhood',
      city: 'Seller 2 City',
      state: 'ST',
      observation: null,
      companyIds: [companyId],
    })).id;

    // Create supplier
    const supplierId = (await createSupplier.execute({
      cnpj: '55658710000103',
      ie: '111222333',
      group: 'Supplier Group',
      type: 'Nacional',
      companyName: 'Supplier Company',
      fantasyName: 'Supplier Fantasy',
      representative: 'Supplier Rep',
      companyIds: [companyId],
    })).id;

    // Create product
    productId = (await createProduct.execute({
      companyId,
      type: 'Product Type',
      group01: 'Group 01',
      group02: 'Group 02',
      description: 'Product Test Description',
      complement: null,
      manufacturerCode: 'MANUF001',
      brand: 'Brand Test',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 10,
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

    await prisma.product.update({
      where: { id: productId },
      data: { currentStock: 1000 },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('Success Cases', () => {
    it('should return empty pagination when no orders exist', async() => {
      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(0);
    });

    it('should return all orders with default pagination', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
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
        clientId: clientId2,
        sellerId: sellerId2,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Test Product 2',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 0,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget1.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await prisma.budget.update({
        where: { id: budget2.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await createOrderFromBudget.execute({
        budgetId: budget1.id,
        accountId,
      });

      await createOrderFromBudget.execute({
        budgetId: budget2.id,
        accountId,
      });

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter orders by status', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
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
        clientId: clientId2,
        sellerId: sellerId2,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Test Product 2',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 0,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget1.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await prisma.budget.update({
        where: { id: budget2.id },
        data: { status: BudgetStatus.APPROVED },
      });

      const { orderId: orderId1 } = await createOrderFromBudget.execute({
        budgetId: budget1.id,
        accountId,
      });

      await createOrderFromBudget.execute({
        budgetId: budget2.id,
        accountId,
      });

      // Change order1 to PRODUCTION
      await prisma.order.update({
        where: { id: orderId1 },
        data: { status: OrderStatus.PRODUCTION },
      });

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
        status: OrderStatus.PRODUCTION,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(OrderStatus.PRODUCTION);
      expect(result.totalItems).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter orders by clientId', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
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
        clientId: clientId2,
        sellerId: sellerId1,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Test Product 2',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 0,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget1.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await prisma.budget.update({
        where: { id: budget2.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await createOrderFromBudget.execute({
        budgetId: budget1.id,
        accountId,
      });

      await createOrderFromBudget.execute({
        budgetId: budget2.id,
        accountId,
      });

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
        clientId: clientId1,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);

      const orderId = result.data[0].id;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { budget: true },
      });
      expect(order?.budgetId).toBe(budget1.id);
      expect(order?.budget.clientId).toBe(clientId1);
    });

    it('should filter orders by sellerId', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
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
        clientId: clientId1,
        sellerId: sellerId2,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Test Product 2',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 0,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget1.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await prisma.budget.update({
        where: { id: budget2.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await createOrderFromBudget.execute({
        budgetId: budget1.id,
        accountId,
      });

      await createOrderFromBudget.execute({
        budgetId: budget2.id,
        accountId,
      });

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
        sellerId: sellerId2,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);

      const orderId = result.data[0].id;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { budget: true },
      });
      expect(order?.budgetId).toBe(budget2.id);
      expect(order?.budget.sellerId).toBe(sellerId2);
    });

    it('should filter orders by companyId', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
        companyId,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);

      const orderId = result.data[0].id;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { budget: true },
      });
      expect(order?.budgetId).toBe(budget.id);
      expect(order?.budget.companyId).toBe(companyId);
    });

    it('should filter orders by date range', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Act - within range
      const result1 = await sut.execute({
        page: 1,
        size: 10,
        dateFrom: yesterday.toISOString(),
        dateTo: tomorrow.toISOString(),
      });

      // Assert
      expect(result1.data).toHaveLength(1);
      expect(result1.totalItems).toBe(1);
      expect(result1.currentPage).toBe(1);
      expect(result1.itemsPerPage).toBe(10);
      expect(result1.totalPages).toBe(1);

      // Act - outside range
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const result2 = await sut.execute({
        page: 1,
        size: 10,
        dateFrom: twoDaysAgo.toISOString(),
        dateTo: yesterday.toISOString(),
      });

      // Assert
      expect(result2.data).toHaveLength(0);
      expect(result2.totalItems).toBe(0);
      expect(result2.currentPage).toBe(1);
      expect(result2.itemsPerPage).toBe(10);
      expect(result2.totalPages).toBe(0);
    });

    it('should paginate results correctly', async() => {
      // Arrange - create 15 orders
      for (let i = 0; i < 15; i++) {
        const budget = await createBudget.execute({
          companyId,
          clientId: clientId1,
          sellerId: sellerId1,
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
              productId,
              serviceId: null,
              description: `Test Product ${i}`,
              quantity: 10,
              unitPriceInCents: 1500,
              discountInCents: 100,
            },
          ],
        });

        await prisma.budget.update({
          where: { id: budget.id },
          data: { status: BudgetStatus.APPROVED },
        });

        await createOrderFromBudget.execute({
          budgetId: budget.id,
          accountId,
        });
      }

      // Act - page 1
      const result1 = await sut.execute({
        page: 1,
        size: 10,
      });

      // Assert
      expect(result1.data).toHaveLength(10);
      expect(result1.totalItems).toBe(15);
      expect(result1.currentPage).toBe(1);
      expect(result1.itemsPerPage).toBe(10);
      expect(result1.totalPages).toBe(2);

      // Act - page 2
      const result2 = await sut.execute({
        page: 2,
        size: 10,
      });

      // Assert
      expect(result2.data).toHaveLength(5);
      expect(result2.totalItems).toBe(15);
      expect(result2.currentPage).toBe(2);
      expect(result2.itemsPerPage).toBe(10);
      expect(result2.totalPages).toBe(2);
    });

    it('should combine multiple filters', async() => {
      // Arrange
      const budget1 = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
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
        clientId: clientId2,
        sellerId: sellerId1,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Test Product 2',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 0,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget1.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await prisma.budget.update({
        where: { id: budget2.id },
        data: { status: BudgetStatus.APPROVED },
      });

      const { orderId: orderId1 } = await createOrderFromBudget.execute({
        budgetId: budget1.id,
        accountId,
      });

      await createOrderFromBudget.execute({
        budgetId: budget2.id,
        accountId,
      });

      // Change order1 to PRODUCTION
      await prisma.order.update({
        where: { id: orderId1 },
        data: { status: OrderStatus.PRODUCTION },
      });

      // Act - filter by status + clientId
      const result = await sut.execute({
        page: 1,
        size: 10,
        status: OrderStatus.PRODUCTION,
        clientId: clientId1,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(OrderStatus.PRODUCTION);
      expect(result.totalItems).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(1);

      const orderId = result.data[0].id;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { budget: true },
      });
      expect(order?.budgetId).toBe(budget1.id);
      expect(order?.budget.clientId).toBe(clientId1);
    });

    it('should return orders ordered by createdAt desc', async() => {
      // Arrange - create 3 orders in sequence
      const orders: { orderId: string; createdAt: Date }[] = [];

      for (let i = 0; i < 3; i++) {
        const budget = await createBudget.execute({
          companyId,
          clientId: clientId1,
          sellerId: sellerId1,
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
              productId,
              serviceId: null,
              description: `Test Product ${i}`,
              quantity: 10,
              unitPriceInCents: 1500,
              discountInCents: 100,
            },
          ],
        });

        await prisma.budget.update({
          where: { id: budget.id },
          data: { status: BudgetStatus.APPROVED },
        });

        const { orderId } = await createOrderFromBudget.execute({
          budgetId: budget.id,
          accountId,
        });

        const orderData = await prisma.order.findUnique({
          where: { id: orderId },
        });

        orders.push({
          orderId,
          createdAt: orderData!.createdAt,
        });
      }

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
      });

      // Assert
      expect(result.data).toHaveLength(3);
      // Most recent first (desc)
      expect(new Date(result.data[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result.data[1].createdAt).getTime()
      );
      expect(new Date(result.data[1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result.data[2].createdAt).getTime()
      );
    });

    it('should return complete DTO structure', async() => {
      // Arrange
      const budget = await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
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
            productId,
            serviceId: null,
            description: 'Test Product',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      await prisma.budget.update({
        where: { id: budget.id },
        data: { status: BudgetStatus.APPROVED },
      });

      await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      const result = await sut.execute({
        page: 1,
        size: 10,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      const orderDto = result.data[0];
      expect(orderDto).toEqual<OrderDto>({
        id: expect.any(String),
        budgetId: budget.id,
        status: OrderStatus.CREATED,
        trackingCode: null,
        createdBy: accountId,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
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
  });
});
