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
        groupId: group.id,
        ownerId: owner.id,
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

    it('should paginate results correctly', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      await prisma.client.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
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
      expect(result).toEqual({
        id: created.id,
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
        companies: [],
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should verify record is in clients table', async() => {
      const { group, owner } = await createClientGroupAndOwner();

      const created = await prisma.client.create({
        data: {
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
      expect(result).toEqual({
        id: created.id,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: '123456789',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
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
});
