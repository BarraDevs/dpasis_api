import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientDiscountModule } from 'src/app/client/client-discount/client-discount.module';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDiscountDto } from '../../dtos/client-discount.dto';
import { FindAllClientDiscount } from './find-all-client-discount.service';

describe('FindAllClientDiscount', () => {
  let sut: FindAllClientDiscount;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDiscountModule],
    }).compile();

    sut = module.get(FindAllClientDiscount);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when no discounts exist', async() => {
    const result = await sut.execute({ clientId });

    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('should return paginated discounts when they exist', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto 10%',
        type: DiscountType.PERCENTAGE,
        discountValue: 1000,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute({ clientId });

    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual<ClientDiscountDto>({
      id: created.id,
      clientId,
      description: 'Desconto 10%',
      type: DiscountType.PERCENTAGE,
      discountValue: 1000,
      month: 3,
      year: 2026,
      doNotGenerateCharge: false,
      terminateContract: false,
      active: true,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should return correct pagination structure with page and size', async() => {
    await prisma.clientDiscount.createMany({
      data: [1, 2, 3, 4].map((i) => ({
        clientId,
        description: `Desconto ${i}`,
        type: DiscountType.PERCENTAGE,
        discountValue: i * 100,
        month: i,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      })),
    });

    const result = await sut.execute({ clientId, page: 1, size: 2 });

    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalItems).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should filter by month when provided', async() => {
    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto jan',
        type: DiscountType.PERCENTAGE,
        discountValue: 100,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto mar',
        type: DiscountType.PERCENTAGE,
        discountValue: 200,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute({ clientId, month: 3 });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].month).toBe(3);
    expect(result.data[0].description).toBe('Desconto mar');
  });

  it('should filter by year when provided', async() => {
    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto 2025',
        type: DiscountType.PERCENTAGE,
        discountValue: 100,
        month: 1,
        year: 2025,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto 2026',
        type: DiscountType.PERCENTAGE,
        discountValue: 200,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute({ clientId, year: 2025 });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].year).toBe(2025);
    expect(result.data[0].description).toBe('Desconto 2025');
  });

  it('should filter by month and year combined', async() => {
    await prisma.clientDiscount.createMany({
      data: [
        {
          clientId,
          description: 'Mar 2026',
          type: DiscountType.PERCENTAGE,
          discountValue: 100,
          month: 3,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
        {
          clientId,
          description: 'Mar 2025',
          type: DiscountType.PERCENTAGE,
          discountValue: 200,
          month: 3,
          year: 2025,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
        {
          clientId,
          description: 'Jan 2026',
          type: DiscountType.PERCENTAGE,
          discountValue: 300,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ clientId, month: 3, year: 2026 });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].month).toBe(3);
    expect(result.data[0].year).toBe(2026);
    expect(result.data[0].description).toBe('Mar 2026');
  });

  it('should search in description (case-insensitive)', async() => {
    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto Especial de Natal',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 12,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto padrão',
        type: DiscountType.PERCENTAGE,
        discountValue: 100,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute({ clientId, search: 'natal' });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].description).toBe('Desconto Especial de Natal');
  });

  it('should return only discounts for the given clientId', async() => {
    const [group2, resale2, company2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo Outro ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const otherClient = await prisma.client.create({
      data: {
        id: 2,
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group2.id,
        resaleId: resale2.id,
        companyId: company2.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'Rio',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto meu cliente',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await prisma.clientDiscount.create({
      data: {
        clientId: otherClient.id,
        description: 'Desconto outro cliente',
        type: DiscountType.PERCENTAGE,
        discountValue: 300,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute({ clientId });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].description).toBe('Desconto meu cliente');
  });

  it('should order by year asc, month asc, id asc', async() => {
    const first = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Primeiro',
        type: DiscountType.PERCENTAGE,
        discountValue: 100,
        month: 1,
        year: 2025,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const second = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Segundo',
        type: DiscountType.PERCENTAGE,
        discountValue: 200,
        month: 6,
        year: 2025,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const third = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Terceiro',
        type: DiscountType.PERCENTAGE,
        discountValue: 300,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute({ clientId });

    expect(result.data[0].id).toBe(first.id);
    expect(result.data[1].id).toBe(second.id);
    expect(result.data[2].id).toBe(third.id);
  });
});
