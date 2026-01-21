import { Test } from '@nestjs/testing';
import { Company, Product, ServiceCategory } from '@prisma/client';
import { ServicePersistenceModule } from 'src/app/service/application/persistence/service-persistence.module';
import { Service } from 'src/app/service/domain/entities/service.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceRepositoryAdapterPrisma } from './service.repository';

describe('ServiceRepositoryAdapterPrisma', () => {
  let sut: ServiceRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;
  let serviceCategory: ServiceCategory;
  let product01: Product;
  let product02: Product;

  const createServiceProps = (overrides = {}) => ({
    name: 'Manutenção Preventiva',
    nickname: 'Manutenção',
    companyId: company.id,
    categoryId: serviceCategory.id,
    productIds: [product01.id, product02.id],
    deadline: '5 dias úteis',
    shippingValueInCents: 1500,
    warrant: '90 dias',
    weight: 'até 10kg',
    maxVolume: 'até 0.5m³',
    dimensions: '50x40x30',
    commission: 10,
    valueInCents: 25000,
    description: 'Serviço de manutenção preventiva',
    ...overrides,
  });

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ServicePersistenceModule,
        ConfigModule,
      ],
      providers: [
        ServiceRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ServiceRepositoryAdapterPrisma);
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
        zipCode: 'zipCode teste',
        street: 'street teste',
        number: 'number teste',
        neighborhood: 'neighborhood teste',
        city: 'city teste',
        state: 'state teste',
        phone01: 'phone01 teste',
        email01: 'email01 teste',
        active: true,
      },
    });

    serviceCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Categoria Teste',
        active: true,
      },
    });

    product01 = await prisma.product.create({
      data: {
        id: 'product-01',
        companyId: company.id,
        type: 'Eletrônico',
        group01: 'Informática',
        group02: 'Computadores',
        description: 'Notebook Dell Inspiron',
        complement: 'Core i7 16GB',
        manufacturerCode: 'DELL-001',
        brand: 'Dell',
        measureUnit: 'UN',
        ncm: '84713012',
        economicBatch: 'BATCH001',
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
        ean: '7891234567890',
        additionalInfo: null,
        images: [],
        currentStock: 0,
      },
    });

    product02 = await prisma.product.create({
      data: {
        id: 'product-02',
        companyId: company.id,
        type: 'Eletrônico',
        group01: 'Informática',
        group02: 'Computadores',
        description: 'Notebook Dell Latitude',
        complement: 'Core i5 8GB',
        manufacturerCode: 'DELL-002',
        brand: 'Dell',
        measureUnit: 'UN',
        ncm: '84713012',
        economicBatch: 'BATCH002',
        minimumStock: 0,
        maximumStock: 0,
        warrantyDays: 0,
        weightInKg: 2.2,
        heightInCm: 2.8,
        lengthInCm: 34.0,
        widthInCm: 24.0,
        markup: 0,
        marginB: 0,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 0,
        unitPriceInCents: 0,
        ean: '7891234567891',
        additionalInfo: null,
        images: [],
        currentStock: 0,
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

  it('should save a service with products', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
      include: { products: true },
    });

    expect(savedService).toBeDefined();
    expect(savedService?.id).toBe(service.props.id);
    expect(savedService?.companyId).toBe(company.id);
    expect(savedService?.categoryId).toBe(serviceCategory.id);
    expect(savedService?.products).toHaveLength(2);
    const productIds = savedService?.products.map((link) => link.productId).sort();
    expect(productIds).toEqual([product01.id, product02.id].sort());
  });

  it('should create service_products rows for each product', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const links = await prisma.serviceProduct.findMany({
      where: { serviceId: service.props.id },
      orderBy: { productId: 'asc' },
    });
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.productId)).toEqual([product01.id, product02.id].sort());
  });

  it('should persist service fields correctly', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      name: 'Instalação Técnica',
      shippingValueInCents: 0,
      commission: 7.5,
      valueInCents: 10000,
      description: 'Instalação de equipamento',
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService).toMatchObject({
      id: service.props.id,
      companyId: company.id,
      categoryId: serviceCategory.id,
      name: 'Instalação Técnica',
      shippingValueInCents: 0,
      commission: 7.5,
      valueInCents: 10000,
      description: 'Instalação de equipamento',
      active: true,
    });
  });

  it('should save service with null optional fields', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      nickname: null,
      deadline: null,
      shippingValueInCents: null,
      warrant: null,
      weight: null,
      maxVolume: null,
      dimensions: null,
      description: null,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.nickname).toBeNull();
    expect(savedService?.deadline).toBeNull();
    expect(savedService?.shippingValueInCents).toBeNull();
    expect(savedService?.warrant).toBeNull();
    expect(savedService?.weight).toBeNull();
    expect(savedService?.maxVolume).toBeNull();
    expect(savedService?.dimensions).toBeNull();
    expect(savedService?.description).toBeNull();
  });

  it('should persist timestamps (createdAt and updatedAt)', async() => {
    // Arrange
    const beforeSave = new Date();
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });

    expect(savedService?.createdAt).toBeInstanceOf(Date);
    expect(savedService?.updatedAt).toBeInstanceOf(Date);
    expect(savedService?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    expect(savedService?.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
  });

  it('should save service with commission as 0', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      commission: 0,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.commission).toBe(0);
  });

  it('should save service with commission as 100', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      commission: 100,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.commission).toBe(100);
  });

  it('should save service with valueInCents as 0', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      valueInCents: 0,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.valueInCents).toBe(0);
  });

  it('should save service with high valueInCents', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      valueInCents: 999999999,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.valueInCents).toBe(999999999);
  });

  it('should save service with shippingValueInCents as 0', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      shippingValueInCents: 0,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.shippingValueInCents).toBe(0);
  });

  it('should save multiple services without conflicts', async() => {
    // Arrange
    const service1 = Service.create(createServiceProps({
      name: 'Serviço 1',
    }));
    const service2 = Service.create(createServiceProps({
      name: 'Serviço 2',
    }));

    // Act
    await sut.save(service1);
    await sut.save(service2);

    // Assert
    const savedServices = await prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
    });
    expect(savedServices).toHaveLength(2);
    expect(savedServices[0].id).toBe(service1.props.id);
    expect(savedServices[1].id).toBe(service2.props.id);
  });

  it('should create correct bidirectional relation between service and products', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    // Verificar relação Service -> Product
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
      include: { products: true },
    });
    expect(savedService?.products).toHaveLength(2);

    // Verificar relação Product -> Service (via service_products)
    const product01Links = await prisma.serviceProduct.findMany({
      where: { productId: product01.id },
    });
    const product02Links = await prisma.serviceProduct.findMany({
      where: { productId: product02.id },
    });

    expect(product01Links).toHaveLength(1);
    expect(product01Links[0].serviceId).toBe(service.props.id);
    expect(product02Links).toHaveLength(1);
    expect(product02Links[0].serviceId).toBe(service.props.id);
  });

  it('should persist service with exactly 2 products', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
      include: { products: true },
    });
    expect(savedService?.products).toHaveLength(2);
  });

  it('should persist required fields as not null', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });

    // Campos obrigatórios
    expect(savedService?.id).toBeTruthy();
    expect(savedService?.name).toBeTruthy();
    expect(savedService?.companyId).toBeTruthy();
    expect(savedService?.categoryId).toBeTruthy();
    expect(savedService?.commission).toBeDefined();
    expect(savedService?.valueInCents).toBeDefined();
    expect(savedService?.active).toBeDefined();
    expect(savedService?.createdAt).toBeDefined();
    expect(savedService?.updatedAt).toBeDefined();
  });

  it('should save service with long text fields', async() => {
    // Arrange
    const longText = 'A'.repeat(1000);
    const service = Service.create(createServiceProps({
      deadline: longText,
      warrant: longText,
      weight: longText,
      maxVolume: longText,
      dimensions: longText,
      description: longText,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });

    expect(savedService?.deadline).toBe(longText);
    expect(savedService?.warrant).toBe(longText);
    expect(savedService?.weight).toBe(longText);
    expect(savedService?.maxVolume).toBe(longText);
    expect(savedService?.dimensions).toBe(longText);
    expect(savedService?.description).toBe(longText);
  });

  it('should save service with special characters in text fields', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      name: 'Manutenção & Instalação (Premium)™',
      nickname: 'M&I™',
      deadline: '5 dias úteis + feriados',
      warrant: 'Garantia de 90 dias @cliente',
      weight: '< 10kg',
      maxVolume: '≤ 0.5m³',
      dimensions: '50x40x30 cm²',
      description: 'Serviço com @#$%^&*()',
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });

    expect(savedService?.name).toBe('Manutenção & Instalação (Premium)™');
    expect(savedService?.nickname).toBe('M&I™');
    expect(savedService?.deadline).toBe('5 dias úteis + feriados');
    expect(savedService?.warrant).toBe('Garantia de 90 dias @cliente');
    expect(savedService?.weight).toBe('< 10kg');
    expect(savedService?.maxVolume).toBe('≤ 0.5m³');
    expect(savedService?.dimensions).toBe('50x40x30 cm²');
    expect(savedService?.description).toBe('Serviço com @#$%^&*()');
  });

  it('should save service with decimal commission', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      commission: 12.75,
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.commission).toBe(12.75);
  });

  it('should save service with active field as true by default', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.active).toBe(true);
  });

  it('should preserve UUID format for service id', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });
    expect(savedService?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should create service_products with correct foreign keys', async() => {
    // Arrange
    const service = Service.create(createServiceProps());

    // Act
    await sut.save(service);

    // Assert
    const links = await prisma.serviceProduct.findMany({
      where: { serviceId: service.props.id },
    });

    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link.serviceId).toBe(service.props.id);
      expect([product01.id, product02.id]).toContain(link.productId);
    });
  });

  it('should allow same product to be linked to multiple services', async() => {
    // Arrange
    const service1 = Service.create(createServiceProps({
      name: 'Serviço 1',
    }));
    const service2 = Service.create(createServiceProps({
      name: 'Serviço 2',
    }));

    // Act
    await sut.save(service1);
    await sut.save(service2);

    // Assert
    const product01Links = await prisma.serviceProduct.findMany({
      where: { productId: product01.id },
    });

    expect(product01Links).toHaveLength(2);
    expect(product01Links.map(link => link.serviceId)).toContain(service1.props.id);
    expect(product01Links.map(link => link.serviceId)).toContain(service2.props.id);
  });

  it('should save service with all fields filled', async() => {
    // Arrange
    const service = Service.create(createServiceProps({
      name: 'Manutenção Completa',
      nickname: 'Manutenção',
      deadline: '10 dias úteis',
      shippingValueInCents: 2500,
      warrant: '180 dias',
      weight: '15kg',
      maxVolume: '1.0m³',
      dimensions: '100x80x60',
      commission: 15.5,
      valueInCents: 50000,
      description: 'Serviço completo de manutenção',
    }));

    // Act
    await sut.save(service);

    // Assert
    const savedService = await prisma.service.findUnique({
      where: { id: service.props.id },
    });

    expect(savedService).toMatchObject({
      id: service.props.id,
      name: 'Manutenção Completa',
      nickname: 'Manutenção',
      companyId: company.id,
      categoryId: serviceCategory.id,
      deadline: '10 dias úteis',
      shippingValueInCents: 2500,
      warrant: '180 dias',
      weight: '15kg',
      maxVolume: '1.0m³',
      dimensions: '100x80x60',
      commission: 15.5,
      valueInCents: 50000,
      description: 'Serviço completo de manutenção',
      active: true,
    });
  });
});
