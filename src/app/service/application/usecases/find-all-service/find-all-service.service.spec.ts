import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceModule } from 'src/app/service/service.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceDto } from '../../dtos/service.dto';
import { FindAllServiceQueryDto } from './dtos/find-all-service.dto';
import { FindAllService } from './find-all-service.service';

describe('FindAllService', () => {
  let sut: FindAllService;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllService);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call serviceDao.findAll with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllServiceQueryDto>({ page: 2, size: 5, name: 'Manutenção' });
      const findAllSpy = jest.spyOn(sut['serviceDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return paginated result from dao', async() => {
      // Arrange
      const queries = createMock<FindAllServiceQueryDto>({ page: 1, size: 10 });
      const mockServices = [
        createMock<ServiceDto>({ name: 'Service 1' }),
        createMock<ServiceDto>({ name: 'Service 2' }),
      ];
      jest.spyOn(sut['serviceDao'], 'findAll').mockResolvedValue([mockServices, 2]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
    });

    it('should handle empty results', async() => {
      // Arrange
      const queries = createMock<FindAllServiceQueryDto>({ page: 1, size: 10 });
      jest.spyOn(sut['serviceDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should calculate pagination correctly', async() => {
      // Arrange
      const queries = createMock<FindAllServiceQueryDto>({ page: 2, size: 10 });
      const mockServices = Array(10).fill(null).map((_, i) => createMock<ServiceDto>({ name: `Service ${i}` }));
      jest.spyOn(sut['serviceDao'], 'findAll').mockResolvedValue([mockServices, 25]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(10);
      expect(result.totalItems).toBe(25);
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should work without page and size', async() => {
      // Arrange
      const queries = createMock<FindAllServiceQueryDto>({ page: undefined, size: undefined });
      const mockServices = [createMock<ServiceDto>()];
      jest.spyOn(sut['serviceDao'], 'findAll').mockResolvedValue([mockServices, 1]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('integration tests', () => {
    let companyId: string;
    let categoryId: string;
    let product01Id: string;
    let product02Id: string;

    beforeEach(async() => {
      // Create test data
      const company = await prisma.company.create({
        data: {
          name: 'Company Test',
          fantasyName: 'Company Test Fantasy',
          document: '11222333000181',
          ie: 'ie teste',
          zipCode: '12345678',
          street: 'Rua Teste',
          number: '100',
          neighborhood: 'Centro',
          city: 'Cidade',
          state: 'SP',
          phone01: '1133334444',
          email01: 'company@test.com',
          active: true,
        },
      });
      companyId = company.id;

      const category = await prisma.serviceCategory.create({
        data: {
          name: 'Manutenção',
          active: true,
        },
      });
      categoryId = category.id;

      const product01 = await prisma.product.create({
        data: {
          id: 'product-01',
          companyId,
          type: 'MERCADORIA',
          group01: 'Geral',
          group02: 'Geral',
          description: 'Produto 01',
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
          images: [],
          currentStock: 10,
        },
      });
      product01Id = product01.id;

      const product02 = await prisma.product.create({
        data: {
          id: 'product-02',
          companyId,
          type: 'MERCADORIA',
          group01: 'Geral',
          group02: 'Geral',
          description: 'Produto 02',
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
          images: [],
          currentStock: 10,
        },
      });
      product02Id = product02.id;
    });

    afterEach(async() => {
    });

    describe('empty database scenarios', () => {
      it('should return an empty pagination object when no services exist', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        expect(result).toEqual<IPagination<ServiceDto>>({
          data: [],
          currentPage: 1,
          itemsPerPage: 0,
          totalItems: 0,
          totalPages: 0,
        });
      });

      it('should return empty result with pagination parameters', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 10 });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalItems).toBe(0);
        expect(result.currentPage).toBe(1);
      });

      it('should return empty result with search parameter', async() => {
        // Act
        const result = await sut.execute({ search: 'nonexistent' });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalItems).toBe(0);
      });

      it('should return empty result with filters', async() => {
        // Act
        const result = await sut.execute({ companyId, active: true });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalItems).toBe(0);
      });
    });

    describe('basic retrieval scenarios', () => {
      beforeEach(async() => {
        // Create test services
        await prisma.service.create({
          data: {
            name: 'Manutenção Preventiva',
            nickname: 'Preventiva',
            companyId,
            categoryId,
            deadline: '5 dias',
            shippingValueInCents: 1500,
            warrant: '90 dias',
            weight: '10kg',
            maxVolume: '0.5m³',
            dimensions: '50x40x30',
            commission: 10,
            valueInCents: 25000,
            description: 'Serviço de manutenção',
            active: true,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });

        await prisma.service.create({
          data: {
            name: 'Instalação',
            nickname: null,
            companyId,
            categoryId,
            deadline: null,
            shippingValueInCents: null,
            warrant: null,
            weight: null,
            maxVolume: null,
            dimensions: null,
            commission: 15,
            valueInCents: 30000,
            description: null,
            active: true,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });

        await prisma.service.create({
          data: {
            name: 'Consultoria',
            nickname: null,
            companyId,
            categoryId,
            deadline: null,
            shippingValueInCents: null,
            warrant: null,
            weight: null,
            maxVolume: null,
            dimensions: null,
            commission: 20,
            valueInCents: 50000,
            description: null,
            active: false,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });
      });

      it('should return all services when no filters are applied', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(3);
        expect(result.data).toHaveLength(3);
      });

      it('should return single service', async() => {
        // Arrange
        await prisma.service.deleteMany({});

        await prisma.service.create({
          data: {
            name: 'Único Serviço',
            nickname: null,
            companyId,
            categoryId,
            deadline: null,
            shippingValueInCents: null,
            warrant: null,
            weight: null,
            maxVolume: null,
            dimensions: null,
            commission: 10,
            valueInCents: 10000,
            description: null,
            active: true,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });

        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Único Serviço');
      });

      it('should include all service fields', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        const service = result.data[0];
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('nickname');
        expect(service).toHaveProperty('companyId');
        expect(service).toHaveProperty('category');
        expect(service).toHaveProperty('products');
        expect(service).toHaveProperty('deadline');
        expect(service).toHaveProperty('shippingValueInCents');
        expect(service).toHaveProperty('warrant');
        expect(service).toHaveProperty('weight');
        expect(service).toHaveProperty('maxVolume');
        expect(service).toHaveProperty('dimensions');
        expect(service).toHaveProperty('commission');
        expect(service).toHaveProperty('valueInCents');
        expect(service).toHaveProperty('active');
        expect(service).toHaveProperty('description');
        expect(service).toHaveProperty('createdAt');
        expect(service).toHaveProperty('updatedAt');
      });
    });

    describe('pagination scenarios', () => {
      beforeEach(async() => {
        // Create 15 services
        for (let i = 1; i <= 15; i++) {
          await prisma.service.create({
            data: {
              name: `Serviço ${i}`,
              nickname: null,
              companyId,
              categoryId,
              deadline: null,
              shippingValueInCents: null,
              warrant: null,
              weight: null,
              maxVolume: null,
              dimensions: null,
              commission: 10,
              valueInCents: 10000 * i,
              description: null,
              active: true,
              products: {
                create: [
                  { productId: product01Id },
                  { productId: product02Id },
                ],
              },
            },
          });
        }
      });

      it('should return first page with default size', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 10 });

        // Assert
        expect(result.totalItems).toBe(15);
        expect(result.data).toHaveLength(10);
        expect(result.currentPage).toBe(1);
        expect(result.itemsPerPage).toBe(10);
        expect(result.totalPages).toBe(2);
      });

      it('should return second page', async() => {
        // Act
        const result = await sut.execute({ page: 2, size: 10 });

        // Assert
        expect(result.totalItems).toBe(15);
        expect(result.data).toHaveLength(5);
        expect(result.currentPage).toBe(2);
        expect(result.totalPages).toBe(2);
      });

      it('should return custom page size', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 5 });

        // Assert
        expect(result.data).toHaveLength(5);
        expect(result.totalPages).toBe(3);
      });

      it('should handle page beyond total pages', async() => {
        // Act
        const result = await sut.execute({ page: 100, size: 10 });

        // Assert
        expect(result.totalItems).toBe(15);
        expect(result.data).toHaveLength(0);
      });
    });

    describe('filter scenarios', () => {
      beforeEach(async() => {
        const company2 = await prisma.company.create({
          data: {
            name: 'Company Test 2',
            fantasyName: 'Company Test 2 Fantasy',
            document: '22333444000105',
            ie: 'ie teste 2',
            zipCode: '87654321',
            street: 'Rua Teste 2',
            number: '200',
            neighborhood: 'Centro 2',
            city: 'Cidade 2',
            state: 'RJ',
            phone01: '2133334444',
            email01: 'company2@test.com',
            active: true,
          },
        });

        const category2 = await prisma.serviceCategory.create({
          data: {
            name: 'Instalação',
            active: true,
          },
        });

        // Service 1: company1, category1, active
        await prisma.service.create({
          data: {
            name: 'Manutenção Preventiva',
            nickname: 'Preventiva',
            companyId,
            categoryId,
            deadline: '5 dias',
            shippingValueInCents: 1500,
            warrant: '90 dias',
            weight: '10kg',
            maxVolume: '0.5m³',
            dimensions: '50x40x30',
            commission: 10,
            valueInCents: 25000,
            description: 'Manutenção completa',
            active: true,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });

        // Service 2: company2, category1, active
        await prisma.service.create({
          data: {
            name: 'Consultoria',
            nickname: null,
            companyId: company2.id,
            categoryId,
            deadline: null,
            shippingValueInCents: null,
            warrant: null,
            weight: null,
            maxVolume: null,
            dimensions: null,
            commission: 20,
            valueInCents: 50000,
            description: null,
            active: true,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });

        // Service 3: company1, category2, inactive
        await prisma.service.create({
          data: {
            name: 'Instalação Elétrica',
            nickname: null,
            companyId,
            categoryId: category2.id,
            deadline: null,
            shippingValueInCents: null,
            warrant: null,
            weight: null,
            maxVolume: null,
            dimensions: null,
            commission: 15,
            valueInCents: 30000,
            description: null,
            active: false,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });
      });

      it('should filter by companyId', async() => {
        // Act
        const result = await sut.execute({ companyId });

        // Assert
        expect(result.totalItems).toBe(2);
        result.data.forEach(service => {
          expect(service.companyId).toBe(companyId);
        });
      });

      it('should filter by categoryId', async() => {
        // Act
        const result = await sut.execute({ categoryId });

        // Assert
        expect(result.totalItems).toBe(2);
        result.data.forEach(service => {
          expect(service.category.id).toBe(categoryId);
        });
      });

      it('should filter by active=true', async() => {
        // Act
        const result = await sut.execute({ active: true });

        // Assert
        expect(result.totalItems).toBe(2);
        result.data.forEach(service => {
          expect(service.active).toBe(true);
        });
      });

      it('should filter by active=false', async() => {
        // Act
        const result = await sut.execute({ active: false });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].active).toBe(false);
      });

      it('should filter by name', async() => {
        // Act
        const result = await sut.execute({ name: 'Manutenção' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toBe('Manutenção Preventiva');
      });

      it('should filter by productId', async() => {
        // Act
        const result = await sut.execute({ productId: product01Id });

        // Assert
        expect(result.totalItems).toBe(3);
        result.data.forEach(service => {
          const hasProduct = service.products.some(p => p.id === product01Id);
          expect(hasProduct).toBe(true);
        });
      });

      it('should filter by search', async() => {
        // Act
        const result = await sut.execute({ search: 'completa' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].description).toContain('completa');
      });

      it('should combine multiple filters', async() => {
        // Act
        const result = await sut.execute({
          companyId,
          active: true,
        });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].companyId).toBe(companyId);
        expect(result.data[0].active).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle queries without optional parameters', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.totalItems).toBeDefined();
      });

      it('should return consistent results on multiple calls', async() => {
        // Arrange
        await prisma.service.create({
          data: {
            name: 'Test Service',
            nickname: null,
            companyId,
            categoryId,
            deadline: null,
            shippingValueInCents: null,
            warrant: null,
            weight: null,
            maxVolume: null,
            dimensions: null,
            commission: 10,
            valueInCents: 10000,
            description: null,
            active: true,
            products: {
              create: [
                { productId: product01Id },
                { productId: product02Id },
              ],
            },
          },
        });

        // Act
        const result1 = await sut.execute({});
        const result2 = await sut.execute({});

        // Assert
        expect(result1.totalItems).toBe(result2.totalItems);
        expect(result1.data).toHaveLength(result2.data.length);
      });
    });
  });
});
