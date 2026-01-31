import { Test, TestingModule } from '@nestjs/testing';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductModule } from 'src/app/product/product.module';
import { CreateServiceCategory } from 'src/app/service-category/application/usecases/create-service-category/create-service-category.service';
import { ServiceCategoryNotActiveError } from 'src/app/service-category/domain/errors/service-category-not-active.error';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { ServiceModule } from 'src/app/service/service.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateService } from '../create-service/create-service.service';
import { EditService } from './edit-service.service';

describe('EditService', () => {
  let sut: EditService;
  let prisma: PrismaService;
  let createService: CreateService;
  let createProduct: CreateProduct;
  let createServiceCategory: CreateServiceCategory;
  let companyId: string;
  let categoryId: string;
  let product01Id: string;
  let product02Id: string;
  let serviceId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceModule,
        ServiceCategoryModule,
        ProductModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditService);
    prisma = module.get(PrismaService);
    createService = module.get(CreateService);
    createProduct = module.get(CreateProduct);
    createServiceCategory = module.get(CreateServiceCategory);

    await prisma.truncate();

    // Create company
    companyId = (await prisma.company.create({
      data: {
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
        active: true,
      },
    })).id;

    // Create category
    categoryId = (await createServiceCategory.execute({
      name: 'Manutenção',
    })).id;

    // Create products
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

    // Create a service for editing
    serviceId = (await createService.execute({
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
    })).id;
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('integration tests', () => {
    it('should return success message', async() => {
      // Arrange
      const data = {
        name: 'Manutenção Atualizada',
      };

      // Act
      const result = await sut.execute(serviceId, data);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Serviço atualizado com sucesso!',
      });
    });

    it('should update service name', async() => {
      // Arrange
      const data = {
        name: 'Manutenção Corretiva',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.name).toBe('Manutenção Corretiva');
    });

    it('should update multiple fields at once', async() => {
      // Arrange
      const data = {
        name: 'Novo Nome',
        nickname: 'Novo Apelido',
        commission: 15,
        valueInCents: 30000,
        description: 'Nova descrição',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService).toMatchObject({
        name: 'Novo Nome',
        nickname: 'Novo Apelido',
        commission: 15,
        valueInCents: 30000,
        description: 'Nova descrição',
      });
    });

    it('should update only provided fields, keeping others unchanged', async() => {
      // Arrange
      const data = {
        commission: 20,
      };

      const originalService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.commission).toBe(20);
      expect(updatedService?.name).toBe(originalService?.name);
      expect(updatedService?.nickname).toBe(originalService?.nickname);
      expect(updatedService?.valueInCents).toBe(originalService?.valueInCents);
    });

    it('should update optional fields to null', async() => {
      // Arrange
      const data = {
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
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.nickname).toBeNull();
      expect(updatedService?.deadline).toBeNull();
      expect(updatedService?.shippingValueInCents).toBeNull();
      expect(updatedService?.warrant).toBeNull();
      expect(updatedService?.weight).toBeNull();
      expect(updatedService?.maxVolume).toBeNull();
      expect(updatedService?.dimensions).toBeNull();
      expect(updatedService?.description).toBeNull();
    });

    it('should update null fields to values', async() => {
      // Arrange
      // First set fields to null
      await prisma.service.update({
        where: { id: serviceId },
        data: {
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          description: null,
        },
      });

      const data = {
        nickname: 'Novo Apelido',
        deadline: '7 dias',
        shippingValueInCents: 2000,
        description: 'Nova descrição',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService).toMatchObject({
        nickname: 'Novo Apelido',
        deadline: '7 dias',
        shippingValueInCents: 2000,
        description: 'Nova descrição',
      });
    });

    it('should update service category', async() => {
      // Arrange
      const newCategoryId = (await createServiceCategory.execute({
        name: 'Instalação',
      })).id;

      const data = {
        categoryId: newCategoryId,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.categoryId).toBe(newCategoryId);
    });

    it('should update service products', async() => {
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

      const data = {
        productIds: [product01Id, product03Id],
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { products: true },
      });

      expect(updatedService?.products).toHaveLength(2);
      const productIds = updatedService?.products.map(p => p.productId).sort();
      expect(productIds).toEqual([product01Id, product03Id].sort());
    });

    it('should update commission to 0', async() => {
      // Arrange
      const data = {
        commission: 0,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.commission).toBe(0);
    });

    it('should update commission to 100', async() => {
      // Arrange
      const data = {
        commission: 100,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.commission).toBe(100);
    });

    it('should update valueInCents to 0', async() => {
      // Arrange
      const data = {
        valueInCents: 0,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.valueInCents).toBe(0);
    });

    it('should update shippingValueInCents to 0', async() => {
      // Arrange
      const data = {
        shippingValueInCents: 0,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.shippingValueInCents).toBe(0);
    });

    it('should update decimal commission', async() => {
      // Arrange
      const data = {
        commission: 12.75,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.commission).toBe(12.75);
    });

    it('should update service with special characters', async() => {
      // Arrange
      const data = {
        name: 'Manutenção & Instalação (Premium)™',
        description: 'Serviço com @#$%^&*()',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.name).toBe('Manutenção & Instalação (Premium)™');
      expect(updatedService?.description).toBe('Serviço com @#$%^&*()');
    });

    it('should update service with long text fields', async() => {
      // Arrange
      const longText = 'B'.repeat(1000);
      const data = {
        description: longText,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.description).toBe(longText);
    });

    it('should update updatedAt timestamp', async() => {
      // Arrange
      const originalService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const data = {
        name: 'Nome Atualizado',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.updatedAt.getTime()).toBeGreaterThan(originalService!.updatedAt.getTime());
    });

    it('should not update createdAt timestamp', async() => {
      // Arrange
      const originalService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      const data = {
        name: 'Nome Atualizado',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.createdAt.getTime()).toBe(originalService!.createdAt.getTime());
    });

    it('should not change service id', async() => {
      // Arrange
      const data = {
        name: 'Nome Atualizado',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.id).toBe(serviceId);
    });

    it('should not change companyId', async() => {
      // Arrange
      const originalService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      const data = {
        name: 'Nome Atualizado',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.companyId).toBe(originalService?.companyId);
    });

    it('should not change active status when updating other fields', async() => {
      // Arrange
      const data = {
        name: 'Nome Atualizado',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.active).toBe(true);
    });

    it('should throw ServiceNotFoundError if service does not exist', async() => {
      // Arrange
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        name: 'Novo Nome',
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(nonExistentId, data).catch((error) => {
        expect(error).toBeInstanceOf(ServiceNotFoundError);
      });
    });

    it('should throw ServiceCategoryNotActiveError if new category is inactive', async() => {
      // Arrange
      const inactiveCategoryId = (await createServiceCategory.execute({
        name: 'Categoria Inativa',
      })).id;

      await prisma.serviceCategory.update({
        where: { id: inactiveCategoryId },
        data: { active: false },
      });

      const data = {
        categoryId: inactiveCategoryId,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(serviceId, data).catch((error) => {
        expect(error).toBeInstanceOf(ServiceCategoryNotActiveError);
      });
    });

    it('should throw ProductNotFoundError if one of new products does not exist', async() => {
      // Arrange
      const data = {
        productIds: [product01Id, 'non-existent-product-id'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(serviceId, data).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should throw ProductNotFoundError if both new products do not exist', async() => {
      // Arrange
      const data = {
        productIds: ['non-existent-product-id-1', 'non-existent-product-id-2'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(serviceId, data).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should not validate products if productIds is not provided', async() => {
      // Arrange
      const data = {
        name: 'Nome Atualizado',
        commission: 15,
      };

      // Act
      const result = await sut.execute(serviceId, data);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Serviço atualizado com sucesso!',
      });
    });

    it('should update all editable fields at once', async() => {
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

      const newCategoryId = (await createServiceCategory.execute({
        name: 'Instalação',
      })).id;

      const data = {
        name: 'Novo Nome Completo',
        nickname: 'Novo Apelido',
        categoryId: newCategoryId,
        productIds: [product02Id, product03Id],
        deadline: '15 dias',
        shippingValueInCents: 3000,
        warrant: '365 dias',
        weight: '20kg',
        maxVolume: '2.0m³',
        dimensions: '100x100x100',
        commission: 25.5,
        valueInCents: 100000,
        description: 'Nova descrição completa',
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { products: true },
      });

      expect(updatedService).toMatchObject({
        id: serviceId,
        name: 'Novo Nome Completo',
        nickname: 'Novo Apelido',
        categoryId: newCategoryId,
        deadline: '15 dias',
        shippingValueInCents: 3000,
        warrant: '365 dias',
        weight: '20kg',
        maxVolume: '2.0m³',
        dimensions: '100x100x100',
        commission: 25.5,
        valueInCents: 100000,
        description: 'Nova descrição completa',
      });

      expect(updatedService?.products).toHaveLength(2);
      const productIds = updatedService?.products.map(p => p.productId).sort();
      expect(productIds).toEqual([product02Id, product03Id].sort());
    });

    it('should allow multiple updates on same service', async() => {
      // Arrange
      const data1 = {
        name: 'Nome 1',
      };

      const data2 = {
        commission: 20,
      };

      const data3 = {
        valueInCents: 50000,
      };

      // Act
      await sut.execute(serviceId, data1);
      await sut.execute(serviceId, data2);
      await sut.execute(serviceId, data3);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(updatedService?.name).toBe('Nome 1');
      expect(updatedService?.commission).toBe(20);
      expect(updatedService?.valueInCents).toBe(50000);
    });

    it('should not affect other services when updating one', async() => {
      // Arrange
      const service2Id = (await createService.execute({
        name: 'Outro Serviço',
        nickname: null,
        companyId,
        categoryId,
        productIds: [product01Id, product02Id],
        deadline: null,
        shippingValueInCents: null,
        warrant: null,
        weight: null,
        maxVolume: null,
        dimensions: null,
        commission: 5,
        valueInCents: 10000,
        description: null,
      })).id;

      const data = {
        name: 'Serviço 1 Atualizado',
        commission: 30,
      };

      // Act
      await sut.execute(serviceId, data);

      // Assert
      const service1 = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      const service2 = await prisma.service.findUnique({
        where: { id: service2Id },
      });

      expect(service1?.name).toBe('Serviço 1 Atualizado');
      expect(service1?.commission).toBe(30);
      expect(service2?.name).toBe('Outro Serviço');
      expect(service2?.commission).toBe(5);
    });

    it('should update with empty object (no changes)', async() => {
      // Arrange
      const originalService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      const data = {};

      // Act
      const result = await sut.execute(serviceId, data);

      // Assert
      const updatedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(result).toEqual<SuccessMessage>({
        message: 'Serviço atualizado com sucesso!',
      });

      expect(updatedService?.name).toBe(originalService?.name);
      expect(updatedService?.commission).toBe(originalService?.commission);
      expect(updatedService?.valueInCents).toBe(originalService?.valueInCents);
    });
  });
});
