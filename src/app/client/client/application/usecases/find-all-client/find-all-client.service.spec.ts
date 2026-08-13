import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { ClientDto } from '../../dtos/client.dto';
import { FindAllClientQueryDto } from './dtos/find-all-client.dto';
import { FindAllClient } from './find-all-client.service';

function makeFindAllQuery(overrides: Partial<FindAllClientQueryDto> = {}): FindAllClientQueryDto {
  return {
    page: 1,
    size: 10,
    ...overrides,
  } as FindAllClientQueryDto;
}

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

  async function createClientGroupAndResale() {
    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}-${Math.random().toString(36).slice(2)}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);
    return { group, resale, company };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('pagination', () => {
    it('should return a slice of rows ordered by id ascending', async() => {
      // Arrange
      const { group, resale, company } = await createClientGroupAndResale();
      const baseId = 41_000;
      for (let i = 0; i < 5; i += 1) {
        await prisma.client.create({
          data: {
            id: baseId + i,
            type: ClientType.PJ,
            document: `${baseId + i}`.padStart(14, '0'),
            groupId: group.id,
            resaleId: resale.id,
            companyId: company.id,
            companyName: `Pag ${i}`,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        });
      }

      // Act
      const page1 = await sut.execute(makeFindAllQuery({ page: 1, size: 2 }));
      const page2 = await sut.execute(makeFindAllQuery({ page: 2, size: 2 }));
      const page3 = await sut.execute(makeFindAllQuery({ page: 3, size: 2 }));

      // Assert
      expect(page1.totalItems).toBe(5);
      expect(page1.totalPages).toBe(3);
      expect(page1.data.map((r) => r.id)).toEqual([baseId, baseId + 1]);
      expect(page2.data.map((r) => r.id)).toEqual([baseId + 2, baseId + 3]);
      expect(page3.data.map((r) => r.id)).toEqual([baseId + 4]);
    });

    it('should use Pagination defaults when page and size are omitted', async() => {
      // Arrange
      const { group, resale, company } = await createClientGroupAndResale();
      const baseId = 42_000;
      for (let i = 0; i < 3; i += 1) {
        await prisma.client.create({
          data: {
            id: baseId + i,
            type: ClientType.PJ,
            document: `D${baseId + i}`.padStart(14, '0'),
            groupId: group.id,
            resaleId: resale.id,
            companyId: company.id,
            companyName: `All ${i}`,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        });
      }

      const queries = makeFindAllQuery();
      delete (queries as Partial<FindAllClientQueryDto>).page;
      delete (queries as Partial<FindAllClientQueryDto>).size;

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(3);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(3);
      expect(result.data.map((r) => r.id)).toEqual([baseId, baseId + 1, baseId + 2]);
    });

    it('should return empty data with totalItems 0 when no client exists', async() => {
      // Act
      const result = await sut.execute(makeFindAllQuery({ page: 1, size: 20 }));

      // Assert
      expect(result).toEqual<IPagination<ClientDto>>({
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0,
        data: [],
      });
    });

    it.each([
      { totalRows: 25, size: 10, expectedPages: 3 },
      { totalRows: 24, size: 10, expectedPages: 3 },
      { totalRows: 20, size: 10, expectedPages: 2 },
      { totalRows: 1, size: 10, expectedPages: 1 },
    ])('should expose totalPages $expectedPages for $totalRows row(s) with size $size', async({ totalRows, size, expectedPages }) => {
      // Arrange
      const { group, resale, company } = await createClientGroupAndResale();
      const baseId = 50_000 + totalRows;
      for (let i = 0; i < totalRows; i += 1) {
        await prisma.client.create({
          data: {
            id: baseId + i,
            type: ClientType.PJ,
            document: `R${baseId + i}`.padStart(14, '0'),
            groupId: group.id,
            resaleId: resale.id,
            companyId: company.id,
            companyName: `Row ${i}`,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        });
      }

      // Act
      const result = await sut.execute(makeFindAllQuery({ page: 1, size }));

      // Assert
      expect(result.totalItems).toBe(totalRows);
      expect(result.totalPages).toBe(expectedPages);
    });

    it('should paginate within a filtered subset', async() => {
      // Arrange
      const { group, resale, company } = await createClientGroupAndResale();
      const baseId = 43_000;
      for (let i = 0; i < 5; i += 1) {
        await prisma.client.create({
          data: {
            id: baseId + i,
            type: ClientType.PJ,
            document: `F${baseId + i}`.padStart(14, '0'),
            groupId: group.id,
            resaleId: resale.id,
            companyId: company.id,
            companyName: i < 3 ? 'Match Filter Co' : 'Other Name',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        });
      }

      // Act
      const page1 = await sut.execute(makeFindAllQuery({ page: 1, size: 2, companyName: 'Match' }));
      const page2 = await sut.execute(makeFindAllQuery({ page: 2, size: 2, companyName: 'Match' }));

      // Assert
      expect(page1.totalItems).toBe(3);
      expect(page1.totalPages).toBe(2);
      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(1);
      expect(page1.data.every((r) => r.companyName?.includes('Match'))).toBe(true);
      expect(page2.data.every((r) => r.companyName?.includes('Match'))).toBe(true);
    });
  });

  describe('filters — isolated', () => {
    it('should filter by companyName (case-insensitive, partial)', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_001,
          type: ClientType.PJ,
          document: '60100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Zebra Alpha Indústria',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_002,
          type: ClientType.PJ,
          document: '60200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Beta Sem Relação',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ companyName: 'alpha' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_001);
    });

    it('should filter by fantasyName', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_101,
          type: ClientType.PJ,
          document: '61100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'A',
          fantasyName: 'Nome Fantasia Delta',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_102,
          type: ClientType.PJ,
          document: '61200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'B',
          fantasyName: 'Outro',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ fantasyName: 'delta' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_101);
    });

    it('should filter by socialName', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_201,
          type: ClientType.PJ,
          document: '62100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'C',
          socialName: 'Social Ômega',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_202,
          type: ClientType.PJ,
          document: '62200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'D',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ socialName: 'ômega' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_201);
    });

    it('should filter by document (partial)', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_301,
          type: ClientType.PJ,
          document: '11.222.333/0001-99',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'E',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_302,
          type: ClientType.PJ,
          document: '99888777666555',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'F',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ document: '222.333' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_301);
    });

    it('should filter by headquarters', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_401,
          type: ClientType.PJ,
          document: '64100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'G',
          headquarters: 'Matriz SÃO PAULO Centro',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_402,
          type: ClientType.PJ,
          document: '64200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'H',
          headquarters: 'Filial Rio',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ headquarters: 'são paulo' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_401);
    });

    it('should filter by domain', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_501,
          type: ClientType.PJ,
          document: '65100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'I',
          domain: 'Cliente.EXEMPLO.org',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_502,
          type: ClientType.PJ,
          document: '65200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'J',
          domain: 'outro.com',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ domain: 'exemplo' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_501);
    });

    it('should filter by ie', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_601,
          type: ClientType.PJ,
          document: '66100000000001',
          ie: 'IE-ESP-2024',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'K',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_602,
          type: ClientType.PJ,
          document: '66200000000002',
          ie: '999',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'L',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ ie: 'esp-20' }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_601);
    });

    it('should filter by active', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 60_701,
          type: ClientType.PJ,
          document: '67100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Ativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 60_702,
          type: ClientType.PJ,
          document: '67200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Inativo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
      });

      const result = await sut.execute(makeFindAllQuery({ active: false }));

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(60_702);
    });
  });

  describe('filters — combinations (AND)', () => {
    it('should require both companyName and fantasyName to match', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 61_001,
          type: ClientType.PJ,
          document: '68100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Combo Alfa Ltda',
          fantasyName: 'Marca Gamma',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 61_002,
          type: ClientType.PJ,
          document: '68200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Combo Alfa Outro',
          fantasyName: 'Marca Delta',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(
        makeFindAllQuery({ companyName: 'Combo Alfa', fantasyName: 'Marca Gamma' }),
      );

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(61_001);
    });

    it('should combine document, ie, and domain', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 61_101,
          type: ClientType.PJ,
          document: '99.888.777/0001-11',
          ie: 'SP-IE-555',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'M',
          domain: 'unico.dev.br',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 61_102,
          type: ClientType.PJ,
          document: '99.888.777/0001-22',
          ie: 'RJ-IE-555',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'N',
          domain: 'unico.dev.br',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(
        makeFindAllQuery({ document: '888.777', ie: 'SP-IE', domain: 'unico' }),
      );

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(61_101);
    });

    it('should combine socialName, headquarters, and active', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 61_201,
          type: ClientType.PJ,
          document: '69100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'O',
          socialName: 'Sol Nascente',
          headquarters: 'Filial Norte Especial',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 61_202,
          type: ClientType.PJ,
          document: '69200000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'P',
          socialName: 'Sol Nascente',
          headquarters: 'Filial Sul',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 61_203,
          type: ClientType.PJ,
          document: '69300000000003',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Q',
          socialName: 'Sol Nascente',
          headquarters: 'Filial Norte Especial',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
      });

      const result = await sut.execute(
        makeFindAllQuery({
          socialName: 'nascente',
          headquarters: 'Norte Especial',
          active: true,
        }),
      );

      expect(result.totalItems).toBe(1);
      expect(result.data[0]?.id).toBe(61_201);
    });

    it('should apply every filter plus pagination at once', async() => {
      const { group, resale, company } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 62_001,
          type: ClientType.PJ,
          document: '70100000000001',
          ie: 'FULL-1',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Full Match Alpha',
          fantasyName: 'Fant Full',
          socialName: 'Soc Full',
          domain: 'full-match.example',
          headquarters: 'HQ Full SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 62_002,
          type: ClientType.PJ,
          document: '70200000000002',
          ie: 'FULL-1',
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Full Match Alpha',
          fantasyName: 'Fant Full',
          socialName: 'Soc Full',
          domain: 'full-match.example',
          headquarters: 'HQ Full RJ',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.execute(
        makeFindAllQuery({
          page: 1,
          size: 1,
          companyName: 'Full Match',
          fantasyName: 'Fant Full',
          socialName: 'Soc Full',
          document: '70100000000001',
          headquarters: 'HQ Full SP',
          domain: 'full-match',
          ie: 'FULL-1',
          active: true,
        }),
      );

      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe(62_001);
    });
  });
});
