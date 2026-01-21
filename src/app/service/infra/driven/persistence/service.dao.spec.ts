import { Test } from '@nestjs/testing';
import { Company, Product, ServiceCategory } from '@prisma/client';
import { ServicePersistenceModule } from 'src/app/service/application/persistence/service-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDaoAdapterPrisma } from './service.dao';

describe('ServiceDaoAdapterPrisma', () => {
  let sut: ServiceDaoAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;
  let serviceCategory: ServiceCategory;
  let product01: Product;
  let product02: Product;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ServicePersistenceModule,
        ConfigModule,
      ],
      providers: [
        ServiceDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ServiceDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.serviceProduct.deleteMany();
    await prisma.service.deleteMany();
    await prisma.product.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.company.deleteMany();

    company = await prisma.company.create({
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

    serviceCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Manutenção',
        active: true,
      },
    });

    product01 = await prisma.product.create({
      data: {
        id: 'product-01',
        companyId: company.id,
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

    product02 = await prisma.product.create({
      data: {
        id: 'product-02',
        companyId: company.id,
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

  describe('findAll', () => {
    let company2: Company;
    let category2: ServiceCategory;
    let product03: Product;
    let product04: Product;

    beforeEach(async() => {
      // Create additional test data
      company2 = await prisma.company.create({
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

      category2 = await prisma.serviceCategory.create({
        data: {
          name: 'Instalação',
          active: true,
        },
      });

      product03 = await prisma.product.create({
        data: {
          id: 'product-03',
          companyId: company.id,
          type: 'MERCADORIA',
          group01: 'Geral',
          group02: 'Geral',
          description: 'Produto 03',
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
          images: [],
          currentStock: 10,
        },
      });

      product04 = await prisma.product.create({
        data: {
          id: 'product-04',
          companyId: company.id,
          type: 'MERCADORIA',
          group01: 'Geral',
          group02: 'Geral',
          description: 'Produto 04',
          manufacturerCode: 'MFG004',
          brand: 'Marca',
          measureUnit: 'UN',
          ncm: '00000000',
          economicBatch: 'BATCH004',
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
          ean: '7891234567893',
          additionalInfo: null,
          images: [],
          currentStock: 10,
        },
      });

      // Create test services
      await prisma.service.create({
        data: {
          name: 'Manutenção Preventiva',
          nickname: 'Preventiva',
          companyId: company.id,
          categoryId: serviceCategory.id,
          deadline: '5 dias',
          shippingValueInCents: 1500,
          warrant: '90 dias',
          weight: '10kg',
          maxVolume: '0.5m³',
          dimensions: '50x40x30',
          commission: 10,
          valueInCents: 25000,
          description: 'Serviço de manutenção preventiva',
          active: true,
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      await prisma.service.create({
        data: {
          name: 'Manutenção Corretiva',
          nickname: 'Corretiva',
          companyId: company.id,
          categoryId: serviceCategory.id,
          deadline: '3 dias',
          shippingValueInCents: 2000,
          warrant: '60 dias',
          weight: '15kg',
          maxVolume: '1m³',
          dimensions: '100x80x60',
          commission: 15,
          valueInCents: 35000,
          description: 'Serviço de manutenção corretiva urgente',
          active: true,
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      await prisma.service.create({
        data: {
          name: 'Instalação Elétrica',
          nickname: null,
          companyId: company.id,
          categoryId: category2.id,
          deadline: '7 dias',
          shippingValueInCents: null,
          warrant: '180 dias',
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 20,
          valueInCents: 50000,
          description: null,
          active: true,
          products: {
            create: [
              { productId: product03.id },
              { productId: product04.id },
            ],
          },
        },
      });

      await prisma.service.create({
        data: {
          name: 'Consultoria Técnica',
          nickname: null,
          companyId: company2.id,
          categoryId: serviceCategory.id,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 25,
          valueInCents: 100000,
          description: 'Consultoria especializada',
          active: true,
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      await prisma.service.create({
        data: {
          name: 'Serviço Inativo',
          nickname: null,
          companyId: company.id,
          categoryId: serviceCategory.id,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 0,
          valueInCents: 0,
          description: null,
          active: false,
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });
    });

    it('should return all services without filters', async() => {
      // Act
      const [services, total] = await sut.findAll({});

      // Assert
      expect(total).toBe(5);
      expect(services).toHaveLength(5);
    });

    it('should order results by createdAt desc', async() => {
      // Act
      const [services] = await sut.findAll({});

      // Assert
      expect(services[0].createdAt.getTime()).toBeGreaterThanOrEqual(services[1].createdAt.getTime());
      expect(services[1].createdAt.getTime()).toBeGreaterThanOrEqual(services[2].createdAt.getTime());
    });

    it('should return services with pagination', async() => {
      // Act
      const [services, total] = await sut.findAll({ page: 1, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(services).toHaveLength(2);
    });

    it('should return second page correctly', async() => {
      // Act
      const [services, total] = await sut.findAll({ page: 2, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(services).toHaveLength(2);
    });

    describe('filter by companyId', () => {
      it('should filter by companyId', async() => {
        // Act
        const [services, total] = await sut.findAll({ companyId: company.id });

        // Assert
        expect(total).toBe(4);
        expect(services).toHaveLength(4);
        services.forEach((service) => {
          expect(service.companyId).toBe(company.id);
        });
      });

      it('should filter by companyId (case insensitive)', async() => {
        // Act
        const [services, total] = await sut.findAll({ companyId: company.id.toUpperCase() });

        // Assert
        expect(total).toBe(4);
        expect(services).toHaveLength(4);
      });

      it('should return empty if companyId has no services', async() => {
        // Arrange
        const company3 = await prisma.company.create({
          data: {
            name: 'Company Test 3',
            fantasyName: 'Company Test 3 Fantasy',
            document: '33444555000172',
            ie: 'ie teste 3',
            zipCode: '11111111',
            street: 'Rua Teste 3',
            number: '300',
            neighborhood: 'Centro 3',
            city: 'Cidade 3',
            state: 'MG',
            phone01: '3133334444',
            email01: 'company3@test.com',
            active: true,
          },
        });

        // Act
        const [services, total] = await sut.findAll({ companyId: company3.id });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
      });
    });

    describe('filter by categoryId', () => {
      it('should filter by categoryId', async() => {
        // Act
        const [services, total] = await sut.findAll({ categoryId: serviceCategory.id });

        // Assert
        expect(total).toBe(4);
        expect(services).toHaveLength(4);
        services.forEach((service) => {
          expect(service.category.id).toBe(serviceCategory.id);
        });
      });

      it('should filter by categoryId (case insensitive)', async() => {
        // Act
        const [services, total] = await sut.findAll({ categoryId: serviceCategory.id.toUpperCase() });

        // Assert
        expect(total).toBe(4);
        expect(services).toHaveLength(4);
      });

      it('should return empty if categoryId has no services', async() => {
        // Arrange
        const category3 = await prisma.serviceCategory.create({
          data: {
            name: 'Categoria Vazia',
            active: true,
          },
        });

        // Act
        const [services, total] = await sut.findAll({ categoryId: category3.id });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
      });
    });

    describe('filter by name', () => {
      it('should filter by name - exact match', async() => {
        // Act
        const [services, total] = await sut.findAll({ name: 'Manutenção Preventiva' });

        // Assert
        expect(total).toBe(1);
        expect(services[0].name).toBe('Manutenção Preventiva');
      });

      it('should filter by name - partial match', async() => {
        // Act
        const [services, total] = await sut.findAll({ name: 'Manutenção' });

        // Assert
        expect(total).toBe(2);
        services.forEach((service) => {
          expect(service.name).toContain('Manutenção');
        });
      });

      it('should filter by name - case insensitive', async() => {
        // Act
        const [services, total] = await sut.findAll({ name: 'MANUTENÇÃO' });

        // Assert
        expect(total).toBe(2);
        services.forEach((service) => {
          expect(service.name).toContain('Manutenção');
        });
      });

      it('should return empty if name does not match', async() => {
        // Act
        const [services, total] = await sut.findAll({ name: 'Inexistente' });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
      });
    });

    describe('filter by active', () => {
      it('should filter by active=true', async() => {
        // Act
        const [services, total] = await sut.findAll({ active: true });

        // Assert
        expect(total).toBe(4);
        expect(services).toHaveLength(4);
        services.forEach((service) => {
          expect(service.active).toBe(true);
        });
      });

      it('should filter by active=false', async() => {
        // Act
        const [services, total] = await sut.findAll({ active: false });

        // Assert
        expect(total).toBe(1);
        expect(services).toHaveLength(1);
        expect(services[0].active).toBe(false);
        expect(services[0].name).toBe('Serviço Inativo');
      });
    });

    describe('filter by productId', () => {
      it('should filter by productId', async() => {
        // Act
        const [services, total] = await sut.findAll({ productId: product01.id });

        // Assert
        expect(total).toBe(4);
        expect(services).toHaveLength(4);
        services.forEach((service) => {
          const hasProduct = service.products.some(p => p.id === product01.id);
          expect(hasProduct).toBe(true);
        });
      });

      it('should filter by product03', async() => {
        // Act
        const [services, total] = await sut.findAll({ productId: product03.id });

        // Assert
        expect(total).toBe(1);
        expect(services).toHaveLength(1);
        expect(services[0].name).toBe('Instalação Elétrica');
      });

      it('should return empty if productId is not used', async() => {
        // Arrange
        const product05 = await prisma.product.create({
          data: {
            id: 'product-05',
            companyId: company.id,
            type: 'MERCADORIA',
            group01: 'Geral',
            group02: 'Geral',
            description: 'Produto Sem Uso',
            manufacturerCode: 'MFG005',
            brand: 'Marca',
            measureUnit: 'UN',
            ncm: '00000000',
            economicBatch: 'BATCH005',
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
            ean: '7891234567894',
            additionalInfo: null,
            images: [],
            currentStock: 10,
          },
        });

        // Act
        const [services, total] = await sut.findAll({ productId: product05.id });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
      });
    });

    describe('filter by search', () => {
      it('should search in name field', async() => {
        // Act
        const [services, total] = await sut.findAll({ search: 'Manutenção' });

        // Assert
        expect(total).toBeGreaterThanOrEqual(2);
        const names = services.map(s => s.name);
        expect(names).toEqual(
          expect.arrayContaining([
            'Manutenção Preventiva',
            'Manutenção Corretiva',
          ])
        );
      });

      it('should search in nickname field', async() => {
        // Act
        const [services, total] = await sut.findAll({ search: 'Preventiva' });

        // Assert
        expect(total).toBeGreaterThanOrEqual(1);
        expect(services.some(s => s.nickname === 'Preventiva')).toBe(true);
      });

      it('should search in description field', async() => {
        // Act
        const [services, total] = await sut.findAll({ search: 'urgente' });

        // Assert
        expect(total).toBe(1);
        expect(services[0].name).toBe('Manutenção Corretiva');
      });

      it('should search case insensitive', async() => {
        // Act
        const [services, total] = await sut.findAll({ search: 'CONSULTORIA' });

        // Assert
        expect(total).toBe(1);
        expect(services[0].name).toBe('Consultoria Técnica');
      });

      it('should return empty if search does not match', async() => {
        // Act
        const [services, total] = await sut.findAll({ search: 'xyzabc' });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
      });
    });

    describe('combined filters', () => {
      it('should filter by companyId and categoryId', async() => {
        // Act
        const [services, total] = await sut.findAll({
          companyId: company.id,
          categoryId: serviceCategory.id,
        });

        // Assert
        expect(total).toBe(3);
        services.forEach((service) => {
          expect(service.companyId).toBe(company.id);
          expect(service.category.id).toBe(serviceCategory.id);
        });
      });

      it('should filter by companyId and active', async() => {
        // Act
        const [services, total] = await sut.findAll({
          companyId: company.id,
          active: true,
        });

        // Assert
        expect(total).toBe(3);
        services.forEach((service) => {
          expect(service.companyId).toBe(company.id);
          expect(service.active).toBe(true);
        });
      });

      it('should filter by name and active', async() => {
        // Act
        const [services, total] = await sut.findAll({
          name: 'Manutenção',
          active: true,
        });

        // Assert
        expect(total).toBe(2);
        services.forEach((service) => {
          expect(service.name).toContain('Manutenção');
          expect(service.active).toBe(true);
        });
      });

      it('should filter by categoryId and productId', async() => {
        // Act
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, total] = await sut.findAll({
          categoryId: serviceCategory.id,
          productId: product01.id,
        });

        // Assert
        expect(total).toBe(4);
      });

      it('should return empty if combined filters match nothing', async() => {
        // Act
        const [services, total] = await sut.findAll({
          companyId: company.id,
          name: 'Consultoria',
        });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
      });
    });

    describe('response structure', () => {
      it('should return services with all fields', async() => {
        // Act
        const [services] = await sut.findAll({});

        // Assert
        const service = services[0];
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('nickname');
        expect(service).toHaveProperty('companyId');
        expect(service).toHaveProperty('category');
        expect(service.category).toHaveProperty('id');
        expect(service.category).toHaveProperty('name');
        expect(service).toHaveProperty('products');
        expect(service.products).toHaveLength(2);
        expect(service.products[0]).toHaveProperty('id');
        expect(service.products[0]).toHaveProperty('description');
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

      it('should return services with category details', async() => {
        // Act
        const [services] = await sut.findAll({});

        // Assert
        services.forEach((service) => {
          expect(service.category).toBeDefined();
          expect(service.category.id).toBeTruthy();
          expect(service.category.name).toBeTruthy();
        });
      });

      it('should return services with product details', async() => {
        // Act
        const [services] = await sut.findAll({});

        // Assert
        services.forEach((service) => {
          expect(service.products).toBeDefined();
          expect(service.products.length).toBeGreaterThan(0);
          service.products.forEach((product) => {
            expect(product.id).toBeTruthy();
            expect(product.description).toBeTruthy();
          });
        });
      });
    });

    describe('edge cases', () => {
      it('should handle empty result', async() => {
        // Act
        const [services, total] = await sut.findAll({ name: 'NonExistent' });

        // Assert
        expect(total).toBe(0);
        expect(services).toHaveLength(0);
        expect(services).toEqual([]);
      });

      it('should handle pagination beyond total', async() => {
        // Act
        const [services, total] = await sut.findAll({ page: 100, size: 10 });

        // Assert
        expect(total).toBe(5);
        expect(services).toHaveLength(0);
      });

      it('should handle large page size', async() => {
        // Act
        const [services, total] = await sut.findAll({ page: 1, size: 1000 });

        // Assert
        expect(total).toBe(5);
        expect(services).toHaveLength(5);
      });

      it('should work without any filters', async() => {
        // Act
        const [services, total] = await sut.findAll({});

        // Assert
        expect(total).toBe(5);
        expect(services).toHaveLength(5);
      });
    });
  });

  describe('findById', () => {
    it('should return null if service not found', async() => {
      // Act
      const service = await sut.findById('non-existing-id');

      // Assert
      expect(service).toBeNull();
    });

    it('should return null for invalid UUID', async() => {
      // Act
      const service = await sut.findById('invalid-uuid');

      // Assert
      expect(service).toBeNull();
    });

    it('should return null for empty string id', async() => {
      // Act
      const service = await sut.findById('');

      // Assert
      expect(service).toBeNull();
    });

    it('should return the correct service if found', async() => {
      // Arrange
      const createdService = await prisma.service.create({
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
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service).toBeDefined();
      expect(service?.id).toBe(createdService.id);
      expect(service?.name).toBe('Manutenção Preventiva');
      expect(service?.nickname).toBe('Manutenção');
      expect(service?.companyId).toBe(company.id);
      expect(service?.category).toEqual({
        id: serviceCategory.id,
        name: serviceCategory.name,
      });
      expect(service?.products).toHaveLength(2);
      expect(service?.products).toEqual(
        expect.arrayContaining([
          {
            id: product01.id,
            description: product01.description,
          },
          {
            id: product02.id,
            description: product02.description,
          },
        ])
      );
    });

    it('should return service with all fields populated', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Instalação Completa',
          nickname: 'Instalação',
          deadline: '10 dias úteis',
          shippingValueInCents: 2500,
          warrant: '180 dias',
          weight: '15kg',
          maxVolume: '1.0m³',
          dimensions: '100x80x60',
          commission: 15.5,
          valueInCents: 50000,
          active: true,
          description: 'Serviço completo de instalação',
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service).toBeDefined();
      expect(service).toMatchObject({
        id: createdService.id,
        name: 'Instalação Completa',
        nickname: 'Instalação',
        companyId: company.id,
        deadline: '10 dias úteis',
        shippingValueInCents: 2500,
        warrant: '180 dias',
        weight: '15kg',
        maxVolume: '1.0m³',
        dimensions: '100x80x60',
        commission: 15.5,
        valueInCents: 50000,
        active: true,
        description: 'Serviço completo de instalação',
      });
      expect(service?.category).toEqual({
        id: serviceCategory.id,
        name: serviceCategory.name,
      });
      expect(service?.products).toHaveLength(2);
      expect(service?.createdAt).toBeInstanceOf(Date);
      expect(service?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return service with null optional fields', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Básico',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 0,
          valueInCents: 0,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service).toBeDefined();
      expect(service?.nickname).toBeNull();
      expect(service?.deadline).toBeNull();
      expect(service?.shippingValueInCents).toBeNull();
      expect(service?.warrant).toBeNull();
      expect(service?.weight).toBeNull();
      expect(service?.maxVolume).toBeNull();
      expect(service?.dimensions).toBeNull();
      expect(service?.description).toBeNull();
    });

    it('should return service with shippingValueInCents as 0', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Sem Frete',
          nickname: null,
          deadline: null,
          shippingValueInCents: 0,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.shippingValueInCents).toBe(0);
    });

    it('should return service with valueInCents as 0', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Gratuito',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 0,
          valueInCents: 0,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.valueInCents).toBe(0);
    });

    it('should return service with commission as 0', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Sem Comissão',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 0,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.commission).toBe(0);
    });

    it('should return service with commission as 100', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Comissão Total',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 100,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.commission).toBe(100);
    });

    it('should return service with decimal commission', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Comissão Decimal',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 12.75,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.commission).toBe(12.75);
    });

    it('should return active service', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Ativo',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.active).toBe(true);
    });

    it('should return inactive service', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Inativo',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: false,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.active).toBe(false);
    });

    it('should return service with long text fields', async() => {
      // Arrange
      const longText = 'A'.repeat(1000);
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Longo',
          nickname: 'Nickname Longo',
          deadline: longText,
          shippingValueInCents: 1000,
          warrant: longText,
          weight: longText,
          maxVolume: longText,
          dimensions: longText,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: longText,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.name).toBe('Serviço Longo');
      expect(service?.nickname).toBe('Nickname Longo');
      expect(service?.deadline).toBe(longText);
      expect(service?.warrant).toBe(longText);
      expect(service?.weight).toBe(longText);
      expect(service?.maxVolume).toBe(longText);
      expect(service?.dimensions).toBe(longText);
      expect(service?.description).toBe(longText);
    });

    it('should return service with special characters in text fields', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Manutenção & Instalação (Premium)™',
          nickname: 'M&I™',
          deadline: '5 dias úteis + feriados',
          shippingValueInCents: 1500,
          warrant: 'Garantia de 90 dias @cliente',
          weight: '< 10kg',
          maxVolume: '≤ 0.5m³',
          dimensions: '50x40x30 cm²',
          commission: 10,
          valueInCents: 25000,
          active: true,
          description: 'Serviço com @#$%^&*()',
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.name).toBe('Manutenção & Instalação (Premium)™');
      expect(service?.nickname).toBe('M&I™');
      expect(service?.deadline).toBe('5 dias úteis + feriados');
      expect(service?.warrant).toBe('Garantia de 90 dias @cliente');
      expect(service?.weight).toBe('< 10kg');
      expect(service?.maxVolume).toBe('≤ 0.5m³');
      expect(service?.dimensions).toBe('50x40x30 cm²');
      expect(service?.description).toBe('Serviço com @#$%^&*()');
    });

    it('should return service with timestamps', async() => {
      // Arrange
      const beforeCreate = new Date();
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Timestamp',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      const afterFind = new Date();
      expect(service?.createdAt).toBeInstanceOf(Date);
      expect(service?.updatedAt).toBeInstanceOf(Date);
      expect(service?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(service?.createdAt.getTime()).toBeLessThanOrEqual(afterFind.getTime());
    });

    it('should return service with exactly 2 products', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço 2 Produtos',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.products).toHaveLength(2);
    });

    it('should return service with correct product details', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Detalhes Produtos',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: product01.id,
            description: 'Produto 01',
          }),
          expect.objectContaining({
            id: product02.id,
            description: 'Produto 02',
          }),
        ])
      );
    });

    it('should return service with correct category details', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Detalhes Categoria',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.category).toEqual({
        id: serviceCategory.id,
        name: 'Manutenção',
      });
    });

    it('should find correct service among multiple services', async() => {
      // Arrange
      const service1 = await prisma.service.create({
        data: {
          name: 'Serviço 1',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      await prisma.service.create({
        data: {
          name: 'Serviço 2',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(service1.id);

      // Assert
      expect(service?.id).toBe(service1.id);
      expect(service?.name).toBe('Serviço 1');
    });

    it('should return exact same data on multiple calls', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Consistente',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service1 = await sut.findById(createdService.id);
      const service2 = await sut.findById(createdService.id);
      const service3 = await sut.findById(createdService.id);

      // Assert
      expect(service1).toEqual(service2);
      expect(service2).toEqual(service3);
      expect(service1?.id).toBe(service2?.id);
      expect(service1?.name).toBe(service2?.name);
    });

    it('should return data matching direct database query', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Database Match',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);
      const directFromDb = await prisma.service.findUnique({
        where: { id: createdService.id },
      });

      // Assert
      expect(service?.id).toBe(directFromDb?.id);
      expect(service?.name).toBe(directFromDb?.name);
      expect(service?.active).toBe(directFromDb?.active);
      expect(service?.companyId).toBe(directFromDb?.companyId);
      expect(service?.createdAt).toEqual(directFromDb?.createdAt);
      expect(service?.updatedAt).toEqual(directFromDb?.updatedAt);
    });

    it('should return null after service is deleted', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Deletado',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      await prisma.service.delete({ where: { id: createdService.id } });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service).toBeNull();
    });

    it('should return service with high valueInCents', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Valor Alto',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 999999999,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const service = await sut.findById(createdService.id);

      // Assert
      expect(service?.valueInCents).toBe(999999999);
    });

    it('should handle concurrent reads of same service', async() => {
      // Arrange
      const createdService = await prisma.service.create({
        data: {
          name: 'Serviço Concurrent',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const [service1, service2, service3] = await Promise.all([
        sut.findById(createdService.id),
        sut.findById(createdService.id),
        sut.findById(createdService.id),
      ]);

      // Assert
      expect(service1?.id).toBe(createdService.id);
      expect(service2?.id).toBe(createdService.id);
      expect(service3?.id).toBe(createdService.id);
      expect(service1).toEqual(service2);
      expect(service2).toEqual(service3);
    });

    it('should handle concurrent reads of different services', async() => {
      // Arrange
      const service1 = await prisma.service.create({
        data: {
          name: 'Serviço Concurrent 1',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      const service2 = await prisma.service.create({
        data: {
          name: 'Serviço Concurrent 2',
          nickname: null,
          deadline: null,
          shippingValueInCents: null,
          warrant: null,
          weight: null,
          maxVolume: null,
          dimensions: null,
          commission: 10,
          valueInCents: 10000,
          active: true,
          description: null,
          company: {
            connect: {
              id: company.id,
            },
          },
          category: {
            connect: {
              id: serviceCategory.id,
            },
          },
          products: {
            create: [
              { productId: product01.id },
              { productId: product02.id },
            ],
          },
        },
      });

      // Act
      const [found1, found2] = await Promise.all([
        sut.findById(service1.id),
        sut.findById(service2.id),
      ]);

      // Assert
      expect(found1?.name).toBe('Serviço Concurrent 1');
      expect(found2?.name).toBe('Serviço Concurrent 2');
    });
  });
});
