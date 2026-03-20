import { Test } from '@nestjs/testing';
import { ServiceCategoryDto } from 'src/app/service/service-category/application/dtos/service-category.dto';
import { CreateServiceCategoryInputDto } from 'src/app/service/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { EditServiceCategoryInputDto } from 'src/app/service/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { FindAllServiceCategoryQueryDto } from 'src/app/service/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryDaoAdapterPrisma } from './service-category-prisma.dao';

describe('ServiceCategoryDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceCategoryDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceCategoryDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceCategoryDaoAdapterPrisma);
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
    it('should return empty array when no service categories exist', async() => {
      const query: FindAllServiceCategoryQueryDto = {};

      const [serviceCategories, total] = await sut.findAll(query);

      expect(serviceCategories).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all service categories with default pagination', async() => {
      await prisma.serviceCategory.createMany({
        data: [
          { name: `Category ${Date.now()}-1`, active: true },
          { name: `Category ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllServiceCategoryQueryDto = {};
      const [serviceCategories, total] = await sut.findAll(query);

      expect(serviceCategories).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.serviceCategory.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Category ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [serviceCategories, total] = await sut.findAll({ page: 1, size: 10 });
      const [serviceCategories2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(serviceCategories).toHaveLength(10);
      expect(total).toBe(25);
      expect(serviceCategories2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.serviceCategory.createMany({
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
      await prisma.serviceCategory.createMany({
        data: [
          { name: `Manutenção ${Date.now()}`, active: true },
          { name: `Instalação ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllServiceCategoryQueryDto = { search: 'manutenção' };
      const [serviceCategories, total] = await sut.findAll(query);

      expect(serviceCategories).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceCategories[0].name).toContain('Manutenção');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.serviceCategory.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.serviceCategory.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [serviceCategories] = await sut.findAll({});

      expect(serviceCategories).toHaveLength(2);
      expect(serviceCategories[0].name).toBe(ct2.name);
      expect(serviceCategories[1].name).toBe(ct1.name);
    });

    it('should return all service category fields correctly', async() => {
      const created = await prisma.serviceCategory.create({
        data: { name: `Category Test ${Date.now()}`, active: true },
      });

      const [serviceCategories] = await sut.findAll({});

      expect(serviceCategories).toHaveLength(1);
      expect(serviceCategories[0]).toEqual<ServiceCategoryDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when service category does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return service category by id', async() => {
      const created = await prisma.serviceCategory.create({
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
    it('should return null when service category does not exist', async() => {
      await prisma.serviceCategory.create({ data: { name: `Category ${Date.now()}`, active: true } });

      const result = await sut.findByName('Category Inexistente');

      expect(result).toBeNull();
    });

    it('should return service category by name (case-insensitive)', async() => {
      const name = `Category ${Date.now()}`;
      const created = await prisma.serviceCategory.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create service category and return id', async() => {
      const data: CreateServiceCategoryInputDto = { name: `Manutenção ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.serviceCategory.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update service category name', async() => {
      const serviceCategory = await prisma.serviceCategory.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditServiceCategoryInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(serviceCategory.id, data);

      const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete service category from database', async() => {
      const serviceCategory = await prisma.serviceCategory.create({
        data: { name: `Category ${Date.now()}`, active: true },
      });

      await sut.delete(serviceCategory.id);

      const deleted = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update service category status', async() => {
      const serviceCategory = await prisma.serviceCategory.create({
        data: { name: `Category ${Date.now()}`, active: true },
      });

      await sut.updateStatus(serviceCategory.id, false);
      const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(serviceCategory.id, true);
      const updated2 = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
