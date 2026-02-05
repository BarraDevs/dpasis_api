import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { CreateBudgetOutputDto } from 'src/app/budget/application/usecases/create-budget/dtos/create-budget.dto';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { OrderNotFoundError } from 'src/app/order/domain/errors/order-not-found.error';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { OrderModule } from 'src/app/order/order.module';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { OrderDto } from '../../dtos/order.dto';
import { CreateOrderFromBudget } from '../create-order-from-budget/create-order-from-budget.service';
import { FindOrderById } from './find-order-by-id.service';

describe('FindOrderById (Integration)', () => {
  let sut: FindOrderById;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let createOrderFromBudget: CreateOrderFromBudget;
  let companyId: string;
  let clientId: string;
  let sellerId: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;
  const accountId = 'account-admin-id';

  async function makeApprovedProductBudget(): Promise<CreateBudgetOutputDto> {
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

    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: BudgetStatus.APPROVED },
    });

    return budget;
  }

  async function makeApprovedServiceBudget(): Promise<CreateBudgetOutputDto> {
    const budget = await createBudget.execute({
      companyId,
      clientId,
      sellerId,
      freightType: 'FOB',
      shipperId: null,
      freightValueInCents: 3000,
      discountInCents: 0,
      commercialProcess: null,
      commercialNote: null,
      observations: null,
      items: [
        {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId,
          description: 'Test Service',
          quantity: 2,
          unitPriceInCents: 5000,
          discountInCents: 0,
        },
      ],
    });

    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: BudgetStatus.APPROVED },
    });

    return budget;
  }

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        OrderModule,
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindOrderById);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
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
      cnpj: '55658710000103',
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
    expect(sut).toBeDefined();
  });

  describe('Success Cases', () => {
    it('should find an existing order by ID', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      const result = await sut.execute(orderId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(orderId);
      expect(result.budgetId).toBe(budget.id);
      expect(result.status).toBe(OrderStatus.CREATED);
      expect(result.createdBy).toBe(accountId);
    });

    it('should return order with complete DTO structure', async() => {
      // Arrange
      const budget = await makeApprovedServiceBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      const result = await sut.execute(orderId);

      // Assert
      expect(result).toEqual<OrderDto>({
        id: orderId,
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

    it('should return order with status history', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      const result = await sut.execute(orderId);

      // Assert
      expect(result.statusHistory).toBeDefined();
      expect(Array.isArray(result.statusHistory)).toBe(true);
      expect(result.statusHistory).toHaveLength(1);
      expect(result.statusHistory[0]).toEqual({
        status: OrderStatus.CREATED,
        changedAt: expect.any(String),
        changedBy: accountId,
        observation: null,
      });
    });

    it('should return order with tracking code if set', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Simular transições de status até SHIPPED
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SHIPPED,
          trackingCode: 'BR123456789',
          statusHistory: JSON.stringify([
            {
              status: OrderStatus.CREATED,
              changedAt: new Date().toISOString(),
              changedBy: accountId,
              observation: null,
            },
            {
              status: OrderStatus.PRODUCTION,
              changedAt: new Date().toISOString(),
              changedBy: accountId,
              observation: null,
            },
            {
              status: OrderStatus.INVOICED,
              changedAt: new Date().toISOString(),
              changedBy: accountId,
              observation: null,
            },
            {
              status: OrderStatus.SHIPPED,
              changedAt: new Date().toISOString(),
              changedBy: accountId,
              observation: null,
            },
          ]),
        },
      });

      // Act
      const result = await sut.execute(orderId);

      // Assert
      expect(result.trackingCode).toBe('BR123456789');
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('should return cancelled order with cancellation data', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      await prisma.budget.update({
        where: { id: budget.id },
        data: { status: BudgetStatus.APPROVED },
      });

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Simular cancelamento
      const cancelledAt = new Date();
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt,
          cancelledBy: accountId,
          cancellationReason: 'Cliente desistiu do pedido',
          statusHistory: JSON.stringify([
            {
              status: OrderStatus.CREATED,
              changedAt: new Date().toISOString(),
              changedBy: accountId,
              observation: null,
            },
            {
              status: OrderStatus.CANCELLED,
              changedAt: cancelledAt.toISOString(),
              changedBy: accountId,
              observation: 'Cliente desistiu do pedido',
            },
          ]),
        },
      });

      // Act
      const result = await sut.execute(orderId);

      // Assert
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
      expect(result.cancelledBy).toBe(accountId);
      expect(result.cancellationReason).toBe('Cliente desistiu do pedido');
    });
  });

  describe('Error Cases', () => {
    it('should throw OrderNotFoundError when order does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(sut.execute(nonExistentId)).rejects.toThrow(OrderNotFoundError);
    });

    it('should throw OrderNotFoundError for deleted order', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Deletar o pedido manualmente
      await prisma.order.delete({
        where: { id: orderId },
      });

      // Act & Assert
      await expect(sut.execute(orderId)).rejects.toThrow(OrderNotFoundError);
    });
  });
});
