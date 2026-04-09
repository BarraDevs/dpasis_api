import { Test } from '@nestjs/testing';
import { BilledDto } from 'src/app/service/billed/application/dtos/billed.dto';
import { FindAllBilledQueryDto } from 'src/app/service/billed/application/usecases/find-all-billed/dtos/find-all-billed.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledDaoAdapterPrisma } from './billed-prisma.dao';

describe('BilledDaoAdapterPrisma - Integration tests', () => {
  let sut: BilledDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [BilledDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(BilledDaoAdapterPrisma);
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
    it('should return empty array when no billed records exist', async() => {
      const query: FindAllBilledQueryDto = {};

      const [rows, total] = await sut.findAll(query);

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all billed records with default pagination', async() => {
      await prisma.billed.createMany({
        data: [
          { description: `Desc ${Date.now()}-1`, isJunction: false, installmentDays: [5, 15], active: true },
          { description: `Desc ${Date.now()}-2`, isJunction: true, installmentDays: [10], active: false },
        ],
      });

      const query: FindAllBilledQueryDto = {};
      const [rows, total] = await sut.findAll(query);

      expect(rows).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.billed.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          description: `Desc ${Date.now()}-${i + 1}`,
          isJunction: false,
          installmentDays: [5, 15, 25],
          active: true,
        })),
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 10 });
      const [rows2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(rows).toHaveLength(10);
      expect(total).toBe(25);
      expect(rows2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.billed.createMany({
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
      await prisma.billed.createMany({
        data: [
          { description: `Manutenção Mensal ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Instalação ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
        ],
      });

      const query: FindAllBilledQueryDto = { search: 'manutenção' };
      const [rows, total] = await sut.findAll(query);

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].description).toContain('Manutenção');
    });

    it('should return all billed fields including installmentDays', async() => {
      const created = await prisma.billed.create({
        data: {
          description: `Desc Test ${Date.now()}`,
          isJunction: true,
          installmentDays: [5, 15, 25],
          active: true,
        },
      });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual<BilledDto>({
        id: created.id,
        description: created.description,
        isJunction: created.isJunction,
        installmentDays: created.installmentDays,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(rows[0].installmentDays).toEqual([5, 15, 25]);
    });
  });

  describe('findById', () => {
    it('should return null when billed does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return billed by id with installmentDays', async() => {
      const created = await prisma.billed.create({
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
      await prisma.billed.create({
        data: { description: 'Existente', isJunction: false, installmentDays: [5], active: true },
      });

      const result = await sut.findById(999999);

      expect(result).toBeNull();
    });

    it('should return createdAt and updatedAt as Date instances', async() => {
      const created = await prisma.billed.create({
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
      await prisma.billed.create({
        data: { description: 'Manutenção', isJunction: false, installmentDays: [5], active: true },
      });

      const [rows, total] = await sut.findAll({ search: 'inexistente' });

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should combine search and active filter', async() => {
      await prisma.billed.createMany({
        data: [
          { description: 'Manutenção Ativa', isJunction: false, installmentDays: [5], active: true },
          { description: 'Manutenção Inativa', isJunction: false, installmentDays: [10], active: false },
          { description: 'Instalação Ativa', isJunction: false, installmentDays: [15], active: true },
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'Manutenção', active: true });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].description).toContain('Manutenção');
      expect(rows[0].active).toBe(true);
    });

    it('should return results ordered by id asc', async() => {
      const sb1 = await prisma.billed.create({
        data: { description: `Zebra ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
      });
      const sb2 = await prisma.billed.create({
        data: { description: `Alpha ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
      });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(2);
      expect(rows[0].id).toBe(sb1.id);
      expect(rows[1].id).toBe(sb2.id);
    });

    it('should handle installmentDays with empty array', async() => {
      const created = await prisma.billed.create({
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
      const created = await prisma.billed.create({
        data: {
          description: `Single day ${Date.now()}`,
          isJunction: false,
          installmentDays: [30],
          active: true,
        },
      });

      const [rows] = await sut.findAll({});
      const found = rows.find((s) => s.id === created.id);

      expect(found?.installmentDays).toEqual([30]);
    });
  });

  describe('countServicesByBilledId', () => {
    it('should return 0 when no services use this billed', async() => {
      const created = await prisma.billed.create({
        data: {
          description: `Para count ${Date.now()}`,
          isJunction: false,
          installmentDays: [10],
          active: true,
        },
      });

      const count = await sut.countServicesByBilledId(created.id);

      expect(count).toBe(0);
    });

    it('should return count when services use this billed', async() => {
      const billedRow = await prisma.billed.create({
        data: {
          description: `Billed ${Date.now()}`,
          isJunction: false,
          installmentDays: [5, 15],
          active: true,
        },
      });

      const [cnae, nbs, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
        prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
        prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
      ]);
      const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
      });

      const [category, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
        prisma.category.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
        prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
        prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
        prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
        prisma.warranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
      ]);

      await prisma.service.create({
        data: {
          cnaeNbsIndopId: cnaeNbsIndop.id,
          billedId: billedRow.id,
          categoryId: category.id,
          deliveryTermId: deliveryTerm.id,
          freightId: freight.id,
          proposalValidityId: proposalValidity.id,
          warrantyId: warranty.id,
          name: 'Service Test',
          unitPriceInCents: 10000,
          description: 'Service Test',
          isCommercial: true,
          active: true,
        },
      });

      const count = await sut.countServicesByBilledId(billedRow.id);

      expect(count).toBe(1);
    });
  });
});
