import { Test } from '@nestjs/testing';
import { CategoryDto } from 'src/app/global/category/application/dtos/category.dto';
import { CreateCategoryInputDto } from 'src/app/global/category/application/usecases/create-category/dtos/create-category.dto';
import { EditCategoryInputDto } from 'src/app/global/category/application/usecases/edit-category/dtos/edit-category.dto';
import { FindAllCategoryQueryDto } from 'src/app/global/category/application/usecases/find-all-category/dtos/find-all-category.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryDaoAdapterPrisma } from './category-prisma.dao';

describe('CategoryDaoAdapterPrisma - Integration tests', () => {
  let sut: CategoryDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CategoryDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CategoryDaoAdapterPrisma);
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
    it('should return empty array when no category records exist', async() => {
      const query: FindAllCategoryQueryDto = {};

      const [categories, total] = await sut.findAll(query);

      expect(categories).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all categories with default pagination', async() => {
      await prisma.category.createMany({
        data: [
          { name: `Category ${Date.now()}-1`, active: true },
          { name: `Category ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllCategoryQueryDto = {};
      const [categories, total] = await sut.findAll(query);

      expect(categories).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.category.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Category ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [categories, total] = await sut.findAll({ page: 1, size: 10 });
      const [categories2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(categories).toHaveLength(10);
      expect(total).toBe(25);
      expect(categories2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.category.createMany({
        data: [
          { name: `Category Ativo ${Date.now()}`, active: true },
          { name: `Category Inativo ${Date.now()}`, active: false },
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
      await prisma.category.createMany({
        data: [
          { name: `Manutenção ${Date.now()}`, active: true },
          { name: `Instalação ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllCategoryQueryDto = { search: 'manutenção' };
      const [categories, total] = await sut.findAll(query);

      expect(categories).toHaveLength(1);
      expect(total).toBe(1);
      expect(categories[0].name).toContain('Manutenção');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.category.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.category.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [categories] = await sut.findAll({});

      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe(ct2.name);
      expect(categories[1].name).toBe(ct1.name);
    });

    it('should return all category fields correctly', async() => {
      const created = await prisma.category.create({
        data: { name: `Category Test ${Date.now()}`, active: true },
      });

      const [categories] = await sut.findAll({});

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual<CategoryDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when category does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return category by id', async() => {
      const created = await prisma.category.create({
        data: { name: `Category Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when category does not exist', async() => {
      await prisma.category.create({ data: { name: `Category ${Date.now()}`, active: true } });

      const result = await sut.findByName('Category Inexistente');

      expect(result).toBeNull();
    });

    it('should return category by name (case-insensitive)', async() => {
      const name = `Category ${Date.now()}`;
      const created = await prisma.category.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create category and return id', async() => {
      const data: CreateCategoryInputDto = { name: `Manutenção ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.category.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update category name', async() => {
      const categoryRow = await prisma.category.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditCategoryInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(categoryRow.id, data);

      const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByCategoryId', () => {
    it('should return 0 when no services use the category', async() => {
      const categoryRow = await prisma.category.create({
        data: { name: `Category ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByCategoryId(categoryRow.id);

      expect(count).toBe(0);
    });

    it('should return count when services use the category', async() => {
      const category = await prisma.category.create({
        data: { name: `Cat ${Date.now()}`, active: true },
      });

      const [cnae, nbs, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
        prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
        prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
      ]);
      const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
      });

      const [billed, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
        prisma.billed.create({
          data: { description: `Billed ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
        }),
        prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
        prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
        prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
        prisma.warranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
      ]);

      await prisma.service.create({
        data: {
          cnaeNbsIndopId: cnaeNbsIndop.id,
          billedId: billed.id,
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

      const count = await sut.countServicesByCategoryId(category.id);

      expect(count).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete category from database', async() => {
      const categoryRow = await prisma.category.create({
        data: { name: `Category ${Date.now()}`, active: true },
      });

      await sut.delete(categoryRow.id);

      const deleted = await prisma.category.findUnique({ where: { id: categoryRow.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update category status', async() => {
      const categoryRow = await prisma.category.create({
        data: { name: `Category ${Date.now()}`, active: true },
      });

      await sut.updateStatus(categoryRow.id, false);
      const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(categoryRow.id, true);
      const updated2 = await prisma.category.findUnique({ where: { id: categoryRow.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
