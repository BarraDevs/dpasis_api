import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientContactFactory } from 'src/app/client/client-contact/domain/factories/client-contact.factory';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientContactRepositoryAdapterPrisma } from './client-contact-prisma.repository';

describe('ClientContactRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientContactRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientContactRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientContactRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale, department] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.clientDepartment.create({ data: { name: `Dept ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
    departmentId = department.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should create client contact and return id', async() => {
      const entity = ClientContactFactory.create({
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        phone: null,
        whatsapp: null,
        observations: null,
        receiveNF: false,
      });

      const id = await sut.save(entity);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientContact.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('João');
      expect(saved?.email).toBe('joao@example.com');
    });

    it('should store email in lowercase', async() => {
      const entity = ClientContactFactory.create({
        clientId,
        departmentId,
        name: 'João',
        email: 'Joao@Example.COM',
        phone: null,
        whatsapp: null,
        observations: null,
        receiveNF: false,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientContact.findUnique({ where: { id } });
      expect(saved?.email).toBe('joao@example.com');
    });

    it('should store phone and whatsapp', async() => {
      const entity = ClientContactFactory.create({
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        phone: '11999999999',
        whatsapp: '11988887777',
        observations: null,
        receiveNF: false,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientContact.findUnique({ where: { id } });
      expect(saved?.phone).toBe('11999999999');
      expect(saved?.whatsapp).toBe('11988887777');
    });
  });

  describe('findById', () => {
    it('should return null when client contact does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return ClientContact entity by id', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props.id).toBe(created.id);
      expect(result?.props.name).toBe('João');
      expect(result?.props.email).toBe('joao@example.com');
    });
  });

  describe('edit', () => {
    it('should update client contact', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
          active: true,
        },
      });

      const existing = await sut.findById(created.id)!;
      const updated = ClientContactFactory.edit(existing!, {
        departmentId,
        name: 'João Silva',
        email: 'joao.silva@example.com',
        phone: null,
        whatsapp: null,
        observations: null,
        receiveNF: true,
      });

      await sut.edit(updated);

      const saved = await prisma.clientContact.findUnique({ where: { id: created.id } });
      expect(saved?.name).toBe('João Silva');
      expect(saved?.email).toBe('joao.silva@example.com');
      expect(saved?.receiveNF).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client contact from database', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
          active: true,
        },
      });

      await sut.delete(created.id);

      const deleted = await prisma.clientContact.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
