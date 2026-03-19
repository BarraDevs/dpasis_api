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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        ownerId: owner.id,
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

  it('should filter by active when active is true', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa 2',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
        {
          type: ClientType.PJ,
          document: '09748165000132',
          groupId: group.id,
          ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.createMany({
      data: [
        {
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
        {
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: '123456789',
        groupId: group.id,
        ownerId: owner.id,
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
      group: {
        id: group.id,
        name: group.name,
      },
      owner: {
        id: owner.id,
        name: owner.name,
      },
      companyName: 'Empresa LTDA',
      fantasyName: 'Empresa',
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
