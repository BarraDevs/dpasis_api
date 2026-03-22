import { Test } from '@nestjs/testing';
import { ServiceBilledFactory } from 'src/app/service/service-billed/domain/factories/service-billed.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledRepositoryAdapterPrisma } from './service-billed-prisma.repository';

describe('ServiceBilledRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ServiceBilledRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceBilledRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceBilledRepositoryAdapterPrisma);
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
      const entity = ServiceBilledFactory.create({
        description: 'Descrição do serviço faturado',
        isJunction: false,
        installmentDays: [5, 15, 25],
      });

      const id = await sut.save(entity);

      const saved = await prisma.serviceBilled.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Descrição do serviço faturado');
      expect(saved?.isJunction).toBe(false);
      expect(saved?.installmentDays).toEqual([5, 15, 25]);
      expect(saved?.active).toBe(true);
    });

    it('should persist with isJunction true and empty installmentDays', async() => {
      const entity = ServiceBilledFactory.create({
        description: 'Junção teste',
        isJunction: true,
        installmentDays: [],
      });

      const id = await sut.save(entity);

      const saved = await prisma.serviceBilled.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.isJunction).toBe(true);
      expect(saved?.installmentDays).toEqual([]);
    });

    it('should return the created id', async() => {
      const entity = ServiceBilledFactory.create({
        description: 'Retorno de id',
        isJunction: false,
        installmentDays: [5, 15, 25],
      });

      const id = await sut.save(entity);

      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);

      const saved = await prisma.serviceBilled.findUnique({ where: { id } });
      expect(saved?.id).toBe(id);
    });

    it('should persist with active default true', async() => {
      const entity = ServiceBilledFactory.create({
        description: 'Active default',
        isJunction: false,
        installmentDays: [1],
      });

      const id = await sut.save(entity);

      const saved = await prisma.serviceBilled.findUnique({ where: { id } });
      expect(saved?.active).toBe(true);
    });

    it('should persist installmentDays with zero value', async() => {
      const entity = ServiceBilledFactory.create({
        description: 'Dia zero',
        isJunction: false,
        installmentDays: [0, 15, 30],
      });

      const id = await sut.save(entity);

      const saved = await prisma.serviceBilled.findUnique({ where: { id } });
      expect(saved?.installmentDays).toEqual([0, 15, 30]);
    });
  });

  describe('findById', () => {
    it('should return null when billed service does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return entity when billed service exists', async() => {
      const created = await prisma.serviceBilled.create({
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
      const created = await prisma.serviceBilled.create({
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
    it('should update existing billed service', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: 'Original',
          isJunction: false,
          installmentDays: [5],
          active: true,
        },
      });

      const entity = ServiceBilledFactory.edit({
        id: created.id,
        description: 'Atualizado',
        isJunction: true,
        installmentDays: [10, 20, 30],
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
      expect(updated?.description).toBe('Atualizado');
      expect(updated?.isJunction).toBe(true);
      expect(updated?.installmentDays).toEqual([10, 20, 30]);
      expect(updated?.active).toBe(false);
    });

    it('should update only description without changing other fields', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: 'Original',
          isJunction: true,
          installmentDays: [10, 20],
          active: false,
        },
      });

      const entity = ServiceBilledFactory.edit({
        id: created.id,
        description: 'Só descrição alterada',
        isJunction: true,
        installmentDays: [10, 20],
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
      expect(updated?.description).toBe('Só descrição alterada');
      expect(updated?.isJunction).toBe(true);
      expect(updated?.installmentDays).toEqual([10, 20]);
      expect(updated?.active).toBe(false);
    });

    it('should update installmentDays to empty array', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: 'Com parcelas',
          isJunction: false,
          installmentDays: [5, 15, 25],
          active: true,
        },
      });

      const entity = ServiceBilledFactory.edit({
        id: created.id,
        description: 'Com parcelas',
        isJunction: true,
        installmentDays: [],
        active: true,
      });

      await sut.edit(entity);

      const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
      expect(updated?.installmentDays).toEqual([]);
      expect(updated?.isJunction).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove billed service from database', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: 'Para deletar',
          isJunction: false,
          installmentDays: [5, 15],
          active: true,
        },
      });

      await sut.delete(created.id);

      const deleted = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });

  });
});
