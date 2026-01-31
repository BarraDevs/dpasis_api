import { Test } from '@nestjs/testing';
import { ServiceCategoryPersistenceModule } from 'src/app/service-category/application/persistence/service-category-persistence.module';
import { CreateServiceCategoryInputDto } from 'src/app/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { EditServiceCategoryInputDto } from 'src/app/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryDaoAdapterPrisma } from './service-category.dao';

describe('ServiceCategoryDaoAdapterPrisma', () => {
  let sut: ServiceCategoryDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ServiceCategoryPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ServiceCategoryDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ServiceCategoryDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save a service category and return its id', async() => {
      // Arrange
      const data: CreateServiceCategoryInputDto = {
        name: 'Manutenção',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toEqual(expect.any(String));
      const savedServiceCategory = await prisma.serviceCategory.findUnique({ where: { id } });
      expect(savedServiceCategory).toBeDefined();
      expect(savedServiceCategory?.name).toBe(data.name);
      expect(savedServiceCategory?.active).toBe(true); // Default value
    });
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Seed data for findAll tests
      await prisma.serviceCategory.createMany({
        data: [
          { name: 'Manutenção Preventiva' },
          { name: 'Instalação' },
          { name: 'Consultoria' },
          { name: 'Suporte Técnico' },
          { name: 'Treinamento' },
        ],
      });
    });

    it('should return all service categories with pagination', async() => {
      // Act
      const [categories, total] = await sut.findAll({ page: 1, size: 10 });

      // Assert
      expect(total).toBe(5);
      expect(categories).toHaveLength(5);
    });

    it('should return paginated service categories', async() => {
      // Act
      const [categories, total] = await sut.findAll({ page: 1, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(categories).toHaveLength(2);
    });

    it('should return second page of paginated service categories', async() => {
      // Act
      const [categories, total] = await sut.findAll({ page: 2, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(categories).toHaveLength(2);
    });

    it('should filter service categories by search term (case insensitive)', async() => {
      // Act
      const [categories, total] = await sut.findAll({ page: 1, size: 10, search: 'manutenção' });

      // Assert
      expect(total).toBe(1);
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Manutenção Preventiva');
    });

    it('should filter service categories by search term (partial match)', async() => {
      // Act
      const [categories, total] = await sut.findAll({ page: 1, size: 10, search: 'téc' });

      // Assert
      expect(total).toBe(1);
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Suporte Técnico');
    });

    it('should return empty if search term matches nothing', async() => {
      // Act
      const [categories, total] = await sut.findAll({ page: 1, size: 10, search: 'xyz' });

      // Assert
      expect(total).toBe(0);
      expect(categories).toHaveLength(0);
    });

    it('should return service categories ordered by name ascending', async() => {
      // Act
      const [categories] = await sut.findAll({ page: 1, size: 10 });

      // Assert
      expect(categories[0].name).toBe('Consultoria');
      expect(categories[1].name).toBe('Instalação');
      expect(categories[2].name).toBe('Manutenção Preventiva');
      expect(categories[3].name).toBe('Suporte Técnico');
      expect(categories[4].name).toBe('Treinamento');
    });
  });

  describe('findById', () => {
    it('should return null if service category not found', async() => {
      // Act
      const category = await sut.findById('non-existing-id');

      // Assert
      expect(category).toBeNull();
    });

    it('should return the correct service category if found', async() => {
      // Arrange
      const created = await prisma.serviceCategory.create({
        data: { name: 'Reparo' },
      });

      // Act
      const category = await sut.findById(created.id);

      // Assert
      expect(category).not.toBeNull();
      expect(category?.id).toBe(created.id);
      expect(category?.name).toBe('Reparo');
    });
  });

  describe('findByName', () => {
    it('should return null if service category not found', async() => {
      // Act
      const category = await sut.findByName('Non Existing Category');

      // Assert
      expect(category).toBeNull();
    });

    it('should return the correct service category if found by exact name', async() => {
      // Arrange
      await prisma.serviceCategory.create({
        data: { name: 'Consultoria Técnica' },
      });

      // Act
      const category = await sut.findByName('Consultoria Técnica');

      // Assert
      expect(category).not.toBeNull();
      expect(category?.name).toBe('Consultoria Técnica');
    });

    it('should return the service category with case-insensitive search', async() => {
      // Arrange
      await prisma.serviceCategory.create({
        data: { name: 'Manutenção Preventiva' },
      });

      // Act
      const category = await sut.findByName('MANUTENÇÃO PREVENTIVA');

      // Assert
      expect(category).not.toBeNull();
      expect(category?.name).toBe('Manutenção Preventiva');
    });

    it('should return the service category with lowercase search', async() => {
      // Arrange
      await prisma.serviceCategory.create({
        data: { name: 'Instalação' },
      });

      // Act
      const category = await sut.findByName('instalação');

      // Assert
      expect(category).not.toBeNull();
      expect(category?.name).toBe('Instalação');
    });

    it('should return null for partial name match', async() => {
      // Arrange
      await prisma.serviceCategory.create({
        data: { name: 'Suporte Técnico' },
      });

      // Act
      const category = await sut.findByName('Suporte');

      // Assert
      expect(category).toBeNull();
    });
  });

  describe('edit', () => {
    it('should update the service category name', async() => {
      // Arrange
      const created = await prisma.serviceCategory.create({
        data: { name: 'Old Name' },
      });
      const editData: EditServiceCategoryInputDto = {
        name: 'New Name',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedCategory = await prisma.serviceCategory.findUnique({ where: { id: created.id } });
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.name).toBe(editData.name);
    });

    it('should allow editing to the same name (no change)', async() => {
      // Arrange
      const created = await prisma.serviceCategory.create({
        data: { name: 'Same Name' },
      });
      const editData: EditServiceCategoryInputDto = {
        name: 'Same Name',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedCategory = await prisma.serviceCategory.findUnique({ where: { id: created.id } });
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.name).toBe(editData.name);
    });

    it('should throw error if service category does not exist', async() => {
      // Arrange
      const editData: EditServiceCategoryInputDto = { name: 'No Effect' };

      // Act & Assert
      await expect(sut.edit('non-existing-id', editData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete the service category', async() => {
      // Arrange
      const created = await prisma.serviceCategory.create({
        data: { name: 'Delete Me' },
      });

      // Act
      await sut.delete(created.id);

      // Assert
      const deletedCategory = await prisma.serviceCategory.findUnique({ where: { id: created.id } });
      expect(deletedCategory).toBeNull();
    });

    it('should throw error if service category does not exist', async() => {
      // Act & Assert
      await expect(sut.delete('non-existing-id')).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update the service category status to active', async() => {
      // Arrange
      const created = await prisma.serviceCategory.create({
        data: { name: 'Status Test', active: false },
      });

      // Act
      await sut.updateStatus(created.id, true);

      // Assert
      const updatedCategory = await prisma.serviceCategory.findUnique({ where: { id: created.id } });
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.active).toBe(true);
    });

    it('should keep status as active if already active', async() => {
      // Arrange
      const created = await prisma.serviceCategory.create({
        data: { name: 'Already Active', active: true },
      });

      // Act
      await sut.updateStatus(created.id, true);

      // Assert
      const updatedCategory = await prisma.serviceCategory.findUnique({ where: { id: created.id } });
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.active).toBe(true);
    });

    it('should throw error if service category does not exist', async() => {
      // Act & Assert
      await expect(sut.updateStatus('non-existing-id', true)).rejects.toThrow();
    });
  });
});
