import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { FindAllClientQueryDto } from 'src/app/client/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { SearchClientInputDto } from 'src/app/client/client/application/usecases/search-client/dtos/search-client.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaFilterCompilerService } from 'src/infra/database/prisma/filter-compiler/prisma-filter-compiler.service';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDaoAdapterPrisma } from './client-prisma.dao';

describe('ClientDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDaoAdapterPrisma, PrismaService, PrismaFilterCompilerService],
    }).compile();

    sut = module.get(ClientDaoAdapterPrisma);
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
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    return { group, resale };
  }

  describe('findAll', () => {
    function makeQuery(overrides: Partial<FindAllClientQueryDto> = {}): FindAllClientQueryDto {
      return {
        page: 1,
        size: 10,
        ...overrides,
      } as FindAllClientQueryDto;
    }

    it('should return no rows and count 0 when table is empty', async() => {
      const [rows, total] = await sut.findAll(makeQuery({ page: 1, size: 10 }));

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should apply pagination with stable ascending id order', async() => {
      const { group, resale } = await createClientGroupAndResale();
      const baseId = 70_000;
      for (let i = 0; i < 4; i += 1) {
        await prisma.client.create({
          data: {
            id: baseId + i,
            type: ClientType.PJ,
            document: `D${baseId + i}`.padStart(14, '0'),
            groupId: group.id,
            resaleId: resale.id,
            companyName: `Dao Pag ${i}`,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        });
      }

      const [page1, t1] = await sut.findAll(makeQuery({ page: 1, size: 2 }));
      const [page2, t2] = await sut.findAll(makeQuery({ page: 2, size: 2 }));

      expect(t1).toBe(4);
      expect(t2).toBe(4);
      expect(page1.map((r) => r.id)).toEqual([baseId, baseId + 1]);
      expect(page2.map((r) => r.id)).toEqual([baseId + 2, baseId + 3]);
    });

    it('should filter by companyName (contains, case-insensitive)', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_100,
          type: ClientType.PJ,
          document: '70100000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Zebra DAO Alpha',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_101,
          type: ClientType.PJ,
          document: '70101000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Outro Nome',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ companyName: 'dao alpha' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_100);
      expect(rows[0]?.companyName).toBe('Zebra DAO Alpha');
    });

    it('should filter by fantasyName', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_200,
          type: ClientType.PJ,
          document: '70200000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'A',
          fantasyName: 'Fantasia Gama Especial',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_201,
          type: ClientType.PJ,
          document: '70201000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'B',
          fantasyName: 'Outra',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ fantasyName: 'gama' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_200);
    });

    it('should filter by socialName', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_300,
          type: ClientType.PJ,
          document: '70300000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'C',
          socialName: 'Social Ômega Plus',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_301,
          type: ClientType.PJ,
          document: '70301000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'D',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ socialName: 'ômega' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_300);
    });

    it('should filter by document (partial)', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_400,
          type: ClientType.PJ,
          document: '12.444.555/0001-88',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'E',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_401,
          type: ClientType.PJ,
          document: '99887766554433',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'F',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ document: '444.555' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_400);
    });

    it('should filter by headquarters', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_500,
          type: ClientType.PJ,
          document: '70500000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'G',
          headquarters: 'Sede MATRIZ Paulista',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_501,
          type: ClientType.PJ,
          document: '70501000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'H',
          headquarters: 'Filial RJ',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ headquarters: 'matriz' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_500);
    });

    it('should filter by domain', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_600,
          type: ClientType.PJ,
          document: '70600000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'I',
          domain: 'cliente.DAO-TEST.app',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_601,
          type: ClientType.PJ,
          document: '70601000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'J',
          domain: 'outro.com',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ domain: 'dao-test' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_600);
    });

    it('should filter by ie', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_700,
          type: ClientType.PJ,
          document: '70700000000001',
          ie: 'IE-DAO-999-x',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'K',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_701,
          type: ClientType.PJ,
          document: '70701000000002',
          ie: '000',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'L',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ ie: 'dao-999' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_700);
    });

    it('should filter by active', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_800,
          type: ClientType.PJ,
          document: '70800000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Ativo Dao',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_801,
          type: ClientType.PJ,
          document: '70801000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Inativo Dao',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ active: false }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_801);
      expect(rows[0]?.active).toBe(false);
    });

    it('should AND-combine companyName and domain', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_900,
          type: ClientType.PJ,
          document: '70900000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Mix Alfa Ltda',
          domain: 'alfa.cobinar.br',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 70_901,
          type: ClientType.PJ,
          document: '70901000000002',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Mix Alfa Outro',
          domain: 'delta.cobinar.br',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(
        makeQuery({ companyName: 'Mix Alfa', domain: 'alfa.' }),
      );

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_900);
    });

    it('should not add companyName condition when value is only whitespace', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 70_910,
          type: ClientType.PJ,
          document: '70910000000001',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Whitespace Dao',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll(makeQuery({ companyName: '   ' }));

      expect(total).toBe(1);
      expect(rows[0]?.id).toBe(70_910);
    });
  });

  describe('findById', () => {
    it('should return null when client does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client by id with correct format', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const created = await prisma.client.create({
        data: {
          id: 9,
          type: ClientType.PJ,
          document: '09748165000110',
          ie: '123456789',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Test',
          fantasyName: 'Fantasia',
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientDto>({
        id: created.id,
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
        companyName: 'Empresa Test',
        fantasyName: 'Fantasia',
        socialName: null,
        domain: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        companies: [],
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should verify record is in clients table', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const created = await prisma.client.create({
        data: {
          id: 10,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      const inDb = await prisma.client.findUnique({ where: { id: created.id } });
      expect(inDb).not.toBeNull();
      expect(result?.id).toBe(inDb?.id);
      expect(result?.document).toBe(inDb?.document);
      expect(result?.companyName).toBe(inDb?.companyName);
    });
  });

  describe('findByDocument', () => {
    it('should return null when client with document does not exist', async() => {
      const result = await sut.findByDocument('09748165000110');

      expect(result).toBeNull();
    });

    it('should return client by document with correct format', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const created = await prisma.client.create({
        data: {
          id: 11,
          type: ClientType.PJ,
          document: '09748165000110',
          ie: '123456789',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Test',
          fantasyName: 'Fantasia',
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.findByDocument('09748165000110');

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientDto>({
        id: created.id,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: '123456789',
        parentClientId: null,
        isSubClient: false,
        attendanceId: null,
        maintenanceTicketId: null,
        honorific: null,
        companyName: 'Empresa Test',
        group: {
          id: group.id,
          name: group.name,
        },
        resale: {
          id: resale.id,
          name: resale.name,
        },
        companies: [],
        fantasyName: 'Fantasia',
        socialName: null,
        domain: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should find client by document (CPF format)', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const created = await prisma.client.create({
        data: {
          id: 12,
          type: ClientType.PF,
          document: '97456321558',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Pessoa Física',
          headquarters: 'Rio de Janeiro',
          invoiceType: ClientInvoiceType.INDIVIDUAL,
          generateInvoice: false,
          active: true,
        },
      });

      const result = await sut.findByDocument('97456321558');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.document).toBe('97456321558');
      expect(result?.type).toBe(ClientType.PF);
    });

    it('should verify record is in clients table', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const created = await prisma.client.create({
        data: {
          id: 13,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.findByDocument('09748165000110');

      const inDb = await prisma.client.findUnique({ where: { id: created.id } });
      expect(inDb).not.toBeNull();
      expect(result?.id).toBe(inDb?.id);
      expect(result?.document).toBe(inDb?.document);
    });
  });

  describe('findMaxId', () => {
    it('should return 0 when no clients exist', async() => {
      const result = await sut.findMaxId();

      expect(result).toBe(0);
    });

    it('should return the highest id among clients', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const first = await prisma.client.create({
        data: {
          id: 14,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Primeira',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const second = await prisma.client.create({
        data: {
          id: 15,
          type: ClientType.PJ,
          document: '09748165000199',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Segunda',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      expect(second.id).toBeGreaterThan(first.id);

      const result = await sut.findMaxId();

      expect(result).toBe(second.id);
    });

    it('should return explicit id when it is greater than other rows', async() => {
      const { group, resale } = await createClientGroupAndResale();
      const suffix = String(Date.now()).slice(-4);

      await prisma.client.create({
        data: {
          id: 16,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Auto',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const explicitId = 48_000;
      await prisma.client.create({
        data: {
          id: explicitId,
          type: ClientType.PJ,
          document: `09.748.165/0001-${suffix}`,
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Id explícito',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const result = await sut.findMaxId();

      expect(result).toBe(explicitId);
    });
  });

  describe('findSubClients', () => {
    it('should return empty array and zero count when client has no sub-clients', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 17,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [result, total] = await sut.findSubClients(parent.id, {});

      expect(result).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return empty array and zero count when client id does not exist', async() => {
      const [result, total] = await sut.findSubClients(99999, {});

      expect(result).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return sub-clients ordered by id', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 18,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const child1 = await prisma.client.create({
        data: {
          id: 19,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sub-cliente 1',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      });

      const child2 = await prisma.client.create({
        data: {
          id: 20,
          type: ClientType.PF,
          document: '97456321558',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sub-cliente 2',
          headquarters: 'RJ',
          invoiceType: ClientInvoiceType.INDIVIDUAL,
          generateInvoice: false,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      });

      const [result, total] = await sut.findSubClients(parent.id, {});

      expect(result).toHaveLength(2);
      expect(total).toBe(2);
      expect(result[0].id).toBe(child1.id);
      expect(result[1].id).toBe(child2.id);
      expect(result[0].parentClientId).toBe(parent.id);
      expect(result[1].parentClientId).toBe(parent.id);
      expect(result[0].isSubClient).toBe(true);
      expect(result[1].isSubClient).toBe(true);
    });

    it('should not return sub-clients of a different parent', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const [parent1, parent2] = await Promise.all([
        prisma.client.create({
          data: {
            id: 21,
            type: ClientType.PJ,
            document: '09748165000110',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Empresa Pai 1',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        }),
        prisma.client.create({
          data: {
            id: 22,
            type: ClientType.PJ,
            document: '09748165000121',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Empresa Pai 2',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        }),
      ]);

      await prisma.client.create({
        data: {
          id: 23,
          type: ClientType.PF,
          document: '97456321558',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sub-cliente do Pai 2',
          headquarters: 'RJ',
          invoiceType: ClientInvoiceType.INDIVIDUAL,
          generateInvoice: false,
          active: true,
          parentClientId: parent2.id,
          isSubClient: true,
        },
      });

      const [result, total] = await sut.findSubClients(parent1.id, {});

      expect(result).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return sub-clients with full ClientDto format', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 24,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const child = await prisma.client.create({
        data: {
          id: 25,
          type: ClientType.PF,
          document: '97456321558',
          ie: null,
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sub-cliente',
          fantasyName: null,
          socialName: null,
          headquarters: 'RJ',
          invoiceType: ClientInvoiceType.INDIVIDUAL,
          generateInvoice: false,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      });

      const [result, total] = await sut.findSubClients(parent.id, {});

      expect(result).toHaveLength(1);
      expect(total).toBe(1);
      expect(result[0]).toEqual<ClientDto>({
        id: child.id,
        type: ClientType.PF,
        document: '97456321558',
        ie: null,
        parentClientId: parent.id,
        isSubClient: true,
        attendanceId: null,
        maintenanceTicketId: null,
        honorific: null,
        companyName: 'Sub-cliente',
        fantasyName: null,
        socialName: null,
        domain: null,
        headquarters: 'RJ',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        active: true,
        group: { id: group.id, name: group.name },
        resale: { id: resale.id, name: resale.name },
        companies: [],
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      });
    });

    it('should paginate sub-clients correctly', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 260,
          type: ClientType.PJ,
          document: '19748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          prisma.client.create({
            data: {
              id: i,
              type: ClientType.PJ,
              document: `097481650001${String(i).padStart(2, '0')}`,
              groupId: group.id,
              resaleId: resale.id,
              companyName: `Sub-cliente ${i + 1}`,
              headquarters: 'SP',
              invoiceType: ClientInvoiceType.CONTRACT,
              generateInvoice: true,
              active: true,
              parentClientId: parent.id,
              isSubClient: true,
            },
          }),
        ),
      );

      const [page1, total] = await sut.findSubClients(parent.id, { page: 1, size: 10 });
      const [page2] = await sut.findSubClients(parent.id, { page: 2, size: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);
      expect(total).toBe(15);
    });

    it('should filter sub-clients by search', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 28,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await Promise.all([
        prisma.client.create({
          data: {
            id: 29,
            type: ClientType.PJ,
            document: '09748165000121',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sub Premium',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
        prisma.client.create({
          data: {
            id: 30,
            type: ClientType.PJ,
            document: '09748165000132',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sub Básica',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
      ]);

      const [result, total] = await sut.findSubClients(parent.id, { search: 'premium' });

      expect(result).toHaveLength(1);
      expect(total).toBe(1);
      expect(result[0].companyName).toBe('Sub Premium');
    });

    it('should filter sub-clients by search in domain (case-insensitive)', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 970,
          type: ClientType.PJ,
          document: '09748165997010',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await prisma.client.create({
        data: {
          id: 971,
          type: ClientType.PJ,
          document: '09748165997101',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sub Genérico',
          domain: 'sub.APP-teste.dev',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 972,
          type: ClientType.PJ,
          document: '09748165997201',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sub Outro',
          domain: null,
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
          parentClientId: parent.id,
          isSubClient: true,
        },
      });

      const [matched, total] = await sut.findSubClients(parent.id, { search: 'app-teste' });

      expect(matched).toHaveLength(1);
      expect(total).toBe(1);
      expect(matched[0].domain).toBe('sub.APP-teste.dev');
      expect(matched[0].id).toBe(971);

      const [byUppercase] = await sut.findSubClients(parent.id, { search: 'APP-TESTE' });
      expect(byUppercase).toHaveLength(1);
      expect(byUppercase[0].id).toBe(971);
    });

    it('should filter sub-clients by active status', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 31,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa Pai',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await Promise.all([
        prisma.client.create({
          data: {
            id: 32,
            type: ClientType.PJ,
            document: '09748165000121',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sub Ativo',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
        prisma.client.create({
          data: {
            id: 33,
            type: ClientType.PJ,
            document: '09748165000132',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sub Inativo',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: false,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
      ]);

      const [active, activeTotal] = await sut.findSubClients(parent.id, { active: true });
      const [inactive, inactiveTotal] = await sut.findSubClients(parent.id, { active: false });

      expect(active).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(active[0].active).toBe(true);
      expect(inactive).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactive[0].active).toBe(false);
    });
  });

  describe('countSubClients', () => {
    it('should return 0 when client has no sub-clients', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const row = await prisma.client.create({
        data: {
          id: 701,
          type: ClientType.PJ,
          document: '09748165000177',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sem filhos',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const count = await sut.countSubClients(row.id);

      expect(count).toBe(0);
    });

    it('should return number of clients with parentClientId matching', async() => {
      const { group, resale } = await createClientGroupAndResale();

      const parent = await prisma.client.create({
        data: {
          id: 702,
          type: ClientType.PJ,
          document: '09748165000188',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Pai para contagem',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await Promise.all([
        prisma.client.create({
          data: {
            id: 703,
            type: ClientType.PJ,
            document: '09748165000199',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sub Um',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
        prisma.client.create({
          data: {
            id: 704,
            type: ClientType.PJ,
            document: '09748165000200',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sub Dois',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            parentClientId: parent.id,
            isSubClient: true,
          },
        }),
      ]);

      const count = await sut.countSubClients(parent.id);

      expect(count).toBe(2);
    });
  });

  describe('search', () => {
    it('should return all clients when filter is empty', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 9001,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Busca Vazia',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const input: SearchClientInputDto = { filter: {} };
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe(9001);
    });

    it('should filter by groupId in and active eq (AND)', async() => {
      const { group, resale } = await createClientGroupAndResale();
      const g2 = await prisma.clientGroup.create({ data: { name: `G2-${Date.now()}`, active: true } });
      await prisma.client.createMany({
        data: [
          {
            id: 9101,
            type: ClientType.PJ,
            document: '09748165000111',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'A',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
          {
            id: 9102,
            type: ClientType.PJ,
            document: '09748165000112',
            groupId: g2.id,
            resaleId: resale.id,
            companyName: 'B',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: false,
          },
        ],
      });

      const input: SearchClientInputDto = { filter: { groupId: { in: [group.id] }, active: { eq: true } } };
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients[0].id).toBe(9101);
    });

    it('should filter fantasyName isNull', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.createMany({
        data: [
          {
            id: 9201,
            type: ClientType.PJ,
            document: '09748165000120',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Sem fantasia',
            fantasyName: null,
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
          {
            id: 9202,
            type: ClientType.PJ,
            document: '09748165000121',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Com fantasia',
            fantasyName: 'Fan',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        ],
      });

      const input: SearchClientInputDto = { filter: { fantasyName: { isNull: true } } };
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients[0].id).toBe(9201);
    });

    it('should filter companyName contains case-insensitive', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.createMany({
        data: [
          {
            id: 9301,
            type: ClientType.PJ,
            document: '09748165000130',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'ACME Brasil',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
          {
            id: 9302,
            type: ClientType.PJ,
            document: '09748165000131',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Outra',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        ],
      });

      const input: SearchClientInputDto = { filter: { companyName: { contains: 'acme' } } };
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients[0].id).toBe(9301);
    });

    it('should return all clients when filter is omitted', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.create({
        data: {
          id: 9355,
          type: ClientType.PJ,
          document: '09748165803552',
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Sem filtro objeto',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const input: SearchClientInputDto = {};
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients[0].id).toBe(9355);
    });

    it('should order clients by id ascending', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.createMany({
        data: [
          {
            id: 9512,
            type: ClientType.PJ,
            document: '09748165805121',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Ordem B',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
          {
            id: 9511,
            type: ClientType.PJ,
            document: '09748165805112',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Ordem A',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        ],
      });

      const input: SearchClientInputDto = { filter: { active: { eq: true } } };
      const [clients] = await sut.search(input);

      expect(clients).toHaveLength(2);
      expect(clients[0].id).toBe(9511);
      expect(clients[1].id).toBe(9512);
    });

    it('should filter by createdAt gte', async() => {
      const { group, resale } = await createClientGroupAndResale();
      const oldDate = new Date('2026-01-05T12:00:00.000Z');
      const newDate = new Date('2026-06-01T12:00:00.000Z');
      await prisma.client.createMany({
        data: [
          {
            id: 9620,
            type: ClientType.PJ,
            document: '09748165806207',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Cliente velho',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            createdAt: oldDate,
          },
          {
            id: 9621,
            type: ClientType.PJ,
            document: '09748165806218',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Cliente novo',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
            createdAt: newDate,
          },
        ],
      });

      const input: SearchClientInputDto = {
        filter: { createdAt: { gte: '2026-05-15T00:00:00.000Z' } },
      };
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients[0].id).toBe(9621);
      expect(clients[0].companyName).toBe('Cliente novo');
    });

    it('should filter by document eq', async() => {
      const { group, resale } = await createClientGroupAndResale();
      await prisma.client.createMany({
        data: [
          {
            id: 9740,
            type: ClientType.PJ,
            document: '09748165807406',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Alfa Docs',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
          {
            id: 9741,
            type: ClientType.PJ,
            document: '09748165807417',
            groupId: group.id,
            resaleId: resale.id,
            companyName: 'Beta Docs',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        ],
      });

      const input: SearchClientInputDto = { filter: { document: { eq: '09748165807417' } } };
      const [clients, total] = await sut.search(input);

      expect(total).toBe(1);
      expect(clients[0].id).toBe(9741);
      expect(clients[0].document).toBe('09748165807417');
    });
  });
});

