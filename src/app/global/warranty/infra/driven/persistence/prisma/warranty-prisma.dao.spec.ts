import { Test } from '@nestjs/testing';
import { WarrantyDto } from 'src/app/global/warranty/application/dtos/warranty.dto';
import { CreateWarrantyInputDto } from 'src/app/global/warranty/application/usecases/create-warranty/dtos/create-warranty.dto';
import { EditWarrantyInputDto } from 'src/app/global/warranty/application/usecases/edit-warranty/dtos/edit-warranty.dto';
import { FindAllWarrantyQueryDto } from 'src/app/global/warranty/application/usecases/find-all-warranty/dtos/find-all-warranty.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyDaoAdapterPrisma } from './warranty-prisma.dao';

describe('WarrantyDaoAdapterPrisma - Integration tests', () => {
  let sut: WarrantyDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [WarrantyDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(WarrantyDaoAdapterPrisma);
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
    it('should return empty array when no warranty records exist', async() => {
      const query: FindAllWarrantyQueryDto = {};

      const [rows, total] = await sut.findAll(query);

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all warranties with default pagination', async() => {
      await prisma.warranty.createMany({
        data: [
          { name: `Warranty ${Date.now()}-1`, active: true },
          { name: `Warranty ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllWarrantyQueryDto = {};
      const [rows, total] = await sut.findAll(query);

      expect(rows).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.warranty.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Warranty ${Date.now()}-${i + 1}`,
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
      await prisma.warranty.createMany({
        data: [
          { name: `Warranty Ativo ${Date.now()}`, active: true },
          { name: `Warranty Inativo ${Date.now()}`, active: false },
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
      await prisma.warranty.createMany({
        data: [
          { name: `90 dias ${Date.now()}`, active: true },
          { name: `1 ano ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllWarrantyQueryDto = { search: 'DIAS' };
      const [rows, total] = await sut.findAll(query);

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].name).toContain('dias');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.warranty.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.warranty.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe(ct2.name);
      expect(rows[1].name).toBe(ct1.name);
    });

    it('should return all warranty fields correctly', async() => {
      const created = await prisma.warranty.create({
        data: { name: `Warranty Test ${Date.now()}`, active: true },
      });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual<WarrantyDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when warranty does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return warranty by id', async() => {
      const created = await prisma.warranty.create({
        data: { name: `Warranty Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when warranty does not exist', async() => {
      await prisma.warranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } });

      const result = await sut.findByName('Warranty Inexistente');

      expect(result).toBeNull();
    });

    it('should return warranty by name (case-insensitive)', async() => {
      const name = `Warranty ${Date.now()}`;
      const created = await prisma.warranty.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create warranty and return id', async() => {
      const data: CreateWarrantyInputDto = { name: `90 dias ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.warranty.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update warranty name', async() => {
      const warranty = await prisma.warranty.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditWarrantyInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(warranty.id, data);

      const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByWarrantyId', () => {
    it('should return 0 when no services use the warranty', async() => {
      const warranty = await prisma.warranty.create({
        data: { name: `Warranty ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByWarrantyId(warranty.id);

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete warranty from database', async() => {
      const warranty = await prisma.warranty.create({
        data: { name: `Warranty ${Date.now()}`, active: true },
      });

      await sut.delete(warranty.id);

      const deleted = await prisma.warranty.findUnique({ where: { id: warranty.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update warranty status', async() => {
      const warranty = await prisma.warranty.create({
        data: { name: `Warranty ${Date.now()}`, active: true },
      });

      await sut.updateStatus(warranty.id, false);
      const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(warranty.id, true);
      const updated2 = await prisma.warranty.findUnique({ where: { id: warranty.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
