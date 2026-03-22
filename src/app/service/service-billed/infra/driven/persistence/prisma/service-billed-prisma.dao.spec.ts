import { Test } from '@nestjs/testing';
import { ServiceBilledDto } from 'src/app/service/service-billed/application/dtos/service-billed.dto';
import { FindAllServiceBilledQueryDto } from 'src/app/service/service-billed/application/usecases/find-all-service-billed/dtos/find-all-service-billed.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledDaoAdapterPrisma } from './service-billed-prisma.dao';

describe('ServiceBilledDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceBilledDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceBilledDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceBilledDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no billed services exist', async() => {
      const query: FindAllServiceBilledQueryDto = {};

      const [serviceBilleds, total] = await sut.findAll(query);

      expect(serviceBilleds).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all billed services with default pagination', async() => {
      await prisma.serviceBilled.createMany({
        data: [
          { description: `Desc ${Date.now()}-1`, isJunction: false, installmentDays: [5, 15], active: true },
          { description: `Desc ${Date.now()}-2`, isJunction: true, installmentDays: [10], active: false },
        ],
      });

      const query: FindAllServiceBilledQueryDto = {};
      const [serviceBilleds, total] = await sut.findAll(query);

      expect(serviceBilleds).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.serviceBilled.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          description: `Desc ${Date.now()}-${i + 1}`,
          isJunction: false,
          installmentDays: [5, 15, 25],
          active: true,
        })),
      });

      const [serviceBilleds, total] = await sut.findAll({ page: 1, size: 10 });
      const [serviceBilleds2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(serviceBilleds).toHaveLength(10);
      expect(total).toBe(25);
      expect(serviceBilleds2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.serviceBilled.createMany({
        data: [
          { description: `Ativo ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Inativo ${Date.now()}`, isJunction: false, installmentDays: [10], active: false },
        ],
      });

      const [active, activeTotal] = await sut.findAll({ active: true });
      const [inactive, inactiveTotal] = await sut.findAll({ active: false });

      expect(active).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(active[0].active).toBe(true);

      expect(inactive).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactive[0].active).toBe(false);
    });

    it('should search in description field (case-insensitive)', async() => {
      await prisma.serviceBilled.createMany({
        data: [
          { description: `Manutenção Mensal ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Instalação ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
        ],
      });

      const query: FindAllServiceBilledQueryDto = { search: 'manutenção' };
      const [serviceBilleds, total] = await sut.findAll(query);

      expect(serviceBilleds).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceBilleds[0].description).toContain('Manutenção');
    });

    it('should return all billed service fields including installmentDays', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: `Desc Test ${Date.now()}`,
          isJunction: true,
          installmentDays: [5, 15, 25],
          active: true,
        },
      });

      const [serviceBilleds] = await sut.findAll({});

      expect(serviceBilleds).toHaveLength(1);
      expect(serviceBilleds[0]).toEqual<ServiceBilledDto>({
        id: created.id,
        description: created.description,
        isJunction: created.isJunction,
        installmentDays: created.installmentDays,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(serviceBilleds[0].installmentDays).toEqual([5, 15, 25]);
    });
  });

  describe('findById', () => {
    it('should return null when billed service does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return billed service by id with installmentDays', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: `Desc Test ${Date.now()}`,
          isJunction: true,
          installmentDays: [10, 20, 30],
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.description).toBe(created.description);
      expect(result?.isJunction).toBe(true);
      expect(result?.installmentDays).toEqual([10, 20, 30]);
    });

    it('should return null when findById with non-existent id', async() => {
      await prisma.serviceBilled.create({
        data: { description: 'Existente', isJunction: false, installmentDays: [5], active: true },
      });

      const result = await sut.findById(999999);

      expect(result).toBeNull();
    });

    it('should return createdAt and updatedAt as Date instances', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: `Desc ${Date.now()}`,
          isJunction: false,
          installmentDays: [1],
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll - combined filters', () => {
    it('should return empty array when search does not match any record', async() => {
      await prisma.serviceBilled.create({
        data: { description: 'Manutenção', isJunction: false, installmentDays: [5], active: true },
      });

      const [serviceBilleds, total] = await sut.findAll({ search: 'inexistente' });

      expect(serviceBilleds).toEqual([]);
      expect(total).toBe(0);
    });

    it('should combine search and active filter', async() => {
      await prisma.serviceBilled.createMany({
        data: [
          { description: 'Manutenção Ativa', isJunction: false, installmentDays: [5], active: true },
          { description: 'Manutenção Inativa', isJunction: false, installmentDays: [10], active: false },
          { description: 'Instalação Ativa', isJunction: false, installmentDays: [15], active: true },
        ],
      });

      const [serviceBilleds, total] = await sut.findAll({ search: 'Manutenção', active: true });

      expect(serviceBilleds).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceBilleds[0].description).toContain('Manutenção');
      expect(serviceBilleds[0].active).toBe(true);
    });

    it('should return results ordered by id asc', async() => {
      const sb1 = await prisma.serviceBilled.create({
        data: { description: `Zebra ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
      });
      const sb2 = await prisma.serviceBilled.create({
        data: { description: `Alpha ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
      });

      const [serviceBilleds] = await sut.findAll({});

      expect(serviceBilleds).toHaveLength(2);
      expect(serviceBilleds[0].id).toBe(sb1.id);
      expect(serviceBilleds[1].id).toBe(sb2.id);
    });

    it('should handle installmentDays with empty array', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: `Empty days ${Date.now()}`,
          isJunction: true,
          installmentDays: [],
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result?.installmentDays).toEqual([]);
    });

    it('should handle installmentDays with single element', async() => {
      const created = await prisma.serviceBilled.create({
        data: {
          description: `Single day ${Date.now()}`,
          isJunction: false,
          installmentDays: [30],
          active: true,
        },
      });

      const [serviceBilleds] = await sut.findAll({});
      const found = serviceBilleds.find((s) => s.id === created.id);

      expect(found?.installmentDays).toEqual([30]);
    });
  });
});
