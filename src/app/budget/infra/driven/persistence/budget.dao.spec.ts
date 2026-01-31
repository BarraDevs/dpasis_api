import { Test } from '@nestjs/testing';
import { Client, Company, Product, Seller, Service, Shipper } from '@prisma/client';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { BudgetDto } from 'src/app/budget/application/dtos/budget.dto';
import { BudgetPersistenceModule } from 'src/app/budget/application/persistence/budget-persistence.module';
import { FindAllBudgetQueroDto } from 'src/app/budget/application/persistence/dao/budget-dao.interface';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { BudgetStatus } from 'src/app/budget/enums/budget-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BudgetDaoAdapterPrisma } from './budget.dao';

describe('BudgetDaoAdapterPrisma', () => {
  let sut: BudgetDaoAdapterPrisma;
  let prisma: PrismaService;
  let company01: Company;
  let company02: Company;
  let client01: Client;
  let client02: Client;
  let seller01: Seller;
  let seller02: Seller;
  let shipper01: Shipper;
  let product01: Product;
  let service01: Service;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [BudgetPersistenceModule, ConfigModule],
      providers: [BudgetDaoAdapterPrisma],
    }).compile();

    sut = module.get(BudgetDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.client.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.company.deleteMany();

    company01 = await prisma.company.create({
      data: {
        name: 'Company 01',
        fantasyName: 'Company 01 Fantasy',
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

    company02 = await prisma.company.create({
      data: {
        name: 'Company 02',
        fantasyName: 'Company 02 Fantasy',
        document: '22333444000105',
        ie: 'ie teste 02',
        zipCode: 'zipCode teste 02',
        street: 'street teste 02',
        number: 'number teste 02',
        neighborhood: 'neighborhood teste 02',
        city: 'city teste 02',
        state: 'state teste 02',
        phone01: 'phone01 teste 02',
        email01: 'email01 teste 02',
        active: true,
      },
    });

    client01 = await prisma.client.create({
      data: {
        id: 'client-01',
        kind: 'Kind A',
        cnpj: '33444555000172',
        ie: '111222333',
        type: 'Type A',
        group: 'Group A',
        companyName: 'Client Company 01',
        fantasyName: 'Client Fantasy 01',
        owner: 'Owner 01',
        headquarters: 'HQ 01',
        generateInvoice: true,
        active: true,
        companies: { connect: { id: company01.id } },
      },
    });

    client02 = await prisma.client.create({
      data: {
        id: 'client-02',
        kind: 'Kind B',
        cnpj: '44555666000163',
        ie: '222333444',
        type: 'Type B',
        group: 'Group B',
        companyName: 'Client Company 02',
        fantasyName: 'Client Fantasy 02',
        owner: 'Owner 02',
        headquarters: 'HQ 02',
        generateInvoice: false,
        active: true,
        companies: { connect: { id: company01.id } },
      },
    });

    seller01 = await prisma.seller.create({
      data: {
        id: 'seller-01',
        name: 'Seller 01',
        phone: '11999999999',
        cellphone: '11999999999',
        commission: 5.0,
        zipCode: '12345-678',
        street: 'Main Street',
        number: '100',
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        role: {
          create: {
            role: AccountRole.SELLER,
            account: {
              create: {
                email: 'seller01@test.com',
                password: 'hashed_password_1',
                status: AccountStatus.ACTIVE,
              },
            },
          },
        },
        companies: { connect: { id: company01.id } },
      },
    });

    seller02 = await prisma.seller.create({
      data: {
        id: 'seller-02',
        name: 'Seller 02',
        phone: '11988888888',
        cellphone: '11988888888',
        commission: 7.5,
        zipCode: '87654-321',
        street: 'Second Avenue',
        number: '200',
        neighborhood: 'Uptown',
        city: 'Rio de Janeiro',
        state: 'RJ',
        active: true,
        role: {
          create: {
            role: AccountRole.SELLER,
            account: {
              create: {
                email: 'seller02@test.com',
                password: 'hashed_password_2',
                status: AccountStatus.ACTIVE,
              },
            },
          },
        },
        companies: { connect: { id: company01.id } },
      },
    });

    shipper01 = await prisma.shipper.create({
      data: {
        id: 'shipper-01',
        companyName: 'Shipper Company 01',
        fantasyName: 'Shipper Fantasy 01',
        cnpj: '55666777000194',
        contact: 'contact@shipper01.com',
        representative: 'Rep 01',
        zipCode: '12345-678',
        street: 'Shipper Street',
        number: '300',
        neighborhood: 'Industrial',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        companies: { connect: { id: company01.id } },
      },
    });

    product01 = await prisma.product.create({
      data: {
        id: 'product-01',
        type: 'Type A',
        group01: 'Group01',
        group02: 'Group02',
        description: 'Product Description',
        manufacturerCode: 'MAN-001',
        brand: 'Brand A',
        measureUnit: 'UN',
        ncm: '12345678',
        economicBatch: '100',
        minimumStock: 10,
        maximumStock: 100,
        warrantyDays: 365,
        weightInKg: 1.5,
        heightInCm: 10,
        lengthInCm: 20,
        widthInCm: 15,
        markup: 1.5,
        marginB: 0.3,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 10000,
        unitPriceInCents: 15000,
        ean: 'EAN-001',
        images: [],
        currentStock: 50,
        companyId: company01.id,
      },
    });

    const category = await prisma.serviceCategory.create({
      data: {
        name: 'Category 01',
        active: true,
      },
    });

    service01 = await prisma.service.create({
      data: {
        id: 'service-01',
        name: 'Service 01',
        companyId: company01.id,
        categoryId: category.id,
        commission: 5.0,
        valueInCents: 20000,
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.client.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Budget 1 - Company 01, Client 01, Seller 01, CIF, PENDING
      await prisma.budget.create({
        data: {
          id: 'budget-01',
          companyId: company01.id,
          clientId: client01.id,
          sellerId: seller01.id,
          freightType: 'CIF',
          shipperId: shipper01.id,
          freightValueInCents: 5000,
          subtotalInCents: 490000,
          discountInCents: 2000,
          totalInCents: 493000,
          commercialProcess: 'PROC-2026-001',
          observations: 'Budget 01',
          status: BudgetStatus.PENDING,
          createdAt: new Date('2026-01-01T10:00:00Z'),
          items: {
            create: {
              id: 'item-01',
              itemType: BudgetItemType.PRODUCT,
              productId: product01.id,
              serviceId: null,
              description: 'Product 01',
              quantity: 1,
              unitPriceInCents: 490000,
              discountInCents: 0,
              subtotalInCents: 490000,
            },
          },
        },
      });

      // Budget 2 - Company 01, Client 02, Seller 01, FOB, APPROVED
      await prisma.budget.create({
        data: {
          id: 'budget-02',
          companyId: company01.id,
          clientId: client02.id,
          sellerId: seller01.id,
          freightType: 'FOB',
          shipperId: null,
          freightValueInCents: 0,
          subtotalInCents: 200000,
          discountInCents: 0,
          totalInCents: 200000,
          commercialProcess: null,
          observations: 'Budget 02',
          status: BudgetStatus.APPROVED,
          createdAt: new Date('2026-01-15T10:00:00Z'),
          items: {
            create: {
              id: 'item-02',
              itemType: BudgetItemType.SERVICE,
              productId: null,
              serviceId: service01.id,
              description: 'Service 01',
              quantity: 1,
              unitPriceInCents: 200000,
              discountInCents: 0,
              subtotalInCents: 200000,
            },
          },
        },
      });

      // Budget 3 - Company 01, Client 01, Seller 02, CIF, REJECTED
      await prisma.budget.create({
        data: {
          id: 'budget-03',
          companyId: company01.id,
          clientId: client01.id,
          sellerId: seller02.id,
          freightType: 'CIF',
          shipperId: shipper01.id,
          freightValueInCents: 3000,
          subtotalInCents: 150000,
          discountInCents: 1000,
          totalInCents: 152000,
          commercialProcess: null,
          observations: 'Budget 03',
          status: BudgetStatus.REJECTED,
          createdAt: new Date('2026-01-20T10:00:00Z'),
          items: {
            create: {
              id: 'item-03',
              itemType: BudgetItemType.PRODUCT,
              productId: product01.id,
              serviceId: null,
              description: 'Product 02',
              quantity: 1,
              unitPriceInCents: 150000,
              discountInCents: 0,
              subtotalInCents: 150000,
            },
          },
        },
      });

      // Budget 4 - Company 02, Client 01, Seller 01, FOB, CANCELLED
      await prisma.budget.create({
        data: {
          id: 'budget-04',
          companyId: company02.id,
          clientId: client01.id,
          sellerId: seller01.id,
          freightType: 'FOB',
          shipperId: null,
          freightValueInCents: 0,
          subtotalInCents: 300000,
          discountInCents: 0,
          totalInCents: 300000,
          commercialProcess: 'PROC-2026-002',
          observations: 'Budget 04',
          status: BudgetStatus.CANCELLED,
          createdAt: new Date('2026-01-25T10:00:00Z'),
          items: {
            create: {
              id: 'item-04',
              itemType: BudgetItemType.PRODUCT,
              productId: product01.id,
              serviceId: null,
              description: 'Product 03',
              quantity: 1,
              unitPriceInCents: 300000,
              discountInCents: 0,
              subtotalInCents: 300000,
            },
          },
        },
      });

      // Budget 5 - Company 01, Client 02, Seller 02, SEM_FRETE, PENDING
      await prisma.budget.create({
        data: {
          id: 'budget-05',
          companyId: company01.id,
          clientId: client02.id,
          sellerId: seller02.id,
          freightType: 'SEM_FRETE',
          shipperId: null,
          freightValueInCents: 0,
          subtotalInCents: 100000,
          discountInCents: 0,
          totalInCents: 100000,
          commercialProcess: null,
          observations: 'Budget 05',
          status: BudgetStatus.PENDING,
          createdAt: new Date('2026-01-28T10:00:00Z'),
          items: {
            create: {
              id: 'item-05',
              itemType: BudgetItemType.SERVICE,
              productId: null,
              serviceId: service01.id,
              description: 'Service 02',
              quantity: 1,
              unitPriceInCents: 100000,
              discountInCents: 0,
              subtotalInCents: 100000,
            },
          },
        },
      });
    });

    it('should return correct DTO', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
      };

      // Act
      const [data] = await sut.findAll(queries);

      // Assert
      const budget = data[0];
      expect(budget).toEqual<BudgetDto>({
        id: 'budget-05',
        companyId: company01.id,
        clientId: client02.id,
        sellerId: seller02.id,
        freightType: 'SEM_FRETE',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 100000,
        discountInCents: 0,
        totalInCents: 100000,
        commercialProcess: null,
        commercialNote: null,
        observations: 'Budget 05',
        status: BudgetStatus.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        items: [
          {
            id: 'item-05',
            itemType: BudgetItemType.SERVICE,
            productId: null,
            serviceId: service01.id,
            description: 'Service 02',
            quantity: 1,
            unitPriceInCents: 100000,
            discountInCents: 0,
            subtotalInCents: 100000,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      });
    });

    it('should return all budgets when no filters are provided', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(5);
      expect(data).toHaveLength(5);
      expect(data[0].id).toBe('budget-05'); // Most recent
      expect(data[4].id).toBe('budget-01'); // Oldest
    });

    it('should filter budgets by companyId', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        companyId: company01.id,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(4);
      expect(data).toHaveLength(4);
      expect(data.every((b) => b.companyId === company01.id)).toBe(true);
    });

    it('should filter budgets by clientId', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        clientId: client01.id,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(data).toHaveLength(3);
      expect(data.every((b) => b.clientId === client01.id)).toBe(true);
      expect(data.map((b) => b.id)).toEqual(['budget-04', 'budget-03', 'budget-01']);
    });

    it('should filter budgets by sellerId', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        sellerId: seller01.id,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(data).toHaveLength(3);
      expect(data.every((b) => b.sellerId === seller01.id)).toBe(true);
    });

    it('should filter budgets by shipperId', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        shipperId: shipper01.id,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(2);
      expect(data).toHaveLength(2);
      expect(data.every((b) => b.shipperId === shipper01.id)).toBe(true);
      expect(data.map((b) => b.id)).toEqual(['budget-03', 'budget-01']);
    });

    it('should filter budgets by freightType', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        freightType: 'CIF',
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(2);
      expect(data).toHaveLength(2);
      expect(data.every((b) => b.freightType === 'CIF')).toBe(true);
    });

    it('should filter budgets by freightType case-insensitive', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        freightType: 'cif',
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(2);
      expect(data).toHaveLength(2);
    });

    it('should filter budgets by status PENDING', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        status: BudgetStatus.PENDING,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(2);
      expect(data).toHaveLength(2);
      expect(data.every((b) => b.status === BudgetStatus.PENDING)).toBe(true);
      expect(data.map((b) => b.id)).toEqual(['budget-05', 'budget-01']);
    });

    it('should filter budgets by status APPROVED', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        status: BudgetStatus.APPROVED,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0].status).toBe(BudgetStatus.APPROVED);
      expect(data[0].id).toBe('budget-02');
    });

    it('should filter budgets by createdAtStart', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        createdAtStart: new Date('2026-01-15T00:00:00Z'),
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(4);
      expect(data).toHaveLength(4);
      expect(data.map((b) => b.id)).toEqual(['budget-05', 'budget-04', 'budget-03', 'budget-02']);
    });

    it('should filter budgets by createdAtEnd', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        createdAtEnd: new Date('2026-01-20T23:59:59Z'),
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(data).toHaveLength(3);
      expect(data.map((b) => b.id)).toEqual(['budget-03', 'budget-02', 'budget-01']);
    });

    it('should filter budgets by date range', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        createdAtStart: new Date('2026-01-15T00:00:00Z'),
        createdAtEnd: new Date('2026-01-25T23:59:59Z'),
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(data).toHaveLength(3);
      expect(data.map((b) => b.id)).toEqual(['budget-04', 'budget-03', 'budget-02']);
    });

    it('should combine multiple filters', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        companyId: company01.id,
        clientId: client01.id,
        status: BudgetStatus.PENDING,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('budget-01');
      expect(data[0].companyId).toBe(company01.id);
      expect(data[0].clientId).toBe(client01.id);
      expect(data[0].status).toBe(BudgetStatus.PENDING);
    });

    it('should combine all filters', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        companyId: company01.id,
        clientId: client01.id,
        sellerId: seller01.id,
        shipperId: shipper01.id,
        freightType: 'CIF',
        status: BudgetStatus.PENDING,
        createdAtStart: new Date('2026-01-01T00:00:00Z'),
        createdAtEnd: new Date('2026-01-31T23:59:59Z'),
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('budget-01');
    });

    it('should return empty array when no budgets match filters', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        companyId: company01.id,
        status: BudgetStatus.APPROVED,
        sellerId: seller02.id,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(0);
      expect(data).toHaveLength(0);
    });

    it('should paginate results correctly - page 1', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 2,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(5);
      expect(data).toHaveLength(2);
      expect(data.map((b) => b.id)).toEqual(['budget-05', 'budget-04']);
    });

    it('should paginate results correctly - page 2', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 2,
        limit: 2,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(5);
      expect(data).toHaveLength(2);
      expect(data.map((b) => b.id)).toEqual(['budget-03', 'budget-02']);
    });

    it('should paginate results correctly - page 3', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 3,
        limit: 2,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(5);
      expect(data).toHaveLength(1);
      expect(data.map((b) => b.id)).toEqual(['budget-01']);
    });

    it('should return budgets with all items included', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
        companyId: company01.id,
      };

      // Act
      const [data, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(4);
      expect(data.every((b) => b.items.length > 0)).toBe(true);
      expect(data[0].items[0]).toHaveProperty('id');
      expect(data[0].items[0]).toHaveProperty('itemType');
      expect(data[0].items[0]).toHaveProperty('description');
      expect(data[0].items[0]).toHaveProperty('quantity');
      expect(data[0].items[0]).toHaveProperty('unitPriceInCents');
      expect(data[0].items[0]).toHaveProperty('subtotalInCents');
    });

    it('should order results by createdAt desc (most recent first)', async() => {
      // Arrange
      const queries: FindAllBudgetQueroDto = {
        page: 1,
        limit: 10,
      };

      // Act
      const [data] = await sut.findAll(queries);

      // Assert
      expect(data[0].createdAt.getTime()).toBeGreaterThan(data[1].createdAt.getTime());
      expect(data[1].createdAt.getTime()).toBeGreaterThan(data[2].createdAt.getTime());
      expect(data[2].createdAt.getTime()).toBeGreaterThan(data[3].createdAt.getTime());
      expect(data[3].createdAt.getTime()).toBeGreaterThan(data[4].createdAt.getTime());
    });
  });

  describe('findById', () => {
    it('should return null when budget does not exist', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return budget with items when budget exists', async() => {
      // Arrange
      const budget = await prisma.budget.create({
        data: {
          id: 'budget-01',
          companyId: company01.id,
          clientId: client01.id,
          sellerId: seller01.id,
          freightType: 'CIF',
          shipperId: shipper01.id,
          freightValueInCents: 5000,
          subtotalInCents: 490000,
          discountInCents: 2000,
          totalInCents: 493000,
          commercialProcess: 'PROC-2026-001',
          commercialNote: null,
          observations: 'Test observations',
          status: BudgetStatus.PENDING,
        },
      });

      await prisma.budgetItem.createMany({
        data: [
          {
            id: 'item-01',
            budgetId: budget.id,
            itemType: BudgetItemType.PRODUCT,
            productId: product01.id,
            serviceId: null,
            description: 'Notebook Dell',
            quantity: 2,
            unitPriceInCents: 250000,
            discountInCents: 10000,
            subtotalInCents: 490000,
          },
        ],
      });

      // Act
      const result = await sut.findById(budget.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<BudgetDto>({
        id: budget.id,
        companyId: company01.id,
        clientId: client01.id,
        sellerId: seller01.id,
        freightType: 'CIF',
        shipperId: shipper01.id,
        freightValueInCents: 5000,
        subtotalInCents: 490000,
        discountInCents: 2000,
        totalInCents: 493000,
        commercialProcess: 'PROC-2026-001',
        commercialNote: null,
        observations: 'Test observations',
        status: BudgetStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        items: [
          {
            id: 'item-01',
            itemType: BudgetItemType.PRODUCT,
            productId: product01.id,
            serviceId: null,
            description: 'Notebook Dell',
            quantity: 2,
            unitPriceInCents: 250000,
            discountInCents: 10000,
            subtotalInCents: 490000,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      });
    });

    it('should return budget with multiple items ordered by createdAt', async() => {
      // Arrange
      const budget = await prisma.budget.create({
        data: {
          id: 'budget-02',
          companyId: company01.id,
          clientId: client01.id,
          sellerId: seller01.id,
          freightType: 'FOB',
          shipperId: null,
          freightValueInCents: 0,
          subtotalInCents: 300000,
          discountInCents: 0,
          totalInCents: 300000,
          commercialProcess: null,
          observations: null,
          status: BudgetStatus.PENDING,
        },
      });

      const now = new Date();
      await prisma.budgetItem.create({
        data: {
          id: 'item-02',
          budgetId: budget.id,
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: 'service-01',
          description: 'Service B',
          quantity: 1,
          unitPriceInCents: 100000,
          discountInCents: 0,
          subtotalInCents: 100000,
          createdAt: new Date(now.getTime() + 1000),
        },
      });

      await prisma.budgetItem.create({
        data: {
          id: 'item-01',
          budgetId: budget.id,
          itemType: BudgetItemType.PRODUCT,
          productId: 'product-01',
          serviceId: null,
          description: 'Product A',
          quantity: 2,
          unitPriceInCents: 100000,
          discountInCents: 0,
          subtotalInCents: 200000,
          createdAt: now,
        },
      });

      // Act
      const result = await sut.findById(budget.id);

      // Assert
      expect(result?.items).toHaveLength(2);
      expect(result?.items[0].description).toBe('Product A');
      expect(result?.items[1].description).toBe('Service B');
    });

    it('should return budget with approved status and metadata', async() => {
      // Arrange
      const approvedAt = new Date('2026-01-28T10:00:00Z');
      const budget = await prisma.budget.create({
        data: {
          id: 'budget-03',
          companyId: company01.id,
          clientId: client01.id,
          sellerId: seller01.id,
          freightType: 'CIF',
          shipperId: null,
          freightValueInCents: 0,
          subtotalInCents: 100000,
          discountInCents: 0,
          totalInCents: 100000,
          commercialProcess: null,
          observations: null,
          status: BudgetStatus.APPROVED,
          approvedBy: 'admin-01',
          approvedAt: approvedAt,
        },
      });

      await prisma.budgetItem.create({
        data: {
          id: 'item-01',
          budgetId: budget.id,
          itemType: BudgetItemType.PRODUCT,
          productId: 'product-01',
          serviceId: null,
          description: 'Product',
          quantity: 1,
          unitPriceInCents: 100000,
          discountInCents: 0,
          subtotalInCents: 100000,
        },
      });

      // Act
      const result = await sut.findById(budget.id);

      // Assert
      expect(result?.status).toBe(BudgetStatus.APPROVED);
      expect(result?.approvedBy).toBe('admin-01');
      expect(result?.approvedAt).toEqual(approvedAt);
      expect(result?.rejectedBy).toBeNull();
      expect(result?.rejectedAt).toBeNull();
      expect(result?.rejectionReason).toBeNull();
    });

    it('should return budget with rejected status and metadata', async() => {
      // Arrange
      const rejectedAt = new Date('2026-01-28T11:00:00Z');
      const budget = await prisma.budget.create({
        data: {
          id: 'budget-04',
          companyId: company01.id,
          clientId: client01.id,
          sellerId: seller01.id,
          freightType: 'CIF',
          shipperId: null,
          freightValueInCents: 0,
          subtotalInCents: 100000,
          discountInCents: 0,
          totalInCents: 100000,
          commercialProcess: null,
          observations: null,
          status: BudgetStatus.REJECTED,
          rejectedBy: 'admin-02',
          rejectedAt: rejectedAt,
          rejectionReason: 'Preço muito alto',
        },
      });

      await prisma.budgetItem.create({
        data: {
          id: 'item-01',
          budgetId: budget.id,
          itemType: BudgetItemType.PRODUCT,
          productId: 'product-01',
          serviceId: null,
          description: 'Product',
          quantity: 1,
          unitPriceInCents: 100000,
          discountInCents: 0,
          subtotalInCents: 100000,
        },
      });

      // Act
      const result = await sut.findById(budget.id);

      // Assert
      expect(result?.status).toBe(BudgetStatus.REJECTED);
      expect(result?.rejectedBy).toBe('admin-02');
      expect(result?.rejectedAt).toEqual(rejectedAt);
      expect(result?.rejectionReason).toBe('Preço muito alto');
      expect(result?.approvedBy).toBeNull();
      expect(result?.approvedAt).toBeNull();
    });
  });
});
