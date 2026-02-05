import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { CreateBudgetOutputDto } from 'src/app/budget/application/usecases/create-budget/dtos/create-budget.dto';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { BudgetAlreadyHasOrderError } from 'src/app/order/domain/errors/budget-already-has-order.error';
import { BudgetNotApprovedError } from 'src/app/order/domain/errors/budget-not-approved.error';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { OrderModule } from 'src/app/order/order.module';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateOrderFromBudget } from './create-order-from-budget.service';
import { CreateOrderFromBudgetInputDto } from './dtos/create-order-from-budget.dto';

describe('CreateOrderFromBudget', () => {
  let sut: CreateOrderFromBudget;
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

    sut = module.get(CreateOrderFromBudget);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);

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

  describe('unit tests', () => {
    it('should throw BudgetNotFoundError when budget does not exist', async() => {
      // Arrange
      const nonExistentBudgetId = 'non-existent-budget-id';
      const input: CreateOrderFromBudgetInputDto = {
        budgetId: nonExistentBudgetId,
        accountId,
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(input)).rejects.toBeInstanceOf(BudgetNotFoundError);
    });

    it.each(
      Object.values(BudgetStatus).filter((status) => status !== BudgetStatus.APPROVED)
    )('should throw BudgetNotApprovedError when budget is %s', async(status) => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      await prisma.budget.update({
        where: { id: budget.id },
        data: { status },
      });

      const input: CreateOrderFromBudgetInputDto = {
        budgetId: budget.id,
        accountId,
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(input)).rejects.toBeInstanceOf(BudgetNotApprovedError);
    });

    it('should throw BudgetAlreadyHasOrderError when budget already has an order', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      // Criar order pela primeira vez
      const input: CreateOrderFromBudgetInputDto = {
        budgetId: budget.id,
        accountId,
      };

      await sut.execute(input);

      // Act & Assert - tentar criar novamente
      expect.assertions(1);
      await expect(sut.execute(input)).rejects.toBeInstanceOf(BudgetAlreadyHasOrderError);
    });
  });

  describe('integration tests', () => {
    it('should create order from approved budget with product', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const input: CreateOrderFromBudgetInputDto = {
        budgetId: budget.id,
        accountId,
      };

      // Act
      const result = await sut.execute(input);
      // Assert
      expect(result.orderId).toBeDefined();
      expect(result.budgetId).toBe(budget.id);
      expect(result.createdAt).toBeInstanceOf(Date);

      // Verificar se order foi criada no banco
      const orderInDb = await prisma.order.findUnique({
        where: { id: result.orderId },
      });

      expect(orderInDb).toBeDefined();
      expect(orderInDb?.budgetId).toBe(budget.id);
      expect(orderInDb?.status).toBe(OrderStatus.CREATED);
      expect(orderInDb?.createdBy).toBe(accountId);
      expect(orderInDb?.trackingCode).toBeNull();
      expect(orderInDb?.cancelledAt).toBeNull();
      expect(orderInDb?.cancelledBy).toBeNull();
      expect(orderInDb?.cancellationReason).toBeNull();
    });

    it('should create order from approved budget with service', async() => {
      // Arrange
      const budget = await makeApprovedServiceBudget();

      // Act
      const input: CreateOrderFromBudgetInputDto = {
        budgetId: budget.id,
        accountId,
      };

      const result = await sut.execute(input);

      // Assert
      expect(result.orderId).toBeDefined();
      expect(result.budgetId).toBe(budget.id);

      const orderInDb = await prisma.order.findUnique({
        where: { id: result.orderId },
      });

      expect(orderInDb).toBeDefined();
      expect(orderInDb?.status).toBe(OrderStatus.CREATED);
    });

    it('should create order with initial status history', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const input: CreateOrderFromBudgetInputDto = {
        budgetId: budget.id,
        accountId,
      };

      // Act
      const result = await sut.execute(input);

      // Assert
      const orderInDb = await prisma.order.findUnique({
        where: { id: result.orderId },
      });

      expect(orderInDb?.statusHistory).toBeDefined();
      const history = JSON.parse(JSON.stringify(orderInDb?.statusHistory));
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe(OrderStatus.CREATED);
      expect(history[0].changedBy).toBe(accountId);
    });

    it('should create orders for different budgets', async() => {
      // Arrange - criar 2 budgets
      const budget1 = await makeApprovedProductBudget();
      const budget2 = await makeApprovedServiceBudget();

      const input1: CreateOrderFromBudgetInputDto = {
        budgetId: budget1.id,
        accountId,
      };
      const input2: CreateOrderFromBudgetInputDto = {
        budgetId: budget2.id,
        accountId,
      };

      // Act
      const order1 = await sut.execute(input1);
      const order2 = await sut.execute(input2);

      // Assert
      expect(order1.orderId).not.toBe(order2.orderId);
      expect(order1.budgetId).toBe(budget1.id);
      expect(order2.budgetId).toBe(budget2.id);

      const ordersInDb = await prisma.order.findMany();
      expect(ordersInDb).toHaveLength(2);
    });

    it('should preserve budget data when creating order', async() => {
      // Arrange
      const budget = await makeApprovedProductBudget();

      const input: CreateOrderFromBudgetInputDto = {
        budgetId: budget.id,
        accountId,
      };

      // Act
      await sut.execute(input);

      // Assert - budget não deve ter sido modificado
      const budgetInDb = await prisma.budget.findUnique({
        where: { id: budget.id },
        include: { items: true },
      });

      expect(budgetInDb?.status).toBe(BudgetStatus.APPROVED);
      expect(budgetInDb?.commercialProcess).toBe(null);
      expect(budgetInDb?.commercialNote).toBe(null);
      expect(budgetInDb?.observations).toBe(null);
      expect(budgetInDb?.items).toHaveLength(1);
    });
  });
});
