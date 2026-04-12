import { Test } from '@nestjs/testing';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDaoAdapterPrisma } from './client-prisma.dao';

describe('ClientDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDaoAdapterPrisma, PrismaService],
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

  async function createClientGroupAndOwner() {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    return { group, owner };
  }

  describe('findAll', () => {
    it('should return empty array when no clients exist', async() => {
      const [clients, total] = await sut.findAll({});

      expect(clients).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return clients saved in clients table with correct format', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
          id: 1,
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

      const [clients, total] = await sut.findAll({});

      expect(clients).toHaveLength(1);
      expect(total).toBe(1);
      expect(clients[0]).toEqual<ClientDto>({
        id: created.id,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: '123456789',
        parentClientId: null,
        isSubClient: false,
        group: {
          id: group.id,
          name: group.name,
        },
        owner: {
          id: owner.id,
          name: owner.name,
        },
        companyName: 'Empresa LTDA',
        companies: [],
        fantasyName: 'Empresa',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(clients[0]).toHaveProperty('createdAt');
      expect(clients[0]).toHaveProperty('updatedAt');
      expect(clients[0].createdAt).toBeInstanceOf(Date);
      expect(clients[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should filter by active when provided', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      await prisma.client.create({
        data: {
          id: 2,
          type: ClientType.PJ,
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Ativa',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 3,
          type: ClientType.PJ,
          document: '09748165000111',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Inativa',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: false,
        },
      });

      const [activeClients, activeTotal] = await sut.findAll({ active: true });
      const [inactiveClients, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeClients).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeClients[0].active).toBe(true);
      expect(inactiveClients).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveClients[0].active).toBe(false);
    });

    it('should filter by search in companyName, fantasyName and document (case-insensitive)', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      await prisma.client.create({
        data: {
          id: 4,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Premium LTDA',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });
      await prisma.client.create({
        data: {
          id: 5,
          type: ClientType.PJ,
          document: '33000167000101',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Outra Empresa',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [byCompanyName] = await sut.findAll({ search: 'premium' });
      const [byDocument] = await sut.findAll({ search: '33000167' });

      expect(byCompanyName).toHaveLength(1);
      expect(byCompanyName[0].companyName).toBe('Empresa Premium LTDA');
      expect(byDocument).toHaveLength(1);
      expect(byDocument[0].document).toBe('33000167000101');
    });

    it('should return empty when search matches no client', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      await prisma.client.create({
        data: {
          id: 6,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Test',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [clients, total] = await sut.findAll({ search: 'Inexistente' });

      expect(clients).toEqual([]);
      expect(total).toBe(0);
    });

    it('should paginate results correctly', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      await prisma.client.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          type: ClientType.PJ,
          document: `097481650001${String(i).padStart(2, '0')}`,
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: `Empresa ${i + 1}`,
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        })),
      });

      const [page1, total] = await sut.findAll({ page: 1, size: 10 });
      const [page2] = await sut.findAll({ page: 2, size: 10 });
      const [page3] = await sut.findAll({ page: 3, size: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
      expect(total).toBe(25);
    });

    it('should return results ordered by createdAt desc', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const first = await prisma.client.create({
        data: {
          id: 7,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Primeiro',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const second = await prisma.client.create({
        data: {
          id: 8,
          type: ClientType.PJ,
          document: '09748165000121',
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Segundo',
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const [clients] = await sut.findAll({});

      expect(clients[0].id).toBe(first.id);
      expect(clients[0].companyName).toBe('Primeiro');
      expect(clients[1].id).toBe(second.id);
      expect(clients[1].companyName).toBe('Segundo');
    });
  });

  describe('findById', () => {
    it('should return null when client does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client by id with correct format', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
          id: 9,
          type: ClientType.PJ,
          document: '09748165000110',
          ie: '123456789',
          groupId: group.id,
          ownerId: owner.id,
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
        group: {
          id: group.id,
          name: group.name,
        },
        owner: {
          id: owner.id,
          name: owner.name,
        },
        companyName: 'Empresa Test',
        fantasyName: 'Fantasia',
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
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
          id: 10,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
          id: 11,
          type: ClientType.PJ,
          document: '09748165000110',
          ie: '123456789',
          groupId: group.id,
          ownerId: owner.id,
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
        companyName: 'Empresa Test',
        group: {
          id: group.id,
          name: group.name,
        },
        owner: {
          id: owner.id,
          name: owner.name,
        },
        companies: [],
        fantasyName: 'Fantasia',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should find client by document (CPF format)', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
          id: 12,
          type: ClientType.PF,
          document: '97456321558',
          groupId: group.id,
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
          id: 13,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const first = await prisma.client.create({
        data: {
          id: 14,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();
      const suffix = String(Date.now()).slice(-4);

      await prisma.client.create({
        data: {
          id: 16,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const parent = await prisma.client.create({
        data: {
          id: 17,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const parent = await prisma.client.create({
        data: {
          id: 18,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
          ownerId: owner.id,
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
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const [parent1, parent2] = await Promise.all([
        prisma.client.create({
          data: {
            id: 21,
            type: ClientType.PJ,
            document: '09748165000110',
            groupId: group.id,
            ownerId: owner.id,
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
            ownerId: owner.id,
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
          ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const parent = await prisma.client.create({
        data: {
          id: 24,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
          ownerId: owner.id,
          companyName: 'Sub-cliente',
          fantasyName: null,
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
        companyName: 'Sub-cliente',
        fantasyName: null,
        headquarters: 'RJ',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        active: true,
        group: { id: group.id, name: group.name },
        owner: { id: owner.id, name: owner.name },
        companies: [],
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      });
    });

    it('should paginate sub-clients correctly', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const parent = await prisma.client.create({
        data: {
          id: 260,
          type: ClientType.PJ,
          document: '19748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
              ownerId: owner.id,
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
      const { group, owner } = await createClientGroupAndOwner();

      const parent = await prisma.client.create({
        data: {
          id: 28,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
            ownerId: owner.id,
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
            ownerId: owner.id,
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

    it('should filter sub-clients by active status', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const parent = await prisma.client.create({
        data: {
          id: 31,
          type: ClientType.PJ,
          document: '09748165000110',
          groupId: group.id,
          ownerId: owner.id,
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
            ownerId: owner.id,
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
            ownerId: owner.id,
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
});
