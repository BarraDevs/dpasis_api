import { Test, TestingModule } from '@nestjs/testing';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { InvalidBudgetStatusError } from 'src/app/budget/domain/errors/invalid-budget-status.error';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateBudget } from '../create-budget/create-budget.service';
import { FindBudgetById } from '../find-budget-by-id/find-budget-by-id.service';
import { RejectBudget } from './reject-budget.service';

describe('RejectBudget', () => {
  let sut: RejectBudget;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let findBudgetById: FindBudgetById;
  let companyId: string;
  let clientId: string;
  let sellerId: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;
  let budgetId: string;
  const accountId = 'account-admin-id';
  const rejectionReason = 'Preço muito alto';

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(RejectBudget);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);
    findBudgetById = module.get(FindBudgetById);

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
      state: 'ST',
      observation: null,
      companyIds: [companyId],
    })).id;

    // Create supplier and product
    const supplierId = (await createSupplier.execute({
      cnpj: '73321315000104',
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

    // Create a budget for testing (with product)
    const createdBudget = await createBudget.execute({
      companyId,
      clientId,
      sellerId,
      freightType: 'CIF',
      shipperId: null,
      freightValueInCents: 5000,
      discountInCents: 1000,
      commercialProcess: 'PROC-001',
      commercialNote: 'Test note',
      observations: 'Test observations',
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
    budgetId = createdBudget.id;
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
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(sut.execute(nonExistentId, { accountId, reason: rejectionReason })).rejects.toThrow(BudgetNotFoundError);
    });

    it('should throw InvalidBudgetStatusError when budget is not PENDING', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.APPROVED },
      });

      // Act & Assert
      await expect(sut.execute(budgetId, { accountId, reason: rejectionReason })).rejects.toThrow(InvalidBudgetStatusError);
    });
  });

  describe('integration tests', () => {
    it('should reject PENDING budget with product successfully', async() => {
      // Arrange
      const budget = await findBudgetById.execute(budgetId);
      expect(budget.status).toBe('Pendente');
      expect(budget.items[0].itemType).toBe('Produto');
      expect(budget.items[0].productId).toBe(product01Id);

      // Act
      const result = await sut.execute(budgetId, { accountId, reason: rejectionReason });

      // Assert
      expect(result.message).toBe('Orçamento rejeitado com sucesso!');

      const rejectedBudget = await findBudgetById.execute(budgetId);
      expect(rejectedBudget.status).toBe('Rejeitado');
      expect(rejectedBudget.rejectedBy).toBe(accountId);
      expect(rejectedBudget.rejectedAt).toBeDefined();
      expect(rejectedBudget.rejectionReason).toBe(rejectionReason);
    });

    it('should reject PENDING budget with service successfully', async() => {
      // Arrange
      const budgetWithService = await createBudget.execute({
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

      const budget = await findBudgetById.execute(budgetWithService.id);
      expect(budget.status).toBe('Pendente');
      expect(budget.items[0].itemType).toBe('Serviço');
      expect(budget.items[0].serviceId).toBe(serviceId);

      // Act
      const result = await sut.execute(budgetWithService.id, { accountId, reason: rejectionReason });

      // Assert
      expect(result.message).toBe('Orçamento rejeitado com sucesso!');

      const rejectedBudget = await findBudgetById.execute(budgetWithService.id);
      expect(rejectedBudget.status).toBe('Rejeitado');
      expect(rejectedBudget.rejectedBy).toBe(accountId);
      expect(rejectedBudget.rejectionReason).toBe(rejectionReason);
    });

    it('should reject budget with different rejection reasons', async() => {
      // Arrange
      const reasons = [
        'Preço muito alto',
        'Cliente desistiu',
        'Produto indisponível',
        'Prazo de entrega inadequado',
      ];

      for (const reason of reasons) {
        const testBudget = await createBudget.execute({
          companyId,
          clientId,
          sellerId,
          freightType: 'FOB',
          shipperId: null,
          freightValueInCents: 2000,
          discountInCents: 0,
          commercialProcess: null,
          commercialNote: null,
          observations: null,
          items: [
            {
              itemType: BudgetItemType.PRODUCT,
              productId: product01Id,
              serviceId: null,
              description: 'Test',
              quantity: 1,
              unitPriceInCents: 1000,
              discountInCents: 0,
            },
          ],
        });

        // Act
        await sut.execute(testBudget.id, { accountId, reason });

        // Assert
        const rejectedBudget = await findBudgetById.execute(testBudget.id);
        expect(rejectedBudget.status).toBe('Rejeitado');
        expect(rejectedBudget.rejectionReason).toBe(reason);
      }
    });

    it('should not reject budget that is APPROVED', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.APPROVED },
      });

      const budget = await findBudgetById.execute(budgetId);
      expect(budget.status).toBe('Aprovado');

      // Act & Assert
      await expect(sut.execute(budgetId, { accountId, reason: rejectionReason })).rejects.toThrow(InvalidBudgetStatusError);
    });

    it('should not reject budget that is REJECTED', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.REJECTED },
      });

      const budget = await findBudgetById.execute(budgetId);
      expect(budget.status).toBe('Rejeitado');

      // Act & Assert
      await expect(sut.execute(budgetId, { accountId, reason: rejectionReason })).rejects.toThrow(InvalidBudgetStatusError);
    });

    it('should not reject budget that is CANCELLED', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.CANCELLED },
      });

      const budget = await findBudgetById.execute(budgetId);
      expect(budget.status).toBe('Cancelado');

      // Act & Assert
      await expect(sut.execute(budgetId, { accountId, reason: rejectionReason })).rejects.toThrow(InvalidBudgetStatusError);
    });

    it('should preserve budget data when rejecting', async() => {
      // Arrange
      const originalBudget = await findBudgetById.execute(budgetId);

      // Act
      await sut.execute(budgetId, { accountId, reason: rejectionReason });

      // Assert
      const rejectedBudget = await findBudgetById.execute(budgetId);
      expect(rejectedBudget.status).toBe('Rejeitado');
      expect(rejectedBudget.companyId).toBe(originalBudget.companyId);
      expect(rejectedBudget.clientId).toBe(originalBudget.clientId);
      expect(rejectedBudget.sellerId).toBe(originalBudget.sellerId);
      expect(rejectedBudget.totalInCents).toBe(originalBudget.totalInCents);
      expect(rejectedBudget.items).toHaveLength(originalBudget.items.length);
    });

    it('should track who rejected and when', async() => {
      // Arrange
      const differentAccountId = 'account-manager-id';
      const beforeRejection = new Date();

      // Act
      await sut.execute(budgetId, { accountId: differentAccountId, reason: rejectionReason });

      // Assert
      const rejectedBudget = await findBudgetById.execute(budgetId);
      expect(rejectedBudget.rejectedBy).toBe(differentAccountId);
      expect(rejectedBudget.rejectedAt).toBeDefined();
      expect(new Date(rejectedBudget.rejectedAt!)).toBeInstanceOf(Date);
      expect(new Date(rejectedBudget.rejectedAt!).getTime()).toBeGreaterThanOrEqual(beforeRejection.getTime());
    });

    it('should not affect other budgets when rejecting one', async() => {
      // Arrange
      const anotherBudget = await createBudget.execute({
        companyId,
        clientId,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 2000,
        discountInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Another Service',
            quantity: 1,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      });

      const originalStatus = (await findBudgetById.execute(anotherBudget.id)).status;

      // Act
      await sut.execute(budgetId, { accountId, reason: rejectionReason });

      // Assert
      const rejectedBudget = await findBudgetById.execute(budgetId);
      expect(rejectedBudget.status).toBe('Rejeitado');

      const otherBudget = await findBudgetById.execute(anotherBudget.id);
      expect(otherBudget.status).toBe(originalStatus);
    });
  });
});
