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
