import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ResaleContactFactory } from 'src/app/resale/resale-contact/domain/factories/resale-contact.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleContactRepositoryAdapterPrisma } from './resale-contact-prisma.repository';

describe('ResaleContactRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ResaleContactRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ResaleContactRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ResaleContactRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.resaleDepartment.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });

    resaleId = resale.id;
    departmentId = department.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should create client contact and return id', async() => {
      const entity = ResaleContactFactory.create({
        resaleId,
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

      const saved = await prisma.resaleContact.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('João');
      expect(saved?.email).toBe('joao@example.com');
    });

    it('should store email in lowercase', async() => {
      const entity = ResaleContactFactory.create({
        resaleId,
        departmentId,
        name: 'João',
        email: 'Joao@Example.COM',
        phone: null,
        whatsapp: null,
        observations: null,
        receiveNF: false,
      });

      const id = await sut.save(entity);

      const saved = await prisma.resaleContact.findUnique({ where: { id } });
      expect(saved?.email).toBe('joao@example.com');
    });

    it('should store phone and whatsapp', async() => {
      const entity = ResaleContactFactory.create({
        resaleId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        phone: '11999999999',
        whatsapp: '11988887777',
        observations: null,
        receiveNF: false,
      });

      const id = await sut.save(entity);

      const saved = await prisma.resaleContact.findUnique({ where: { id } });
      expect(saved?.phone).toBe('11999999999');
      expect(saved?.whatsapp).toBe('11988887777');
    });
  });

  describe('findById', () => {
    it('should return null when client contact does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return ResaleContact entity by id', async() => {
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
      expect(result?.props.id).toBe(created.id);
      expect(result?.props.name).toBe('João');
      expect(result?.props.email).toBe('joao@example.com');
    });
  });

  describe('edit', () => {
    it('should update client contact', async() => {
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

      const existing = await sut.findById(created.id)!;
      const updated = ResaleContactFactory.edit(existing!, {
        departmentId,
        name: 'João Silva',
        email: 'joao.silva@example.com',
        phone: null,
        whatsapp: null,
        observations: null,
        receiveNF: true,
      });

      await sut.edit(updated);

      const saved = await prisma.resaleContact.findUnique({ where: { id: created.id } });
      expect(saved?.name).toBe('João Silva');
      expect(saved?.email).toBe('joao.silva@example.com');
      expect(saved?.receiveNF).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client contact from database', async() => {
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

      await sut.delete(created.id);

      const deleted = await prisma.resaleContact.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
