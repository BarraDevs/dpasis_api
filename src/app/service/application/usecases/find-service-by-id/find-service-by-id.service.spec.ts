import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { ServiceModule } from 'src/app/service/service.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDto } from '../../dtos/service.dto';
import { FindServiceById } from './find-service-by-id.service';

describe('FindServiceById', () => {
  let sut: FindServiceById;
  let prisma: PrismaService;
  let seq = 1;

  const createCompany = (overrides: Partial<Prisma.CompanyCreateInput> = {}) => prisma.company.create({
    data: {
      name: `Company Test ${seq}`,
      fantasyName: `Company Fantasy ${seq}`,
      document: `112223330001${String(seq).padStart(2, '0')}`,
      ie: 'ie teste',
      zipCode: '12345678',
      street: 'Rua Teste',
      number: '100',
      neighborhood: 'Centro',
      city: 'Cidade',
      state: 'SP',
      phone01: '11999999999',
      email01: `company${seq}@test.com`,
      active: true,
      ...overrides,
    },
  });

  const createServiceCategory = (overrides: Partial<Prisma.ServiceCategoryCreateInput> = {}) => prisma.serviceCategory.create({
    data: {
      name: `Categoria ${seq}`,
      active: true,
      ...overrides,
    },
  });

  const createProduct = (companyId: string, overrides: Partial<Prisma.ProductUncheckedCreateInput> = {}) => prisma.product.create({
    data: {
      companyId,
      type: 'Eletrônico',
      group01: 'Informática',
      group02: 'Computadores',
      description: `Notebook ${seq}`,
      complement: 'Core i7 16GB',
      manufacturerCode: `DELL-${seq}`,
      brand: 'Dell',
      measureUnit: 'UN',
      ncm: '84713012',
      economicBatch: `BATCH${seq}`,
      minimumStock: 0,
      maximumStock: 0,
      warrantyDays: 0,
      weightInKg: 2.5,
      heightInCm: 3.0,
      lengthInCm: 35.0,
      widthInCm: 25.0,
      markup: 0,
      marginB: 0,
      currency: 'BRL',
      exchangeRate: 1.0,
      unitCostInCents: 0,
      unitPriceInCents: 0,
      ean: `78912345678${String(seq).padStart(2, '0')}`,
      additionalInfo: null,
      images: [],
      currentStock: 0,
      ...overrides,
    },
  });

  const createService = (data: {
    companyId: string;
    categoryId: string;
    productIds: string[];
    overrides?: Partial<Prisma.ServiceCreateInput>;
  }) => prisma.service.create({
    data: {
      name: 'Manutenção Preventiva',
      nickname: 'Manutenção',
      deadline: '5 dias úteis',
      shippingValueInCents: 1500,
      warrant: '90 dias',
      weight: 'até 10kg',
      maxVolume: 'até 0.5m³',
      dimensions: '50x40x30',
      commission: 10,
      valueInCents: 25000,
      active: true,
      description: 'Serviço de manutenção preventiva',
      company: {
        connect: {
          id: data.companyId,
        },
      },
      category: {
        connect: {
          id: data.categoryId,
        },
      },
      products: {
        create: data.productIds.map((productId) => ({ productId })),
      },
      ...data.overrides,
    },
  });

  beforeEach(async() => {
    seq += 1;
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindServiceById);
    prisma = module.get(PrismaService);

    await prisma.serviceProduct.deleteMany();
    await prisma.service.deleteMany();
    await prisma.product.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.company.deleteMany();
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

  describe('unit tests', () => {
    it('should call serviceDao.findById with correct parameters', async() => {
      // Arrange
      const service = createMock<ServiceDto>();
      const findByIdSpy = jest.spyOn(sut['serviceDao'], 'findById').mockResolvedValue(service);
      const id = 'existing-service-id';

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
    });

    it('should throw ServiceNotFoundError if serviceDao returns null', async() => {
      // Arrange
      jest.spyOn(sut['serviceDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute('non-existing-id')).rejects.toThrow(ServiceNotFoundError);
    });

    it('should return the service if found', async() => {
      // Arrange
      const mockService = createMock<ServiceDto>({
        id: 'service-id',
        name: 'Service Test',
      });
      jest.spyOn(sut['serviceDao'], 'findById').mockResolvedValue(mockService);

      // Act
      const result = await sut.execute('service-id');

      // Assert
      expect(result).toEqual(mockService);
    });

    it('should propagate any error from dao', async() => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.spyOn(sut['serviceDao'], 'findById').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute('some-id')).rejects.toThrow('Database connection failed');
    });
  });

  describe('integration tests', () => {
    it('should throw ServiceNotFoundError if service is not found', async() => {
      // Act & Assert
      await expect(sut.execute('non-existing-id')).rejects.toThrow(ServiceNotFoundError);
    });

    it('should return the service with productIds', async() => {
      // Arrange
      const company = await createCompany();
      const category = await createServiceCategory();
      const product01 = await createProduct(company.id);
      const product02 = await createProduct(company.id, {
        ean: `78912345678${String(seq + 1).padStart(2, '0')}`,
        manufacturerCode: `DELL-${seq + 1}`,
      });
      const service = await createService({
        companyId: company.id,
        categoryId: category.id,
        productIds: [product01.id, product02.id],
      });

      // Act
      const result = await sut.execute(service.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<ServiceDto>({
        id: service.id,
        name: service.name,
        nickname: service.nickname,
        companyId: service.companyId,
        category: {
          id: category.id,
          name: category.name,
        },
        products: expect.arrayContaining([
          {
            id: product01.id,
            description: product01.description,
          },
          {
            id: product02.id,
            description: product02.description,
          },
        ]),
        deadline: service.deadline,
        shippingValueInCents: service.shippingValueInCents,
        warrant: service.warrant,
        weight: service.weight,
        maxVolume: service.maxVolume,
        dimensions: service.dimensions,
        commission: service.commission,
        valueInCents: service.valueInCents,
        active: service.active,
        description: service.description,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
