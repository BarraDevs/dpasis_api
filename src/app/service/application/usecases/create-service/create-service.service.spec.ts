import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductModule } from 'src/app/product/product.module';
import { CreateServiceCategory } from 'src/app/service-category/application/usecases/create-service-category/create-service-category.service';
import { ServiceCategoryNotActiveError } from 'src/app/service-category/domain/errors/service-category-not-active.error';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ServiceModule } from 'src/app/service/service.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateService } from './create-service.service';
import { CreateServiceInputDto, CreateServiceOutputDto } from './dtos/create-service.dto';

describe('CreateService', () => {
  let sut: CreateService;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let createProduct: CreateProduct;
  let createServiceCategory: CreateServiceCategory;
  let companyId: string;
  let categoryId: string;
  let product01Id: string;
  let product02Id: string;
  let data: CreateServiceInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceModule,
        ServiceCategoryModule,
        ProductModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateService);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createProduct = module.get(CreateProduct);
    createServiceCategory = module.get(CreateServiceCategory);

    await prisma.serviceProduct.deleteMany();
    await prisma.service.deleteMany();
    await prisma.product.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.company.deleteMany();

    companyId = (await createCompany.execute({
      name: 'Company Test',
      fantasyName: 'Company Test Fantasy',
      document: '61067756000142',
      ie: 'ie teste',
      zipCode: '12345678',
      street: 'Rua Teste',
      number: '100',
      neighborhood: 'Centro',
      complement: null,
      reference: null,
      city: 'Cidade',
      state: 'SP',
      cellphone: '11999999999',
      phone01: '1133334444',
      phone02: null,
      email01: 'company@test.com',
      email02: null,
    })).id;

    categoryId = (await createServiceCategory.execute({
      name: 'Manutenção',
    })).id;

    product01Id = (await createProduct.execute({
      companyId,
      type: 'MERCADORIA',
      group01: 'Geral',
      group02: 'Geral',
      description: 'Produto 01',
      complement: null,
      manufacturerCode: 'MFG001',
      brand: 'Marca',
      measureUnit: 'UN',
      ncm: '00000000',
      economicBatch: 'BATCH001',
      minimumStock: 0,
      maximumStock: 100,
      warrantyDays: 0,
      weightInKg: 1,
      heightInCm: 10,
      lengthInCm: 10,
      widthInCm: 10,
      markup: 0,
      marginB: 0,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 2000,
      ean: '7891234567890',
      additionalInfo: null,
      supplierIds: [],
      images: [],
    })).id;

    product02Id = (await createProduct.execute({
      companyId,
      type: 'MERCADORIA',
      group01: 'Geral',
      group02: 'Geral',
      description: 'Produto 02',
      complement: null,
      manufacturerCode: 'MFG002',
      brand: 'Marca',
      measureUnit: 'UN',
      ncm: '00000000',
      economicBatch: 'BATCH002',
      minimumStock: 0,
      maximumStock: 100,
      warrantyDays: 0,
      weightInKg: 1,
      heightInCm: 10,
      lengthInCm: 10,
      widthInCm: 10,
      markup: 0,
      marginB: 0,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 2000,
      ean: '7891234567891',
      additionalInfo: null,
      supplierIds: [],
      images: [],
    })).id;

    data = {
      name: 'Manutenção Preventiva',
      nickname: 'Manutenção',
      companyId,
      categoryId,
      productIds: [product01Id, product02Id],
      deadline: '5 dias úteis',
      shippingValueInCents: 1500,
      warrant: '90 dias',
      weight: 'até 10kg',
      maxVolume: 'até 0.5m³',
      dimensions: '50x40x30',
      commission: 10,
      valueInCents: 25000,
      description: 'Serviço de manutenção preventiva',
    };
  });

  afterEach(async() => {
    await prisma.serviceProduct.deleteMany();
    await prisma.service.deleteMany();
    await prisma.product.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('integration tests', () => {
    it('should create service and return id', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      expect(result).toEqual<CreateServiceOutputDto>({ id: expect.any(String) });
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should persist service in database with all fields', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService).toBeDefined();
      expect(savedService).toMatchObject({
        id: result.id,
        name: data.name,
        nickname: data.nickname,
        companyId: data.companyId,
        categoryId: data.categoryId,
        deadline: data.deadline,
        shippingValueInCents: data.shippingValueInCents,
        warrant: data.warrant,
        weight: data.weight,
        maxVolume: data.maxVolume,
        dimensions: data.dimensions,
        commission: data.commission,
        valueInCents: data.valueInCents,
        description: data.description,
        active: true,
      });
      expect(savedService?.createdAt).toBeInstanceOf(Date);
      expect(savedService?.updatedAt).toBeInstanceOf(Date);
    });

    it('should persist N-N relation with products in service_products table', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
        include: { products: true },
      });

      expect(savedService?.products).toHaveLength(2);
      expect(savedService?.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId: product01Id }),
          expect.objectContaining({ productId: product02Id }),
        ])
      );
    });

    it('should persist service with null optional fields', async() => {
      // Arrange
      const minimalData: CreateServiceInputDto = {
        ...data,
        nickname: null,
        deadline: null,
        shippingValueInCents: null,
        warrant: null,
        weight: null,
        maxVolume: null,
        dimensions: null,
        description: null,
      };

      // Act
      const result = await sut.execute(minimalData);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService).toBeDefined();
      expect(savedService?.nickname).toBeNull();
      expect(savedService?.deadline).toBeNull();
      expect(savedService?.shippingValueInCents).toBeNull();
      expect(savedService?.warrant).toBeNull();
      expect(savedService?.weight).toBeNull();
      expect(savedService?.maxVolume).toBeNull();
      expect(savedService?.dimensions).toBeNull();
      expect(savedService?.description).toBeNull();
    });

    it('should persist service with shippingValueInCents as 0', async() => {
      // Arrange
      const dataWithZeroShipping: CreateServiceInputDto = {
        ...data,
        shippingValueInCents: 0,
      };

      // Act
      const result = await sut.execute(dataWithZeroShipping);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.shippingValueInCents).toBe(0);
    });

    it('should persist service with valueInCents as 0', async() => {
      // Arrange
      const dataWithZeroValue: CreateServiceInputDto = {
        ...data,
        valueInCents: 0,
      };

      // Act
      const result = await sut.execute(dataWithZeroValue);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.valueInCents).toBe(0);
    });

    it('should persist service with commission between 0 and 100', async() => {
      // Arrange
      const testCases = [0, 25.5, 50, 75.75, 100];

      for (const commission of testCases) {
        const serviceData: CreateServiceInputDto = {
          ...data,
          name: `Service ${commission}`,
          commission,
        };

        // Act
        const result = await sut.execute(serviceData);

        // Assert
        const savedService = await prisma.service.findUnique({
          where: { id: result.id },
        });

        expect(savedService?.commission).toBe(commission);
      }
    });

    it('should throw CompanyNotFoundError if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyId: 'non-existent-company-id' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should throw ServiceCategoryNotFoundError if category does not exist', async() => {
      // Arrange
      const invalidData = { ...data, categoryId: 'non-existent-category-id' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ServiceCategoryNotFoundError);
      });
    });

    it('should throw ServiceCategoryNotActiveError if category is inactive', async() => {
      // Arrange
      await prisma.serviceCategory.update({
        where: { id: categoryId },
        data: { active: false },
      });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ServiceCategoryNotActiveError);
      });
    });

    it('should throw ProductNotFoundError if one product does not exist', async() => {
      // Arrange
      const invalidData = {
        ...data,
        productIds: [product01Id, 'non-existent-product-id'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should throw ProductNotFoundError if both products do not exist', async() => {
      // Arrange
      const invalidData = {
        ...data,
        productIds: ['non-existent-product-id-1', 'non-existent-product-id-2'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should verify all products exist before saving service', async() => {
      // Arrange
      const product03Id = (await createProduct.execute({
        companyId,
        type: 'MERCADORIA',
        group01: 'Geral',
        group02: 'Geral',
        description: 'Produto 03 - Será deletado',
        complement: null,
        manufacturerCode: 'MFG003',
        brand: 'Marca',
        measureUnit: 'UN',
        ncm: '00000000',
        economicBatch: 'BATCH003',
        minimumStock: 0,
        maximumStock: 100,
        warrantyDays: 0,
        weightInKg: 1,
        heightInCm: 10,
        lengthInCm: 10,
        widthInCm: 10,
        markup: 0,
        marginB: 0,
        currency: 'BRL',
        exchangeRate: 1,
        unitCostInCents: 1000,
        unitPriceInCents: 2000,
        ean: '7891234567892',
        additionalInfo: null,
        supplierIds: [],
        images: [],
      })).id;

      await prisma.product.delete({ where: { id: product03Id } });

      const invalidData = {
        ...data,
        productIds: [product01Id, product03Id],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should create service with different products from same company', async() => {
      // Arrange
      const product03Id = (await createProduct.execute({
        companyId,
        type: 'MERCADORIA',
        group01: 'Geral',
        group02: 'Geral',
        description: 'Produto 03',
        complement: null,
        manufacturerCode: 'MFG003',
        brand: 'Marca',
        measureUnit: 'UN',
        ncm: '00000000',
        economicBatch: 'BATCH003',
        minimumStock: 0,
        maximumStock: 100,
        warrantyDays: 0,
        weightInKg: 1,
        heightInCm: 10,
        lengthInCm: 10,
        widthInCm: 10,
        markup: 0,
        marginB: 0,
        currency: 'BRL',
        exchangeRate: 1,
        unitCostInCents: 1000,
        unitPriceInCents: 2000,
        ean: '7891234567892',
        additionalInfo: null,
        supplierIds: [],
        images: [],
      })).id;

      const dataWithDifferentProducts: CreateServiceInputDto = {
        ...data,
        productIds: [product01Id, product03Id],
      };

      // Act
      const result = await sut.execute(dataWithDifferentProducts);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
        include: { products: true },
      });

      expect(savedService?.products).toHaveLength(2);
      const productIds = savedService?.products.map(p => p.productId);
      expect(productIds).toContain(product01Id);
      expect(productIds).toContain(product03Id);
    });

    it('should persist service with very long text fields', async() => {
      // Arrange
      const longText = 'A'.repeat(1000);
      const dataWithLongTexts: CreateServiceInputDto = {
        ...data,
        deadline: longText,
        warrant: longText,
        weight: longText,
        maxVolume: longText,
        dimensions: longText,
        description: longText,
      };

      // Act
      const result = await sut.execute(dataWithLongTexts);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.deadline).toBe(longText);
      expect(savedService?.warrant).toBe(longText);
      expect(savedService?.weight).toBe(longText);
      expect(savedService?.maxVolume).toBe(longText);
      expect(savedService?.dimensions).toBe(longText);
      expect(savedService?.description).toBe(longText);
    });

    it('should persist service with special characters in text fields', async() => {
      // Arrange
      const dataWithSpecialChars: CreateServiceInputDto = {
        ...data,
        name: 'Manutenção & Instalação (Premium)',
        nickname: 'MIP™',
        deadline: '5 dias úteis + feriados',
        warrant: 'Garantia de 90 dias @cliente',
        weight: '< 10kg',
        maxVolume: '≤ 0.5m³',
        dimensions: '50x40x30 cm',
        description: 'Serviço com caracteres: !@#$%^&*()',
      };

      // Act
      const result = await sut.execute(dataWithSpecialChars);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService).toMatchObject({
        name: dataWithSpecialChars.name,
        nickname: dataWithSpecialChars.nickname,
        deadline: dataWithSpecialChars.deadline,
        warrant: dataWithSpecialChars.warrant,
        weight: dataWithSpecialChars.weight,
        maxVolume: dataWithSpecialChars.maxVolume,
        dimensions: dataWithSpecialChars.dimensions,
        description: dataWithSpecialChars.description,
      });
    });

    it('should create multiple services for same category', async() => {
      // Act
      const result1 = await sut.execute(data);
      const result2 = await sut.execute({ ...data, name: 'Outro Serviço' });

      // Assert
      const services = await prisma.service.findMany({
        where: { categoryId },
      });

      expect(services).toHaveLength(2);
      expect(services.map(s => s.id)).toContain(result1.id);
      expect(services.map(s => s.id)).toContain(result2.id);
    });

    it('should create multiple services for same company', async() => {
      // Act
      const result1 = await sut.execute(data);
      const result2 = await sut.execute({ ...data, name: 'Outro Serviço' });

      // Assert
      const services = await prisma.service.findMany({
        where: { companyId },
      });

      expect(services).toHaveLength(2);
      expect(services.map(s => s.id)).toContain(result1.id);
      expect(services.map(s => s.id)).toContain(result2.id);
    });

    it('should create service with same name in different categories', async() => {
      // Arrange
      const category2Id = (await createServiceCategory.execute({
        name: 'Instalação',
      })).id;

      const dataCategory2: CreateServiceInputDto = {
        ...data,
        categoryId: category2Id,
      };

      // Act
      const result1 = await sut.execute(data);
      const result2 = await sut.execute(dataCategory2);

      // Assert
      const service1 = await prisma.service.findUnique({ where: { id: result1.id } });
      const service2 = await prisma.service.findUnique({ where: { id: result2.id } });

      expect(service1?.name).toBe(service2?.name);
      expect(service1?.categoryId).not.toBe(service2?.categoryId);
    });

    it('should validate company before category', async() => {
      // Arrange
      const invalidData = {
        ...data,
        companyId: 'non-existent-company-id',
        categoryId: 'non-existent-category-id',
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should validate category before products', async() => {
      // Arrange
      const invalidData = {
        ...data,
        categoryId: 'non-existent-category-id',
        productIds: ['non-existent-product-1', 'non-existent-product-2'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ServiceCategoryNotFoundError);
      });
    });

    it('should create service with high commission value', async() => {
      // Arrange
      const dataWithHighCommission: CreateServiceInputDto = {
        ...data,
        commission: 100,
      };

      // Act
      const result = await sut.execute(dataWithHighCommission);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.commission).toBe(100);
    });

    it('should create service with zero commission', async() => {
      // Arrange
      const dataWithZeroCommission: CreateServiceInputDto = {
        ...data,
        commission: 0,
      };

      // Act
      const result = await sut.execute(dataWithZeroCommission);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.commission).toBe(0);
    });

    it('should create service with high valueInCents', async() => {
      // Arrange
      const dataWithHighValue: CreateServiceInputDto = {
        ...data,
        valueInCents: 999999999,
      };

      // Act
      const result = await sut.execute(dataWithHighValue);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.valueInCents).toBe(999999999);
    });

    it('should verify service is created with active=true by default', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
      });

      expect(savedService?.active).toBe(true);
    });

    it('should create service even if category becomes inactive after service creation', async() => {
      // Arrange & Act
      const result = await sut.execute(data);

      await prisma.serviceCategory.update({
        where: { id: categoryId },
        data: { active: false },
      });

      // Assert
      const savedService = await prisma.service.findUnique({
        where: { id: result.id },
        include: { category: true },
      });

      expect(savedService).toBeDefined();
      expect(savedService?.category.active).toBe(false);
    });

    it('should throw error when trying to create service with inactive category', async() => {
      // Arrange
      const inactiveCategoryId = (await createServiceCategory.execute({
        name: 'Categoria Inativa',
      })).id;

      await prisma.serviceCategory.update({
        where: { id: inactiveCategoryId },
        data: { active: false },
      });

      const invalidData = { ...data, categoryId: inactiveCategoryId };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(ServiceCategoryNotActiveError);
      });
    });
  });
});
