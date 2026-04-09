import { Test } from '@nestjs/testing';
import { BilledFactory } from 'src/app/service/billed/domain/factories/billed.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledRepositoryAdapterPrisma } from './billed-prisma.repository';

describe('BilledRepositoryAdapterPrisma - Integration tests', () => {
  let sut: BilledRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [BilledRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(BilledRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should persist entity in billed_services table', async() => {
      const entity = BilledFactory.create({
        description: 'Descrição do faturado',
        isJunction: false,
        installmentDays: [5, 15, 25],
      });

      const id = await sut.save(entity);

      const saved = await prisma.billed.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Descrição do faturado');
      expect(saved?.isJunction).toBe(false);
      expect(saved?.installmentDays).toEqual([5, 15, 25]);
      expect(saved?.active).toBe(true);
    });

    it('should persist with isJunction true and empty installmentDays', async() => {
      const entity = BilledFactory.create({
        description: 'Junção teste',
        isJunction: true,
        installmentDays: [],
      });

      const id = await sut.save(entity);

      const saved = await prisma.billed.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.isJunction).toBe(true);
      expect(saved?.installmentDays).toEqual([]);
    });

    it('should return the created id', async() => {
      const entity = BilledFactory.create({
        description: 'Retorno de id',
        isJunction: false,
        installmentDays: [5, 15, 25],
      });

      const id = await sut.save(entity);

      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);

      const saved = await prisma.billed.findUnique({ where: { id } });
      expect(saved?.id).toBe(id);
    });

    it('should persist with active default true', async() => {
      const entity = BilledFactory.create({
        description: 'Active default',
        isJunction: false,
        installmentDays: [1],
      });

      const id = await sut.save(entity);

      const saved = await prisma.billed.findUnique({ where: { id } });
      expect(saved?.active).toBe(true);
    });

    it('should persist installmentDays with zero value', async() => {
      const entity = BilledFactory.create({
        description: 'Dia zero',
        isJunction: false,
        installmentDays: [0, 15, 30],
      });

      const id = await sut.save(entity);

      const saved = await prisma.billed.findUnique({ where: { id } });
      expect(saved?.installmentDays).toEqual([0, 15, 30]);
    });
  });

  describe('findById', () => {
    it('should return null when billed does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return entity when billed exists', async() => {
      const created = await prisma.billed.create({
        data: {
          description: 'Descrição teste',
          isJunction: true,
          installmentDays: [10, 20],
          active: false,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props.id).toBe(created.id);
      expect(result?.props.description).toBe('Descrição teste');
      expect(result?.props.isJunction).toBe(true);
      expect(result?.props.installmentDays).toEqual([10, 20]);
      expect(result?.props.active).toBe(false);
    });

    it('should return entity with props getter returning copy of installmentDays', async() => {
      const created = await prisma.billed.create({
        data: {
          description: 'Imutabilidade',
          isJunction: false,
          installmentDays: [5, 15],
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result?.props).toBeDefined();
      const days = result!.props.installmentDays;
      days.push(99);
      expect(result!.props.installmentDays).toEqual([5, 15]);
    });
  });

  describe('edit', () => {
    it('should update existing billed', async() => {
      const created = await prisma.billed.create({
        data: {
          description: 'Original',
          isJunction: false,
          installmentDays: [5],
          active: true,
        },
      });

      const entity = BilledFactory.edit({
        id: created.id,
        description: 'Atualizado',
        isJunction: true,
        installmentDays: [10, 20, 30],
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.billed.findUnique({ where: { id: created.id } });
      expect(updated?.description).toBe('Atualizado');
      expect(updated?.isJunction).toBe(true);
      expect(updated?.installmentDays).toEqual([10, 20, 30]);
      expect(updated?.active).toBe(false);
    });

    it('should update only description without changing other fields', async() => {
      const created = await prisma.billed.create({
        data: {
          description: 'Original',
          isJunction: true,
          installmentDays: [10, 20],
          active: false,
        },
      });

      const entity = BilledFactory.edit({
        id: created.id,
        description: 'Só descrição alterada',
        isJunction: true,
        installmentDays: [10, 20],
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.billed.findUnique({ where: { id: created.id } });
      expect(updated?.description).toBe('Só descrição alterada');
      expect(updated?.isJunction).toBe(true);
      expect(updated?.installmentDays).toEqual([10, 20]);
      expect(updated?.active).toBe(false);
    });

    it('should update installmentDays to empty array', async() => {
      const created = await prisma.billed.create({
        data: {
          description: 'Com parcelas',
          isJunction: false,
          installmentDays: [5, 15, 25],
          active: true,
        },
      });

      const entity = BilledFactory.edit({
        id: created.id,
        description: 'Com parcelas',
        isJunction: true,
        installmentDays: [],
        active: true,
      });

      await sut.edit(entity);

      const updated = await prisma.billed.findUnique({ where: { id: created.id } });
      expect(updated?.installmentDays).toEqual([]);
      expect(updated?.isJunction).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove billed from database', async() => {
      const created = await prisma.billed.create({
        data: {
          description: 'Para deletar',
          isJunction: false,
          installmentDays: [5, 15],
          active: true,
        },
      });

      await sut.delete(created.id);

      const deleted = await prisma.billed.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });

  });
});
