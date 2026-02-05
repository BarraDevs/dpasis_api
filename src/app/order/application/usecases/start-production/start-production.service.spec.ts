import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { CreateBudgetOutputDto } from 'src/app/budget/application/usecases/create-budget/dtos/create-budget.dto';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { InvalidOrderStatusTransitionError } from 'src/app/order/domain/errors/invalid-order-status-transition.error';
import { OrderNotFoundError } from 'src/app/order/domain/errors/order-not-found.error';
import { OrderStatus } from 'src/app/order/enums/order-status.enum';
import { OrderModule } from 'src/app/order/order.module';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateOrderFromBudget } from '../create-order-from-budget/create-order-from-budget.service';
import { StartProduction } from './start-production.service';

describe('StartProduction (Integration)', () => {
  let sut: StartProduction;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createProduct: CreateProduct;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let createOrderFromBudget: CreateOrderFromBudget;
  let companyId: string;
  let clientId: string;
  let sellerId: string;
  let productId: string;
  const accountId = 'account-admin-id';

  async function makeApprovedBudget(): Promise<CreateBudgetOutputDto> {
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

    sut = module.get(StartProduction);
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

    // Create client
    clientId = (await createClient.execute({
      kind: 'Cliente Tipo 1',
      cnpj: '22333444000181',
      ie: '123456789',
      group: 'Grupo Cliente 1',
      type: 'Tipo Cliente 1',
      generateInvoice: true,
      companyName: 'Client Company',
      fantasyName: 'Client Fantasy',
      owner: 'Owner',
      headquarters: 'Headquarters',
      companyIds: [companyId],
    })).id;

    // Create seller
    sellerId = (await createSeller.execute({
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
    it('should start production successfully', async() => {
      // Arrange
      const budget = await makeApprovedBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      const result = await sut.execute(orderId, accountId, { });

      // Assert
      expect(result).toEqual({ message: 'Produção iniciada com sucesso!' });

      // Verify order status was updated
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      expect(updatedOrder?.status).toBe(OrderStatus.PRODUCTION);
    });

    it('should start production with observation', async() => {
      // Arrange
      const budget = await makeApprovedBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      const observation = 'Iniciando produção conforme planejamento';

      // Act
      const result = await sut.execute(orderId, accountId, { observation });

      // Assert
      expect(result).toEqual({ message: 'Produção iniciada com sucesso!' });

      // Verify observation in status history
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      expect(updatedOrder?.statusHistory).toHaveLength(2);
      expect(updatedOrder?.statusHistory).toContainEqual(expect.objectContaining({
        status: OrderStatus.PRODUCTION,
        changedBy: accountId,
        observation,
      }));
    });

    it('should update status history correctly', async() => {
      // Arrange
      const budget = await makeApprovedBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Act
      await sut.execute(orderId, accountId, { observation: 'Test observation' });

      // Assert
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      expect(updatedOrder?.statusHistory).toHaveLength(2);
      expect(updatedOrder?.statusHistory).toContainEqual(expect.objectContaining({
        status: OrderStatus.CREATED,
        changedBy: accountId,
      }));
      expect(updatedOrder?.statusHistory).toContainEqual(expect.objectContaining({
        status: OrderStatus.PRODUCTION,
        changedBy: accountId,
        observation: 'Test observation',
      }));
    });

    it('should update updatedAt timestamp', async() => {
      // Arrange
      const budget = await makeApprovedBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      const orderBefore = await prisma.order.findUnique({
        where: { id: orderId },
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act
      await sut.execute(orderId, accountId, {});

      // Assert
      const orderAfter = await prisma.order.findUnique({
        where: { id: orderId },
      });

      expect(orderAfter?.updatedAt.getTime()).toBeGreaterThan(
        orderBefore!.updatedAt.getTime()
      );
    });
  });

  describe('Error Cases', () => {
    it('should throw OrderNotFoundError when order does not exist', async() => {
      // Arrange
      const nonExistentOrderId = 'non-existent-id';

      // Act & Assert
      await expect(
        sut.execute(nonExistentOrderId, accountId, {})
      ).rejects.toThrow(OrderNotFoundError);
    });

    it.each(
      Object.values(OrderStatus).filter((status) => status !== OrderStatus.CREATED)
    )('should throw InvalidOrderStatusTransitionError when order is %s', async(status) => {
      // Arrange
      const budget = await makeApprovedBudget();

      const { orderId } = await createOrderFromBudget.execute({
        budgetId: budget.id,
        accountId,
      });

      // Update order to CANCELLED manually
      await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      // Act & Assert
      await expect(sut.execute(orderId, accountId, {})).rejects.toThrow(InvalidOrderStatusTransitionError);
    });
  });
});
