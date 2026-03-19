import { Test } from '@nestjs/testing';
import { ClientContactDto } from 'src/app/client/client-contact/application/dtos/client-contact.dto';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientContactDaoAdapterPrisma } from './client-contact-prisma.dao';

describe('ClientContactDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientContactDaoAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientContactDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientContactDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner, department] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.clientDepartment.create({ data: { name: `Dept ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
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

  describe('findAll', () => {
    it('should return empty array when no client contacts exist', async() => {
      const [contacts, total] = await sut.findAll({ clientId });

      expect(contacts).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return client contacts with default pagination', async() => {
      await prisma.clientContact.createMany({
        data: [
          { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false },
          { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: true },
        ],
      });

      const [contacts, total] = await sut.findAll({ clientId });

      expect(contacts).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.clientContact.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          clientId,
          departmentId,
          name: `Contact ${i + 1}`,
          email: `contact${i + 1}@example.com`,
          receiveNF: false,
        })),
      });

      const [page1, total] = await sut.findAll({ clientId, page: 1, size: 10 });
      const [page2] = await sut.findAll({ clientId, page: 2, size: 10 });
      const [page3] = await sut.findAll({ clientId, page: 3, size: 10 });

      expect(total).toBe(25);
      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'Ativo', email: 'ativo@example.com', receiveNF: false, active: true },
      });
      await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'Inativo', email: 'inativo@example.com', receiveNF: false, active: false },
      });

      const [activeContacts, activeTotal] = await sut.findAll({ clientId, active: true });
      const [inactiveContacts, inactiveTotal] = await sut.findAll({ clientId, active: false });

      expect(activeContacts).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeContacts[0].active).toBe(true);
      expect(inactiveContacts).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveContacts[0].active).toBe(false);
    });

    it('should search in name and email (case-insensitive)', async() => {
      await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false },
      });
      await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false },
      });

      const [contacts, total] = await sut.findAll({ clientId, search: 'JOAO' });

      expect(contacts).toHaveLength(1);
      expect(total).toBe(1);
      expect(contacts[0].name).toBe('João');
    });

    it('should filter by departmentId', async() => {
      const dept2 = await prisma.clientDepartment.create({
        data: { name: `Dept2 ${Date.now()}`, active: true },
      });
      await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false },
      });
      await prisma.clientContact.create({
        data: { clientId, departmentId: dept2.id, name: 'Maria', email: 'maria@example.com', receiveNF: false },
      });

      const [contacts, total] = await sut.findAll({ clientId, departmentId });

      expect(contacts).toHaveLength(1);
      expect(total).toBe(1);
      expect(contacts[0].name).toBe('João');
      expect(contacts[0].department.id).toBe(departmentId);
    });

    it('should filter by receiveNF', async() => {
      await prisma.clientContact.createMany({
        data: [
          { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: true },
          { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false },
        ],
      });

      const [contacts, total] = await sut.findAll({ clientId, receiveNF: true });

      expect(contacts).toHaveLength(1);
      expect(total).toBe(1);
      expect(contacts[0].receiveNF).toBe(true);
    });

    it('should return results ordered by name asc', async() => {
      const first = await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'B', email: 'b@example.com', receiveNF: false },
      });
      const second = await prisma.clientContact.create({
        data: { clientId, departmentId, name: 'A', email: 'a@example.com', receiveNF: false },
      });

      const [contacts] = await sut.findAll({ clientId });

      expect(contacts[0].id).toBe(second.id);
      expect(contacts[1].id).toBe(first.id);
    });
  });

  describe('findById', () => {
    it('should return null when client contact does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client contact by id', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientContactDto>({
        id: created.id,
        clientId: created.clientId,
        name: created.name,
        department: {
          id: created.departmentId,
          name: expect.any(String),
        },
        email: created.email,
        phone: created.phone,
        whatsapp: created.whatsapp,
        observations: created.observations,
        receiveNF: created.receiveNF,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should return client contact with all fields', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          phone: '11999999999',
          whatsapp: '11988887777',
          observations: 'Observação',
          receiveNF: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('João');
      expect(result?.email).toBe('joao@example.com');
      expect(result?.phone).toBe('11999999999');
      expect(result?.whatsapp).toBe('11988887777');
      expect(result?.observations).toBe('Observação');
      expect(result?.receiveNF).toBe(true);
    });
  });

  describe('findByClientIdAndEmail', () => {
    it('should return null when no contact exists for client and email', async() => {
      const result = await sut.findByClientIdAndEmail(clientId, 'joao@example.com');

      expect(result).toBeNull();
    });

    it('should return contact when it exists for the given clientId and email (lowercase)', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
        },
      });

      const result = await sut.findByClientIdAndEmail(clientId, 'joao@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.email).toBe('joao@example.com');
    });

    it('should find by email case-insensitive (stored lowercase)', async() => {
      const created = await prisma.clientContact.create({
        data: {
          clientId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
        },
      });

      const result = await sut.findByClientIdAndEmail(clientId, 'joao@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });
});
