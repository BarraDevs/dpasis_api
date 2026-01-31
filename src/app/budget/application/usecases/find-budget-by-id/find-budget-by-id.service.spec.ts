import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateShipper } from 'src/app/shipper/application/usecases/create-shipper/create-shipper.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BudgetDto } from '../../dtos/budget.dto';
import { CreateBudget } from '../create-budget/create-budget.service';
import { FindBudgetById } from './find-budget-by-id.service';

describe('FindBudgetById', () => {
  let sut: FindBudgetById;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createShipper: CreateShipper;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let companyId: string;
  let clientId: string;
  let sellerId: string;
  let shipperId: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindBudgetById);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createShipper = module.get(CreateShipper);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);

    await prisma.truncate();

    // Create company
    companyId = (await createCompany.execute({
      name: 'Company Test',
      fantasyName: 'Company Fantasy Test',
      document: '51506209000162',
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
      kind: 'Cliente Tipo',
      cnpj: '67377482000174',
      ie: '123456789',
      group: 'Grupo Cliente',
      type: 'Tipo Cliente',
      generateInvoice: true,
      companyName: 'Client Company Test',
      fantasyName: 'Client Fantasy Test',
      owner: 'Owner Test',
      headquarters: 'Headquarters Test',
      companyIds: [companyId],
    })).id;

    // Create seller
    sellerId = (await createSeller.execute({
      name: 'Seller Test',
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

    // Create shipper
    shipperId = (await createShipper.execute({
      companyName: 'Shipper Company',
      fantasyName: 'Shipper Fantasy',
      cnpj: '71576927000112',
      contact: '1144444444',
      representative: 'Representative Test',
      zipCode: '12345-678',
      street: 'Shipper Street',
      number: '789',
      complement: null,
      reference: null,
      neighborhood: 'Shipper Neighborhood',
      city: 'Shipper City',
      state: 'ST',
      companyIds: [companyId],
    })).id;

    // Create supplier for product
    const supplierId = (await createSupplier.execute({
      cnpj: '99586556000179',
      ie: '987654321',
      group: 'Supplier Group',
      type: 'Nacional',
      companyName: 'Supplier Company',
      fantasyName: 'Supplier Fantasy',
      representative: 'Supplier Rep',
      companyIds: [companyId],
    })).id;

    // Create product with stock
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
      type: 'Product Type 2',
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

    // Add stock to product
    await prisma.product.update({
      where: { id: product01Id },
      data: { currentStock: 50 },
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
      const nonExistentId = 'non-existent-id';
      jest.spyOn(sut['budgetDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(BudgetNotFoundError);
      expect(sut['budgetDao'].findById).toHaveBeenCalledWith(nonExistentId);
    });

    it('should return budget data when budget exists', async() => {
      // Arrange
      const budget = createMock<BudgetDto>();
      const findByIdSpy = jest.spyOn(sut['budgetDao'], 'findById').mockResolvedValue(budget);

      // Act
      const result = await sut.execute('existing-budget-id');

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('existing-budget-id');
      expect(result).toBe(budget);
    });
  });

  describe('integration tests', () => {
    it('should throw BudgetNotFoundError when budget does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(BudgetNotFoundError);
    });

    it('should return correct dto when budget with product item is found', async() => {
      // Arrange
      const budgetData = {
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: 'PROC-2024-001',
        commercialNote: 'Nota comercial',
        observations: 'Observações gerais',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product Item',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      };
      const createdBudget = await createBudget.execute(budgetData);

      // Act
      const result = await sut.execute(createdBudget.id);

      // Assert
      expect(result).toEqual<BudgetDto>({
        id: createdBudget.id,
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId,
        freightValueInCents: 5000,
        discountInCents: 1000,
        subtotalInCents: 14900, // (10 * 1500) - 100
        totalInCents: 18900, // 14900 + 5000 - 1000
        commercialProcess: 'PROC-2024-001',
        commercialNote: 'Nota comercial',
        observations: 'Observações gerais',
        status: 'Pendente',
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        items: [
          {
            id: expect.any(String),
            itemType: 'Produto',
            productId: product01Id,
            serviceId: null,
            description: 'Product Item',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
            subtotalInCents: 14900,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      });
    });

    it('should return correct dto when budget with service item is found', async() => {
      // Arrange
      const budgetData = {
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
            description: 'Service Item',
            quantity: 2,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      };
      const createdBudget = await createBudget.execute(budgetData);

      // Act
      const result = await sut.execute(createdBudget.id);

      // Assert
      expect(result).toEqual<BudgetDto>({
        id: createdBudget.id,
        companyId,
        clientId,
        sellerId,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        subtotalInCents: 10000, // 2 * 5000
        totalInCents: 12500, // 10000 + 3000 - 500
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        status: 'Pendente',
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        items: [
          {
            id: expect.any(String),
            itemType: 'Serviço',
            productId: null,
            serviceId,
            description: 'Service Item',
            quantity: 2,
            unitPriceInCents: 5000,
            discountInCents: 0,
            subtotalInCents: 10000,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      });
    });

    it('should return budget with multiple items', async() => {
      // Arrange
      const budgetData = {
        companyId,
        clientId,
        sellerId,
        freightType: 'CIF',
        shipperId,
        freightValueInCents: 2000,
        discountInCents: 0,
        commercialProcess: 'PROC-2024-002',
        commercialNote: null,
        observations: 'Múltiplos itens',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product 1',
            quantity: 5,
            unitPriceInCents: 1000,
            discountInCents: 50,
          },
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Service 1',
            quantity: 1,
            unitPriceInCents: 3000,
            discountInCents: 0,
          },
        ],
      };
      const createdBudget = await createBudget.execute(budgetData);

      // Act
      const result = await sut.execute(createdBudget.id);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0].itemType).toBe('Produto');
      expect(result.items[1].itemType).toBe('Serviço');
      expect(result.subtotalInCents).toBe(7950); // (5 * 1000 - 50) + (1 * 3000)
      expect(result.totalInCents).toBe(9950); // 7950 + 2000 - 0
    });
  });
});
