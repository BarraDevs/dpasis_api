import { Test } from '@nestjs/testing';
import { FreightDto } from 'src/app/service/freight/application/dtos/freight.dto';
import { CreateFreightInputDto } from 'src/app/service/freight/application/usecases/create-freight/dtos/create-freight.dto';
import { EditFreightInputDto } from 'src/app/service/freight/application/usecases/edit-freight/dtos/edit-freight.dto';
import { FindAllFreightQueryDto } from 'src/app/service/freight/application/usecases/find-all-freight/dtos/find-all-freight.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightDaoAdapterPrisma } from './freight-prisma.dao';

describe('FreightDaoAdapterPrisma - Integration tests', () => {
  let sut: FreightDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [FreightDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(FreightDaoAdapterPrisma);
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
    it('should return empty array when no freight records exist', async() => {
      const query: FindAllFreightQueryDto = {};

      const [freights, total] = await sut.findAll(query);

      expect(freights).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all freights with default pagination', async() => {
      await prisma.freight.createMany({
        data: [
          { name: `Freight ${Date.now()}-1`, active: true },
          { name: `Freight ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllFreightQueryDto = {};
      const [freights, total] = await sut.findAll(query);

      expect(freights).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.freight.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Freight ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [freights, total] = await sut.findAll({ page: 1, size: 10 });
      const [freights2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(freights).toHaveLength(10);
      expect(total).toBe(25);
      expect(freights2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.freight.createMany({
        data: [
          { name: `Freight Ativo ${Date.now()}`, active: true },
          { name: `Freight Inativo ${Date.now()}`, active: false },
        ],
      });

      const [activeTypes, activeTotal] = await sut.findAll({ active: true });
      const [inactiveTypes, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeTypes).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeTypes[0].active).toBe(true);

      expect(inactiveTypes).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveTypes[0].active).toBe(false);
    });

    it('should search in name field (case-insensitive)', async() => {
      await prisma.freight.createMany({
        data: [
          { name: `CIF ${Date.now()}`, active: true },
          { name: `FOB ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllFreightQueryDto = { search: 'cif' };
      const [freights, total] = await sut.findAll(query);

      expect(freights).toHaveLength(1);
      expect(total).toBe(1);
      expect(freights[0].name).toContain('CIF');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.freight.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.freight.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [freights] = await sut.findAll({});

      expect(freights).toHaveLength(2);
      expect(freights[0].name).toBe(ct2.name);
      expect(freights[1].name).toBe(ct1.name);
    });

    it('should return all freight fields correctly', async() => {
      const created = await prisma.freight.create({
        data: { name: `Freight Test ${Date.now()}`, active: true },
      });

      const [freights] = await sut.findAll({});

      expect(freights).toHaveLength(1);
      expect(freights[0]).toEqual<FreightDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when freight does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return freight by id', async() => {
      const created = await prisma.freight.create({
        data: { name: `Freight Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when freight does not exist', async() => {
      await prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } });

      const result = await sut.findByName('Freight Inexistente');

      expect(result).toBeNull();
    });

    it('should return freight by name (case-insensitive)', async() => {
      const name = `Freight ${Date.now()}`;
      const created = await prisma.freight.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create freight and return id', async() => {
      const data: CreateFreightInputDto = { name: `CIF ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.freight.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update freight name', async() => {
      const freightRow = await prisma.freight.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditFreightInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(freightRow.id, data);

      const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByFreightId', () => {
    it('should return 0 when no services use the freight', async() => {
      const freightRow = await prisma.freight.create({
        data: { name: `Freight ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByFreightId(freightRow.id);

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete freight from database', async() => {
      const freightRow = await prisma.freight.create({
        data: { name: `Freight ${Date.now()}`, active: true },
      });

      await sut.delete(freightRow.id);

      const deleted = await prisma.freight.findUnique({ where: { id: freightRow.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update freight status', async() => {
      const freightRow = await prisma.freight.create({
        data: { name: `Freight ${Date.now()}`, active: true },
      });

      await sut.updateStatus(freightRow.id, false);
      const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(freightRow.id, true);
      const updated2 = await prisma.freight.findUnique({ where: { id: freightRow.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
