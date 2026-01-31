import { Test, TestingModule } from '@nestjs/testing';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateShipper } from 'src/app/shipper/application/usecases/create-shipper/create-shipper.service';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CreateBudget } from '../create-budget/create-budget.service';
import { FindAllBudgetQueryDto } from './dtos/find-all-budget.dto';
import { FindAllBudget } from './find-all-budget.service';

describe('FindAllBudget', () => {
  let sut: FindAllBudget;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createShipper: CreateShipper;
  let createProduct: CreateProduct;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let companyId: string;
  let clientId1: string;
  let clientId2: string;
  let sellerId1: string;
  let sellerId2: string;
  let shipperId: string;
  let productId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllBudget);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createShipper = module.get(CreateShipper);
    createProduct = module.get(CreateProduct);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);

    await prisma.truncate();

    // Create company
    companyId = (await createCompany.execute({
      name: 'Company Test',
      fantasyName: 'Company Fantasy Test',
      document: '63956387000174',
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
      cnpj: '22004835000152',
      ie: '123456789',
      group: 'Grupo Cliente',
      type: 'Tipo Cliente',
      generateInvoice: true,
      companyName: 'Client 1 Company',
      fantasyName: 'Client 1',
      owner: 'Owner 1',
      headquarters: 'Headquarters 1',
      companyIds: [companyId],
    })).id;

    clientId2 = (await createClient.execute({
      kind: 'Cliente Tipo 2',
      cnpj: '26486387000121',
      ie: '987654321',
      group: 'Grupo Cliente 2',
      type: 'Tipo Cliente 2',
      generateInvoice: false,
      companyName: 'Client 2 Company',
      fantasyName: 'Client 2',
      owner: 'Owner 2',
      headquarters: 'Headquarters 2',
      companyIds: [companyId],
    })).id;

    // Create sellers
    sellerId1 = (await createSeller.execute({
      name: 'Seller 1',
      nickname: 'Seller 1 Nick',
      phone: '1133333333',
      cellphone: '11999999999',
      email: 'seller1@test.com',
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

    sellerId2 = (await createSeller.execute({
      name: 'Seller 2',
      nickname: 'Seller 2 Nick',
      phone: '1144444444',
      cellphone: '11888888888',
      email: 'seller2@test.com',
      password: 'password456',
      commission: 10,
      zipCode: '98765-432',
      street: 'Another Street',
      number: '789',
      complement: null,
      reference: null,
      neighborhood: 'Another Neighborhood',
      city: 'Another City',
      state: 'ST',
      observation: null,
      companyIds: [companyId],
    })).id;

    // Create shipper
    shipperId = (await createShipper.execute({
      companyName: 'Shipper Company',
      fantasyName: 'Shipper Fantasy',
      cnpj: '14551353000194',
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

    // Create supplier and product
    const supplierId = (await createSupplier.execute({
      cnpj: '44613537000100',
      ie: '111222333',
      group: 'Supplier Group',
      type: 'Nacional',
      companyName: 'Supplier Company',
      fantasyName: 'Supplier Fantasy',
      representative: 'Supplier Rep',
      companyIds: [companyId],
    })).id;

    productId = (await createProduct.execute({
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

    await prisma.product.update({
      where: { id: productId },
      data: { currentStock: 100 },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should return paginated budgets', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { page: 1, size: 10 };
      const mockBudgets = [
        { id: '1', companyId, clientId: clientId1, items: [] } as any,
        { id: '2', companyId, clientId: clientId2, items: [] } as any,
      ];
      const findAllSpy = jest.spyOn(sut['budgetDao'], 'findAll').mockResolvedValue([mockBudgets, 2]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        companyId: undefined,
        clientId: undefined,
        sellerId: undefined,
        shipperId: undefined,
        freightType: undefined,
        status: undefined,
        createdAtStart: undefined,
        createdAtEnd: undefined,
      });
      expect(result.data).toEqual(mockBudgets);
      expect(result.totalItems).toBe(2);
    });

    it('should pass filters to DAO correctly', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = {
        page: 2,
        size: 5,
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
        shipperId,
        freightType: 'CIF',
        status: BudgetStatus.PENDING,
        createdAtStart: '2024-01-01T00:00:00.000Z',
        createdAtEnd: '2024-12-31T23:59:59.999Z',
      };
      const findAllSpy = jest.spyOn(sut['budgetDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith({
        page: 2,
        size: 5,
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
        shipperId,
        freightType: 'CIF',
        status: BudgetStatus.PENDING,
        createdAtStart: '2024-01-01T00:00:00.000Z',
        createdAtEnd: '2024-12-31T23:59:59.999Z',
      });
    });
  });

  describe('integration tests', () => {
    beforeEach(async() => {
      // Create multiple budgets for testing filters
      // Budget 1: Client 1, Seller 1, CIF, PENDING
      await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId1,
        freightType: 'CIF',
        shipperId,
        freightValueInCents: 5000,
        discountInCents: 1000,
        commercialProcess: 'PROC-001',
        commercialNote: null,
        observations: 'Budget 1',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Product 1',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      });

      // Budget 2: Client 2, Seller 1, FOB, PENDING
      await createBudget.execute({
        companyId,
        clientId: clientId2,
        sellerId: sellerId1,
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: 'PROC-002',
        commercialNote: null,
        observations: 'Budget 2',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Product 2',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 0,
          },
        ],
      });

      // Budget 3: Client 1, Seller 2, CIF, PENDING
      await createBudget.execute({
        companyId,
        clientId: clientId1,
        sellerId: sellerId2,
        freightType: 'CIF',
        shipperId,
        freightValueInCents: 4000,
        discountInCents: 0,
        commercialProcess: 'PROC-003',
        commercialNote: null,
        observations: 'Budget 3',
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId,
            serviceId: null,
            description: 'Product 3',
            quantity: 8,
            unitPriceInCents: 1800,
            discountInCents: 50,
          },
        ],
      });
    });

    it('should return all budgets without filters', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = {};

      // Act
      const result: IPagination<any> = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.totalItems).toBe(3);
      expect(result.totalPages).toBe(1);
      expect(result.itemsPerPage).toBe(3);
    });

    it('should filter budgets by companyId', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { companyId };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data.every((b) => b.companyId === companyId)).toBe(true);
    });

    it('should filter budgets by clientId', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { clientId: clientId1 };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every((b) => b.clientId === clientId1)).toBe(true);
    });

    it('should filter budgets by sellerId', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { sellerId: sellerId1 };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every((b) => b.sellerId === sellerId1)).toBe(true);
    });

    it('should filter budgets by shipperId', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { shipperId };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every((b) => b.shipperId === shipperId)).toBe(true);
    });

    it('should filter budgets by freightType', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { freightType: 'CIF' };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every((b) => b.freightType === 'CIF')).toBe(true);
    });

    it('should filter budgets by status', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { status: BudgetStatus.PENDING };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data.every((b) => b.status === 'Pendente')).toBe(true);
    });

    it('should filter budgets with multiple filters', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = {
        clientId: clientId1,
        sellerId: sellerId1,
        freightType: 'CIF',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].clientId).toBe(clientId1);
      expect(result.data[0].sellerId).toBe(sellerId1);
      expect(result.data[0].freightType).toBe('CIF');
    });

    it('should paginate budgets correctly', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { page: 1, size: 2 };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should return second page correctly', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { page: 2, size: 2 };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should return empty array when no budgets match filters', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { status: BudgetStatus.APPROVED };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });

    it('should include budget items in response', async() => {
      // Arrange
      const queries: FindAllBudgetQueryDto = { clientId: clientId1 };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data[0].items).toBeDefined();
      expect(result.data[0].items.length).toBeGreaterThan(0);
      expect(result.data[0].items[0]).toHaveProperty('itemType');
      expect(result.data[0].items[0]).toHaveProperty('quantity');
      expect(result.data[0].items[0]).toHaveProperty('unitPriceInCents');
    });
  });
});
