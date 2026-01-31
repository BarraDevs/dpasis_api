import { Test, TestingModule } from '@nestjs/testing';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { ProductModule } from 'src/app/product/product.module';
import { CreateServiceCategory } from 'src/app/service-category/application/usecases/create-service-category/create-service-category.service';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { Service } from 'src/app/service/domain/entities/service.entity';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { ServiceModule } from 'src/app/service/service.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateService } from '../create-service/create-service.service';
import { UpdateServiceStatus } from './update-service-status.service';

describe('UpdateServiceStatus', () => {
  let sut: UpdateServiceStatus;
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

    sut = module.get(UpdateServiceStatus);
    prisma = module.get(PrismaService);
    createService = module.get(CreateService);
    createProduct = module.get(CreateProduct);
    createServiceCategory = module.get(CreateServiceCategory);

    await prisma.truncate();

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

  describe('unit tests', () => {
    it('should throw ServiceNotFoundError if service does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const findByIdSpy = jest.spyOn(sut['serviceRepository'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['serviceRepository'], 'edit');

      // Act & Assert
      expect.assertions(3);
      return sut.execute(id).catch((error) => {
        expect(error).toBeInstanceOf(ServiceNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith(id);
        expect(editSpy).not.toHaveBeenCalled();
      });
    });

    it('should call serviceRepository.findById and serviceRepository.edit with correct values', async() => {
      // Arrange
      const id = 'service-id-123';
      const serviceEntity = Service.load({
        id,
        name: 'Serviço Teste',
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
        commission: 10,
        valueInCents: 25000,
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['serviceRepository'], 'findById').mockResolvedValue(serviceEntity);
      const editSpy = jest.spyOn(sut['serviceRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id,
          active: false,
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
    });

    it('should toggle status from active to inactive', async() => {
      // Arrange
      const id = 'service-id-123';
      const serviceEntity = Service.load({
        id,
        name: 'Serviço Ativo',
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
        commission: 10,
        valueInCents: 25000,
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['serviceRepository'], 'findById').mockResolvedValue(serviceEntity);
      const editSpy = jest.spyOn(sut['serviceRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: false,
        }),
      }));
    });

    it('should toggle status from inactive to active', async() => {
      // Arrange
      const id = 'service-id-123';
      const serviceEntity = Service.load({
        id,
        name: 'Serviço Inativo',
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
        commission: 10,
        valueInCents: 25000,
        description: null,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['serviceRepository'], 'findById').mockResolvedValue(serviceEntity);
      const editSpy = jest.spyOn(sut['serviceRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: true,
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw ServiceNotFoundError if service does not exist', async() => {
      // Arrange
      const id = 'non-existing-service-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(ServiceNotFoundError);
    });

    it('should toggle service status from active to inactive', async() => {
      // Arrange
      const serviceBefore = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(serviceBefore?.active).toBe(true);

      // Act
      const result = await sut.execute(serviceId);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
      const serviceAfter = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(serviceAfter?.active).toBe(false);
    });

    it('should toggle service status from inactive to active', async() => {
      // Arrange
      await sut.execute(serviceId); // active -> inactive
      const inactiveService = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(inactiveService?.active).toBe(false);

      // Act
      const result = await sut.execute(serviceId); // inactive -> active

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
      const activeService = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(activeService?.active).toBe(true);
    });

    it('should update updatedAt timestamp when toggling status', async() => {
      // Arrange
      const before = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(before).not.toBeNull();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await sut.execute(serviceId);

      // Assert
      const after = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(after?.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
    });

    it('should not change createdAt timestamp when toggling status', async() => {
      // Arrange
      const before = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(before).not.toBeNull();

      // Act
      await sut.execute(serviceId);

      // Assert
      const after = await prisma.service.findUnique({ where: { id: serviceId } });
      expect(after?.createdAt.getTime()).toBe(before!.createdAt.getTime());
    });

    it('should preserve service products when toggling status', async() => {
      // Arrange
      const beforeProducts = await prisma.serviceProduct.findMany({
        where: { serviceId },
        orderBy: { productId: 'asc' },
      });
      expect(beforeProducts).toHaveLength(2);

      // Act
      await sut.execute(serviceId);

      // Assert
      const afterProducts = await prisma.serviceProduct.findMany({
        where: { serviceId },
        orderBy: { productId: 'asc' },
      });
      expect(afterProducts).toHaveLength(2);
      expect(afterProducts.map(p => p.productId)).toEqual(beforeProducts.map(p => p.productId));
    });
  });
});
