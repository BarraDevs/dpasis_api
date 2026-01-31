import { Test, TestingModule } from '@nestjs/testing';
import { BudgetModule } from 'src/app/budget/budget.module';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { ClientNotActiveError } from 'src/app/client/domain/errors/client-not-active.error';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { SellerNotActiveError } from 'src/app/seller/domain/errors/seller-not-active.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { ServiceNotActiveError } from 'src/app/service/domain/errors/service-not-active.error';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { CreateShipper } from 'src/app/shipper/application/usecases/create-shipper/create-shipper.service';
import { ShipperNotActiveError } from 'src/app/shipper/domain/errors/shipper-not-active.error';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found.error';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindBudgetById } from '../find-budget-by-id/find-budget-by-id.service';
import { CreateBudget } from './create-budget.service';
import { CreateBudgetInputDto } from './dtos/create-budget.dto';

describe('CreateBudget', () => {
  let sut: CreateBudget;
  let prisma: PrismaService;
  let findBudgetById: FindBudgetById;
  let createCompany: CreateCompany;
  let createClient: CreateClient;
  let createSeller: CreateSeller;
  let createShipper: CreateShipper;
  let createProduct: CreateProduct;
  let createService: CreateService;
  let createSupplier: CreateSupplier;
  let data: CreateBudgetInputDto;
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

    sut = module.get(CreateBudget);
    findBudgetById = module.get(FindBudgetById);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createClient = module.get(CreateClient);
    createSeller = module.get(CreateSeller);
    createShipper = module.get(CreateShipper);
    createProduct = module.get(CreateProduct);
    createService = module.get(CreateService);
    createSupplier = module.get(CreateSupplier);

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
      document: '51269677000160',
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
      cnpj: '45502271000183',
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
      cnpj: '64818300000165',
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
      cnpj: '51506209000162',
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

    data = {
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
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyId: 'non-existent-company-id' };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw CompanyNotActiveError when company is inactive', async() => {
      // Arrange
      await prisma.company.update({
        where: { id: companyId },
        data: { active: false },
      });
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if client does not exist', async() => {
      // Arrange
      const invalidData = { ...data, clientId: 'non-existent-client-id' };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ClientNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw ClientNotActiveError when client is inactive', async() => {
      // Arrange
      await prisma.client.update({
        where: { id: clientId },
        data: { active: false },
      });
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ClientNotActiveError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if seller does not exist', async() => {
      // Arrange
      const invalidData = { ...data, sellerId: 'non-existent-seller-id' };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(SellerNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw SellerNotActiveError when seller is inactive', async() => {
      // Arrange
      await prisma.seller.update({
        where: { id: sellerId },
        data: { active: false },
      });
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(SellerNotActiveError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if shipper does not exist', async() => {
      // Arrange
      const invalidData = { ...data, shipperId: 'non-existent-shipper-id' };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ShipperNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw ShipperNotActiveError when shipper is inactive', async() => {
      // Arrange
      await prisma.shipper.update({
        where: { id: shipperId },
        data: { active: false },
      });
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ShipperNotActiveError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if product does not exist', async() => {
      // Arrange
      const invalidData = {
        ...data,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: 'non-existent-product-id',
            serviceId: null,
            description: 'Product Test',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw ProductOutOfStockError when product does not have enough stock', async() => {
      // Arrange
      const invalidData = {
        ...data,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product Test',
            quantity: 100, // More than available stock (50)
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ProductOutOfStockError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if service does not exist', async() => {
      // Arrange
      const invalidData = {
        ...data,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId: 'non-existent-service-id',
            description: 'Service Test',
            quantity: 1,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      };
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ServiceNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw ServiceNotActiveError when service is inactive', async() => {
      // Arrange
      await prisma.service.update({
        where: { id: serviceId },
        data: { active: false },
      });
      const invalidData = {
        ...data,
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
      const saveSpy = jest.spyOn(sut['budgetRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ServiceNotActiveError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should not validate shipper when shipperId is null', async() => {
      // Arrange
      const dataWithoutShipper = { ...data, shipperId: null };

      // Act
      const result = await sut.execute(dataWithoutShipper);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.id).toBeDefined();
    });

    it('should not call FindShipperById when shipperId is not provided', async() => {
      // Arrange
      const dataWithoutShipper = { ...data, shipperId: null };
      const findShipperSpy = jest.spyOn(sut['findShipperById'], 'execute');

      // Act
      await sut.execute(dataWithoutShipper);

      // Assert
      expect(findShipperSpy).not.toHaveBeenCalled();
    });

    it('should not call FindProductById when item type is SERVICE', async() => {
      // Arrange
      const dataWithService = {
        ...data,
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
      const findProductSpy = jest.spyOn(sut['findProductById'], 'execute');
      const findServiceSpy = jest.spyOn(sut['findServiceById'], 'execute');

      // Act
      await sut.execute(dataWithService);

      // Assert
      expect(findProductSpy).not.toHaveBeenCalled();
      expect(findServiceSpy).toHaveBeenCalledWith(serviceId);
    });

    it('should not call FindServiceById when item type is PRODUCT', async() => {
      // Arrange
      const dataWithProduct = {
        ...data,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product Test',
            quantity: 10,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      };
      const findProductSpy = jest.spyOn(sut['findProductById'], 'execute');
      const findServiceSpy = jest.spyOn(sut['findServiceById'], 'execute');

      // Act
      await sut.execute(dataWithProduct);

      // Assert
      expect(findServiceSpy).not.toHaveBeenCalled();
      expect(findProductSpy).toHaveBeenCalledWith(product01Id);
    });
  });

  describe('integration tests', () => {
    it('should create a budget successfully with product item', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.id).toBeDefined();

      const budgetCreated = await findBudgetById.execute(result.id);
      expect(budgetCreated).toBeDefined();
      expect(budgetCreated.companyId).toBe(companyId);
      expect(budgetCreated.clientId).toBe(clientId);
      expect(budgetCreated.sellerId).toBe(sellerId);
      expect(budgetCreated.shipperId).toBe(shipperId);
      expect(budgetCreated.freightType).toBe('CIF');
      expect(budgetCreated.freightValueInCents).toBe(5000);
      expect(budgetCreated.discountInCents).toBe(1000);
      expect(budgetCreated.status).toBe('Pendente');
      expect(budgetCreated.items).toHaveLength(1);
      expect(budgetCreated.items[0].itemType).toBe('Produto');
      expect(budgetCreated.items[0].productId).toBe(product01Id);
      expect(budgetCreated.items[0].quantity).toBe(10);
    });

    it('should create a budget successfully with service item', async() => {
      // Arrange
      const serviceData = {
        ...data,
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Service Item',
            quantity: 2,
            unitPriceInCents: 5000,
            discountInCents: 500,
          },
        ],
      };

      // Act
      const result = await sut.execute(serviceData);

      // Assert
      expect(result).toHaveProperty('id');
      const budgetCreated = await findBudgetById.execute(result.id);
      expect(budgetCreated.items).toHaveLength(1);
      expect(budgetCreated.items[0].itemType).toBe('Serviço');
      expect(budgetCreated.items[0].serviceId).toBe(serviceId);
      expect(budgetCreated.items[0].quantity).toBe(2);
    });

    it('should create a budget with multiple items (products and services)', async() => {
      // Arrange
      const multipleItemsData = {
        ...data,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product Item',
            quantity: 5,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
          {
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId,
            description: 'Service Item',
            quantity: 1,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      };

      // Act
      const result = await sut.execute(multipleItemsData);

      // Assert
      expect(result).toHaveProperty('id');
      const budgetCreated = await findBudgetById.execute(result.id);
      expect(budgetCreated.items).toHaveLength(2);
      expect(budgetCreated.items[0].itemType).toBe('Produto');
      expect(budgetCreated.items[1].itemType).toBe('Serviço');
    });

    it('should calculate subtotal and total correctly', async() => {
      // Arrange
      const calculationData = {
        ...data,
        freightValueInCents: 3000,
        discountInCents: 500,
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product 1',
            quantity: 2,
            unitPriceInCents: 1000, // 2 * 1000 = 2000
            discountInCents: 200, // Subtotal item: 1800
          },
          {
            itemType: BudgetItemType.PRODUCT,
            productId: product01Id,
            serviceId: null,
            description: 'Product 2',
            quantity: 3,
            unitPriceInCents: 2000, // 3 * 2000 = 6000
            discountInCents: 0, // Subtotal item: 6000
          },
        ],
      };
      // Expected: subtotalInCents = 1800 + 6000 = 7800
      // Expected: totalInCents = 7800 + 3000 (freight) - 500 (discount) = 10300

      // Act
      const result = await sut.execute(calculationData);

      // Assert
      const budgetCreated = await findBudgetById.execute(result.id);
      expect(budgetCreated.subtotalInCents).toBe(7800);
      expect(budgetCreated.totalInCents).toBe(10300);
    });

    it('should create budget without shipper', async() => {
      // Arrange
      const dataWithoutShipper = { ...data, shipperId: null };

      // Act
      const result = await sut.execute(dataWithoutShipper);

      // Assert
      const budgetCreated = await findBudgetById.execute(result.id);
      expect(budgetCreated.shipperId).toBeNull();
    });

    it('should create budget with optional fields', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      const budgetCreated = await findBudgetById.execute(result.id);
      expect(budgetCreated.commercialProcess).toBe('PROC-2024-001');
      expect(budgetCreated.commercialNote).toBe('Nota comercial');
      expect(budgetCreated.observations).toBe('Observações gerais');
    });
  });
});
