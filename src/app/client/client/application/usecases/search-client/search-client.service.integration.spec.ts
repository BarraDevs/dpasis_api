import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { SearchClientInputDto } from 'src/app/client/client/application/usecases/search-client/dtos/search-client.dto';
import { SearchClient } from 'src/app/client/client/application/usecases/search-client/search-client.service';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

describe('SearchClient - Integration tests', () => {
  let sut: SearchClient;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(SearchClient);
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

  it('should return empty when no clients match filter', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `G-${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'X',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const input: SearchClientInputDto = { filter: { id: { eq: 999 } } };
    const result = await sut.execute(input);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all matching rows when page and size are omitted', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `G-${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    await prisma.client.create({
      data: {
        id: 8001,
        type: ClientType.PJ,
        document: '09748165803101',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Todos A',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });
    await prisma.client.create({
      data: {
        id: 8002,
        type: ClientType.PJ,
        document: '09748165803102',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Todos B',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });
    await prisma.client.create({
      data: {
        id: 8003,
        type: ClientType.PJ,
        document: '09748165803103',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Todos C',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const input: SearchClientInputDto = { filter: { active: { eq: true } } };
    const result = await sut.execute(input);

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate search results', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `G-${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    await prisma.client.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        type: ClientType.PJ,
        document: `097481650001${String(i).padStart(2, '0')}`,
        groupId: group.id,
        resaleId: resale.id,
        companyName: `C${i}`,
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      })),
    });

    const input: SearchClientInputDto = { page: 1, size: 2, filter: { active: { eq: true } } };
    const result = await sut.execute(input);

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(3);
  });
});
