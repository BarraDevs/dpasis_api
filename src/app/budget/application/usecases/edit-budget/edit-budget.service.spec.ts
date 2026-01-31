import { Test, TestingModule } from '@nestjs/testing';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetNotFoundError } from 'src/app/budget/domain/errors/budget-not-found.error';
import { InvalidBudgetStatusError } from 'src/app/budget/domain/errors/invalid-budget-status.error';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { SellerNotActiveError } from 'src/app/seller/domain/errors/seller-not-active.error';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { ServiceNotActiveError } from 'src/app/service/domain/errors/service-not-active.error';
import { CreateShipper } from 'src/app/shipper/application/usecases/create-shipper/create-shipper.service';
import { ShipperNotActiveError } from 'src/app/shipper/domain/errors/shipper-not-active.error';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateBudget } from '../create-budget/create-budget.service';
import { FindBudgetById } from '../find-budget-by-id/find-budget-by-id.service';
import { EditBudgetInputDto } from './dtos/edit-budget.dto';
import { EditBudget } from './edit-budget.service';

describe('EditBudget', () => {
  let sut: EditBudget;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createShipper: CreateShipper;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let createBudget: CreateBudget;
  let findBudgetById: FindBudgetById;
  let companyId: string;
  let clientId1: string;
  let sellerId1: string;
  let sellerId2: string;
  let shipperId1: string;
  let shipperId2: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;
  let budgetId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditBudget);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createShipper = module.get(CreateShipper);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);
    createBudget = module.get(CreateBudget);
    findBudgetById = module.get(FindBudgetById);

    await prisma.budget.deleteMany();
    await prisma.account.deleteMany();
    await prisma.product.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.service.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.client.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    // Create company
    companyId = (await createCompany.execute({
      name: 'Company Test',
      fantasyName: 'Company Fantasy Test',
      document: '71263115000117',
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
      cnpj: '10024513000196',
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

    // Create shippers
    shipperId1 = (await createShipper.execute({
      companyName: 'Shipper 1 Company',
      fantasyName: 'Shipper 1',
      cnpj: '27523497000189',
      contact: '1144444444',
      representative: 'Representative 1',
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

    shipperId2 = (await createShipper.execute({
      companyName: 'Shipper 2 Company',
      fantasyName: 'Shipper 2',
      cnpj: '48285681000108',
      contact: '1155555555',
      representative: 'Representative 2',
      zipCode: '98765-432',
      street: 'Another Shipper Street',
      number: '321',
      complement: null,
      reference: null,
      neighborhood: 'Another Neighborhood',
      city: 'Another City',
      state: 'ST',
      companyIds: [companyId],
    })).id;

    // Create supplier and product
    const supplierId = (await createSupplier.execute({
      cnpj: '84674963000160',
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
      brand: 'Brand Test',
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

    // Create a budget for testing
    const createdBudget = await createBudget.execute({
      companyId,
      clientId: clientId1,
      sellerId: sellerId1,
      freightType: 'CIF',
      shipperId: shipperId1,
      freightValueInCents: 5000,
      discountInCents: 1000,
      commercialProcess: 'PROC-001',
      commercialNote: 'Original note',
      observations: 'Original observations',
      items: [
        {
          itemType: BudgetItemType.PRODUCT,
          productId: product01Id,
          serviceId: null,
          description: 'Original Product',
          quantity: 10,
          unitPriceInCents: 1500,
          discountInCents: 100,
        },
      ],
    });
    budgetId = createdBudget.id;
  });

  afterEach(async() => {
    await prisma.budget.deleteMany();
    await prisma.product.deleteMany();
    await prisma.service.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.client.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw BudgetNotFoundError when budget does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const data: EditBudgetInputDto = { freightType: 'FOB' };

      // Act & Assert
      await expect(sut.execute(nonExistentId, data)).rejects.toThrow(BudgetNotFoundError);
    });

    it('should throw InvalidBudgetStatusError when budget is not PENDING', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.APPROVED },
      });
      const data: EditBudgetInputDto = { freightType: 'FOB' };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(InvalidBudgetStatusError);
    });

    it('should throw CompanyNotActiveError when company is inactive', async() => {
      // Arrange
      await prisma.company.update({
        where: { id: companyId },
        data: { active: false },
      });
      const data: EditBudgetInputDto = { companyId };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(CompanyNotActiveError);
    });

    it('should throw SellerNotActiveError when seller is inactive', async() => {
      // Arrange
      await prisma.seller.update({
        where: { id: sellerId2 },
        data: { active: false },
      });
      const data: EditBudgetInputDto = { sellerId: sellerId2 };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(SellerNotActiveError);
    });

    it('should throw ShipperNotActiveError when shipper is inactive', async() => {
      // Arrange
      await prisma.shipper.update({
        where: { id: shipperId2 },
        data: { active: false },
      });
      const data: EditBudgetInputDto = { shipperId: shipperId2 };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(ShipperNotActiveError);
    });

    it('should throw ProductOutOfStockError when product does not have enough stock', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product Test',
            quantity: 200, // More than available (100)
            unitPriceInCents: 1500,
            discountInCents: 0,
          },
        ],
      };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(ProductOutOfStockError);
    });

    it('should throw ServiceNotActiveError when service is inactive', async() => {
      // Arrange
      await prisma.service.update({
        where: { id: serviceId },
        data: { active: false },
      });
      const data: EditBudgetInputDto = {
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Service Test',
            quantity: 1,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(ServiceNotActiveError);
    });
  });

  describe('integration tests', () => {
    it('should edit basic budget data successfully', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        freightType: 'FOB',
        freightValueInCents: 3000,
        discountInCents: 500,
        commercialProcess: 'PROC-002',
        observations: 'Updated observations',
      };

      // Act
      const result = await sut.execute(budgetId, data);

      // Assert
      expect(result.message).toBe('Orçamento editado com sucesso!');

      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.freightType).toBe('FOB');
      expect(updatedBudget.freightValueInCents).toBe(3000);
      expect(updatedBudget.discountInCents).toBe(500);
      expect(updatedBudget.commercialProcess).toBe('PROC-002');
      expect(updatedBudget.observations).toBe('Updated observations');
      expect(updatedBudget.commercialNote).toBe('Original note'); // Unchanged
    });

    it('should edit shipper and seller successfully', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        shipperId: shipperId2,
        sellerId: sellerId2,
      };

      // Act
      await sut.execute(budgetId, data);

      // Assert
      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.shipperId).toBe(shipperId2);
      expect(updatedBudget.sellerId).toBe(sellerId2);
    });

    it('should edit shipper successfully', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        shipperId: shipperId2,
      };

      // Act
      await sut.execute(budgetId, data);

      // Assert
      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.shipperId).toBe(shipperId2);
    });

    it('should remove shipper by setting it to null', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        shipperId: null,
      };

      // Act
      await sut.execute(budgetId, data);

      // Assert
      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.shipperId).toBeNull();
    });

    it('should edit budget items successfully', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Updated Product',
            quantity: 5,
            unitPriceInCents: 2000,
            discountInCents: 50,
          },
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'New Service',
            quantity: 2,
            unitPriceInCents: 3000,
            discountInCents: 0,
          },
        ],
      };

      // Act
      await sut.execute(budgetId, data);

      // Assert
      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.items).toHaveLength(2);
      expect(updatedBudget.items[0].description).toBe('Updated Product');
      expect(updatedBudget.items[0].quantity).toBe(5);
      expect(updatedBudget.items[1].itemType).toBe('Serviço');
      expect(updatedBudget.items[1].description).toBe('New Service');
    });

    it('should recalculate totals correctly when editing', async() => {
      // Arrange
      const data: EditBudgetInputDto = {
        freightValueInCents: 2000,
        discountInCents: 0,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product',
            quantity: 3,
            unitPriceInCents: 1000, // 3 * 1000 = 3000
            discountInCents: 100, // subtotal: 2900
          },
        ],
      };
      // Expected: subtotal = 2900, total = 2900 + 2000 - 0 = 4900

      // Act
      await sut.execute(budgetId, data);

      // Assert
      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.subtotalInCents).toBe(2900);
      expect(updatedBudget.totalInCents).toBe(4900);
    });

    it('should edit only specific fields (partial update)', async() => {
      // Arrange
      const originalBudget = await findBudgetById.execute(budgetId);
      const data: EditBudgetInputDto = {
        observations: 'Only observations changed',
      };

      // Act
      await sut.execute(budgetId, data);

      // Assert
      const updatedBudget = await findBudgetById.execute(budgetId);
      expect(updatedBudget.observations).toBe('Only observations changed');
      // All other fields should remain unchanged
      expect(updatedBudget.clientId).toBe(originalBudget.clientId);
      expect(updatedBudget.sellerId).toBe(originalBudget.sellerId);
      expect(updatedBudget.freightType).toBe(originalBudget.freightType);
      expect(updatedBudget.freightValueInCents).toBe(originalBudget.freightValueInCents);
    });

    it('should not allow editing when budget is APPROVED', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.APPROVED },
      });
      const data: EditBudgetInputDto = { freightType: 'FOB' };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(InvalidBudgetStatusError);
    });

    it('should not allow editing when budget is REJECTED', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.REJECTED },
      });
      const data: EditBudgetInputDto = { freightType: 'FOB' };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(InvalidBudgetStatusError);
    });

    it('should not allow editing when budget is CANCELLED', async() => {
      // Arrange
      await prisma.budget.update({
        where: { id: budgetId },
        data: { status: BudgetStatus.CANCELLED },
      });
      const data: EditBudgetInputDto = { freightType: 'FOB' };

      // Act & Assert
      await expect(sut.execute(budgetId, data)).rejects.toThrow(InvalidBudgetStatusError);
    });
  });
});
