import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDto } from '../../dtos/client.dto';
import { FindAllClient } from './find-all-client.service';

describe('FindAllClient - Integration tests', () => {
  let sut: FindAllClient;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(FindAllClient);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when no clients exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(0);
  });

  it('should return clients with default pagination', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 1,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 2,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 2',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.currentPage).toBe(1);
  });

  it('should paginate results correctly', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        resaleId: resale.id,
        companyName: `Empresa ${i + 1}`,
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      })),
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
  });

  it('should return correct page when requesting page 2', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        resaleId: resale.id,
        companyName: `Empresa ${i + 1}`,
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      })),
    });

    const result = await sut.execute({ page: 2, size: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.currentPage).toBe(2);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should return last page with remaining items', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        resaleId: resale.id,
        companyName: `Empresa ${i + 1}`,
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      })),
    });

    const result = await sut.execute({ page: 3, size: 10 });

    expect(result.data).toHaveLength(5);
    expect(result.currentPage).toBe(3);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by search in companyName (case-insensitive)', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 3,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Premium LTDA',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 4,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Básica',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ search: 'premium' });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].companyName).toBe('Empresa Premium LTDA');
  });

  it('should filter by search in fantasyName (case-insensitive)', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 5,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 1',
          fantasyName: 'Premium Corp',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 6,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 2',
          fantasyName: 'Básica',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ search: 'PREMIUM' });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].fantasyName).toBe('Premium Corp');
  });

  it('should filter by search in socialName (case-insensitive)', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 5_010,
          type: ClientType.PJ,
          document: '09748165000130',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa A',
          socialName: 'Instituto Alfa Beta',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 5_011,
          type: ClientType.PJ,
          document: '09748165000131',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa B',
          socialName: 'Outra denominação',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ search: 'alfa beta' });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].socialName).toBe('Instituto Alfa Beta');
  });

  it('should filter by search in document (case-insensitive)', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 7,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 8,
          type: ClientType.PJ,
          document: '33000167000101',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 2',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ search: '33000167' });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].document).toBe('33000167000101');
  });

  it('should return empty when search matches no client', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute({ search: 'Inexistente' });

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should combine search and active filters', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 9,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Tech Solutions',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 10,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Tech Inativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
      ],
    });

    const result = await sut.execute({ search: 'Tech', active: true });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].companyName).toBe('Tech Solutions');
    expect(result.data[0].active).toBe(true);
  });

  it('should filter by active when active is true', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 11,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 12,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 2',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
        {
          id: 13,
          type: ClientType.PJ,
          document: '09748165000132',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 3',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c) => c.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          id: 14,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          id: 15,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 2',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
      ],
    });

    const result = await sut.execute({ active: false });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].active).toBe(false);
  });

  it('should return client data with all fields', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 2,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: '123456789',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa LTDA',
        fantasyName: 'Empresa',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute({});

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual<ClientDto>({
      id: client.id,
      type: ClientType.PJ,
      document: '09748165000110',
      ie: '123456789',
      parentClientId: null,
      isSubClient: false,
      attendanceId: null,
      maintenanceTicketId: null,
      honorific: null,
      group: {
        id: group.id,
        name: group.name,
      },
      resale: {
        id: resale.id,
        name: resale.name,
      },
      companyName: 'Empresa LTDA',
      fantasyName: 'Empresa',
      socialName: null,
      domain: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
      companies: [],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  });
});
