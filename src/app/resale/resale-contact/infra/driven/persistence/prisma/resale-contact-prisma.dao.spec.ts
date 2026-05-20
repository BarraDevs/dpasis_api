import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ResaleContactDto } from 'src/app/resale/resale-contact/application/dtos/resale-contact.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleContactDaoAdapterPrisma } from './resale-contact-prisma.dao';

describe('ResaleContactDaoAdapterPrisma - Integration tests', () => {
  let sut: ResaleContactDaoAdapterPrisma;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ResaleContactDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ResaleContactDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.department.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });

    resaleId = resale.id;
    departmentId = department.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no client contacts exist', async() => {
      const [contacts, total] = await sut.findAll({ resaleId });

      expect(contacts).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return client contacts with default pagination', async() => {
      await prisma.resaleContact.createMany({
        data: [
          { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
          { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: true, active: true },
        ],
      });

      const [contacts, total] = await sut.findAll({ resaleId });

      expect(contacts).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.resaleContact.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          resaleId,
          departmentId,
          name: `Contact ${i + 1}`,
          email: `contact${i + 1}@example.com`,
          receiveNF: false,
          active: true,
        })),
      });

      const [page1, total] = await sut.findAll({ resaleId, page: 1, size: 10 });
      const [page2] = await sut.findAll({ resaleId, page: 2, size: 10 });
      const [page3] = await sut.findAll({ resaleId, page: 3, size: 10 });

      expect(total).toBe(25);
      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
    });

    it('should filter by active when provided', async() => {
      await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'Ativo', email: 'ativo@example.com', receiveNF: false, active: true },
      });
      await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'Inativo', email: 'inativo@example.com', receiveNF: false, active: false },
      });

      const [activeContacts, activeTotal] = await sut.findAll({ resaleId, active: true });
      const [inactiveContacts, inactiveTotal] = await sut.findAll({ resaleId, active: false });

      expect(activeContacts).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeContacts[0].active).toBe(true);
      expect(inactiveContacts).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveContacts[0].active).toBe(false);
    });

    it('should search in name and email (case-insensitive)', async() => {
      await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
      });
      await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: true },
      });

      const [contacts, total] = await sut.findAll({ resaleId, search: 'JOAO' });

      expect(contacts).toHaveLength(1);
      expect(total).toBe(1);
      expect(contacts[0].name).toBe('João');
    });

    it('should filter by departmentId', async() => {
      const dept2 = await prisma.department.create({
        data: { name: `Dept2 ${Date.now()}`, active: true },
      });
      await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
      });
      await prisma.resaleContact.create({
        data: { resaleId, departmentId: dept2.id, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: true },
      });

      const [contacts, total] = await sut.findAll({ resaleId, departmentId });

      expect(contacts).toHaveLength(1);
      expect(total).toBe(1);
      expect(contacts[0].name).toBe('João');
      expect(contacts[0].department.id).toBe(departmentId);
    });

    it('should filter by receiveNF', async() => {
      await prisma.resaleContact.createMany({
        data: [
          { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: true, active: true },
          { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: true },
        ],
      });

      const [contacts, total] = await sut.findAll({ resaleId, receiveNF: true });

      expect(contacts).toHaveLength(1);
      expect(total).toBe(1);
      expect(contacts[0].receiveNF).toBe(true);
    });

    it('should return results ordered by name asc', async() => {
      const first = await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'B', email: 'b@example.com', receiveNF: false, active: true },
      });
      const second = await prisma.resaleContact.create({
        data: { resaleId, departmentId, name: 'A', email: 'a@example.com', receiveNF: false, active: true },
      });

      const [contacts] = await sut.findAll({ resaleId });

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
      const created = await prisma.resaleContact.create({
        data: {
          resaleId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ResaleContactDto>({
        id: created.id,
        resaleId: created.resaleId,
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
      const created = await prisma.resaleContact.create({
        data: {
          resaleId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          phone: '11999999999',
          whatsapp: '11988887777',
          observations: 'Observação',
          receiveNF: true,
          active: true,
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

  describe('findByResaleIdAndEmail', () => {
    it('should return null when no contact exists for client and email', async() => {
      const result = await sut.findByResaleIdAndEmail(resaleId, 'joao@example.com');

      expect(result).toBeNull();
    });

    it('should return contact when it exists for the given resaleId and email (lowercase)', async() => {
      const created = await prisma.resaleContact.create({
        data: {
          resaleId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
          active: true,
        },
      });

      const result = await sut.findByResaleIdAndEmail(resaleId, 'joao@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.email).toBe('joao@example.com');
    });

    it('should find by email case-insensitive (stored lowercase)', async() => {
      const created = await prisma.resaleContact.create({
        data: {
          resaleId,
          departmentId,
          name: 'João',
          email: 'joao@example.com',
          receiveNF: false,
          active: true,
        },
      });

      const result = await sut.findByResaleIdAndEmail(resaleId, 'joao@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });
});
