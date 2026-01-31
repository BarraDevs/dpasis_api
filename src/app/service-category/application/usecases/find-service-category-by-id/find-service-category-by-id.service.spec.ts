import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { CreateServiceCategory } from '../create-service-category/create-service-category.service';
import { FindServiceCategoryById } from './find-service-category-by-id.service';

describe('FindServiceCategoryById', () => {
  let sut: FindServiceCategoryById;
  let prisma: PrismaService;
  let createServiceCategory: CreateServiceCategory;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceCategoryModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindServiceCategoryById);
    prisma = module.get(PrismaService);
    createServiceCategory = module.get(CreateServiceCategory);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call serviceCategoryDao.findById with correct parameters', async() => {
      // Arrange
      const serviceCategory = createMock<ServiceCategoryDto>();
      const findByIdSpy = jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      const id = 'existing-service-category-id';

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
    });

    it('should throw ServiceCategoryNotFoundError if serviceCategoryDao returns null', async() => {
      // Arrange
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const id = 'non-existing-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(ServiceCategoryNotFoundError);
    });

    it('should return the service category if found', async() => {
      // Arrange
      const mockCategory = createMock<ServiceCategoryDto>({
        id: 'test-id',
        name: 'Test Category',
        active: true,
      });
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(mockCategory);

      // Act
      const result = await sut.execute('test-id');

      // Assert
      expect(result).toEqual(mockCategory);
    });

    it('should propagate any error from dao', async() => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute('some-id')).rejects.toThrow('Database connection failed');
    });
  });

  describe('integration tests', () => {
    describe('error scenarios', () => {
      it('should throw ServiceCategoryNotFoundError if service category is not found', async() => {
        // Act & Assert
        await expect(sut.execute('non-existing-id')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with invalid UUID format', async() => {
        // Act & Assert
        await expect(sut.execute('invalid-uuid')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with empty string id', async() => {
        // Act & Assert
        await expect(sut.execute('')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with random UUID that does not exist', async() => {
        // Act & Assert
        await expect(sut.execute('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with whitespace id', async() => {
        // Act & Assert
        await expect(sut.execute('   ')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with special characters in id', async() => {
        // Act & Assert
        await expect(sut.execute('id-with-special-!@#$%')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with very long id', async() => {
        // Arrange
        const veryLongId = 'a'.repeat(1000);

        // Act & Assert
        await expect(sut.execute(veryLongId)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with null-like string id', async() => {
        // Act & Assert
        await expect(sut.execute('null')).rejects.toThrow(ServiceCategoryNotFoundError);
        await expect(sut.execute('undefined')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error when searching for deleted category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'To Be Deleted' });
        await prisma.serviceCategory.delete({ where: { id: created.id } });

        // Act & Assert
        await expect(sut.execute(created.id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw consistent error for same non-existing id', async() => {
        // Arrange
        const nonExistingId = 'consistent-non-existing-id';

        // Act & Assert
        await expect(sut.execute(nonExistingId)).rejects.toThrow(ServiceCategoryNotFoundError);
        await expect(sut.execute(nonExistingId)).rejects.toThrow(ServiceCategoryNotFoundError);
        await expect(sut.execute(nonExistingId)).rejects.toThrow(ServiceCategoryNotFoundError);
      });
    });

    describe('successful retrieval scenarios', () => {
      it('should return a service category if found', async() => {
        // Arrange
        const createData = { name: 'Manutenção Preventiva' };
        const created = await createServiceCategory.execute(createData);

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found).toBeDefined();
        expect(found).toEqual<ServiceCategoryDto>({
          id: created.id,
          name: createData.name,
          active: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it('should return category with all fields populated', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Complete Category' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found).toHaveProperty('id');
        expect(found).toHaveProperty('name');
        expect(found).toHaveProperty('active');
        expect(found).toHaveProperty('createdAt');
        expect(found).toHaveProperty('updatedAt');
        expect(found.id).toBe(created.id);
        expect(found.name).toBe('Complete Category');
        expect(found.active).toBe(true);
        expect(found.createdAt).toBeInstanceOf(Date);
        expect(found.updatedAt).toBeInstanceOf(Date);
      });

      it('should find category with simple name', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'A' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('A');
      });

      it('should find category with long name', async() => {
        // Arrange
        const longName = 'A'.repeat(256);
        const created = await createServiceCategory.execute({ name: longName });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe(longName);
        expect(found.name.length).toBe(256);
      });

      it('should find category with special characters', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Categoria & Serviço - 2025!' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('Categoria & Serviço - 2025!');
      });

      it('should find category with accents', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Instalação Elétrica' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('Instalação Elétrica');
      });

      it('should find category with emojis', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Consultoria 💡' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('Consultoria 💡');
      });

      it('should find category with numbers', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Serviço Nível 1' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('Serviço Nível 1');
      });

      it('should find category with unicode characters', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Serviço 中文 日本語' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('Serviço 中文 日本語');
      });

      it('should find active category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Active Category' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.active).toBe(true);
      });

      it('should find inactive category', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: { name: 'Inactive Category', active: false },
        });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.active).toBe(false);
        expect(found.name).toBe('Inactive Category');
      });

      it('should find recently created category', async() => {
        // Arrange
        const beforeCreate = new Date();
        const created = await createServiceCategory.execute({ name: 'Recent Category' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        const afterFind = new Date();
        expect(found.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(found.createdAt.getTime()).toBeLessThanOrEqual(afterFind.getTime());
      });

      it('should find old category', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: {
            name: 'Old Category',
            createdAt: new Date('2020-01-01'),
            updatedAt: new Date('2020-01-01'),
          },
        });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        expect(found.name).toBe('Old Category');
        expect(found.createdAt).toEqual(new Date('2020-01-01'));
      });

      it('should return exact same data on multiple calls', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Consistent Category' });

        // Act
        const found1 = await sut.execute(created.id);
        const found2 = await sut.execute(created.id);
        const found3 = await sut.execute(created.id);

        // Assert
        expect(found1).toEqual(found2);
        expect(found2).toEqual(found3);
        expect(found1.id).toBe(found2.id);
        expect(found1.name).toBe(found2.name);
      });
    });

    describe('multiple categories scenarios', () => {
      it('should find correct category among many', async() => {
        // Arrange
        const categories = [];
        for (let i = 1; i <= 10; i++) {
          const created = await createServiceCategory.execute({ name: `Categoria ${i}` });
          categories.push(created);
        }
        const targetCategory = categories[5];

        // Act
        const found = await sut.execute(targetCategory.id);

        // Assert
        expect(found.id).toBe(targetCategory.id);
        expect(found.name).toBe('Categoria 6');
      });

      it('should find first category', async() => {
        // Arrange
        const first = await createServiceCategory.execute({ name: 'First' });
        await createServiceCategory.execute({ name: 'Second' });
        await createServiceCategory.execute({ name: 'Third' });

        // Act
        const found = await sut.execute(first.id);

        // Assert
        expect(found.name).toBe('First');
      });

      it('should find last category', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'First' });
        await createServiceCategory.execute({ name: 'Second' });
        const last = await createServiceCategory.execute({ name: 'Last' });

        // Act
        const found = await sut.execute(last.id);

        // Assert
        expect(found.name).toBe('Last');
      });

      it('should find middle category', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'First' });
        const middle = await createServiceCategory.execute({ name: 'Middle' });
        await createServiceCategory.execute({ name: 'Last' });

        // Act
        const found = await sut.execute(middle.id);

        // Assert
        expect(found.name).toBe('Middle');
      });

      it('should find each category by their unique id', async() => {
        // Arrange
        const cat1 = await createServiceCategory.execute({ name: 'Cat 1' });
        const cat2 = await createServiceCategory.execute({ name: 'Cat 2' });
        const cat3 = await createServiceCategory.execute({ name: 'Cat 3' });

        // Act
        const found1 = await sut.execute(cat1.id);
        const found2 = await sut.execute(cat2.id);
        const found3 = await sut.execute(cat3.id);

        // Assert
        expect(found1.name).toBe('Cat 1');
        expect(found2.name).toBe('Cat 2');
        expect(found3.name).toBe('Cat 3');
        expect(found1.id).toBe(cat1.id);
        expect(found2.id).toBe(cat2.id);
        expect(found3.id).toBe(cat3.id);
      });
    });

    describe('database verification scenarios', () => {
      it('should return data matching direct database query', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Database Match' });

        // Act
        const found = await sut.execute(created.id);
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: created.id },
        });

        // Assert
        expect(found.id).toBe(directFromDb?.id);
        expect(found.name).toBe(directFromDb?.name);
        expect(found.active).toBe(directFromDb?.active);
        expect(found.createdAt).toEqual(directFromDb?.createdAt);
        expect(found.updatedAt).toEqual(directFromDb?.updatedAt);
      });

      it('should verify category exists in database after finding', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Exists in DB' });

        // Act
        const found = await sut.execute(created.id);

        // Assert
        const existsInDb = await prisma.serviceCategory.findUnique({
          where: { id: found.id },
        });
        expect(existsInDb).not.toBeNull();
      });
    });

    describe('edge case scenarios', () => {
      it('should handle finding category immediately after creation', async() => {
        // Arrange & Act
        const created = await createServiceCategory.execute({ name: 'Immediate Find' });
        const found = await sut.execute(created.id);

        // Assert
        expect(found.id).toBe(created.id);
        expect(found.name).toBe('Immediate Find');
      });

      it('should handle concurrent finds of same category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Concurrent Find' });

        // Act
        const [found1, found2, found3] = await Promise.all([
          sut.execute(created.id),
          sut.execute(created.id),
          sut.execute(created.id),
        ]);

        // Assert
        expect(found1.id).toBe(created.id);
        expect(found2.id).toBe(created.id);
        expect(found3.id).toBe(created.id);
        expect(found1).toEqual(found2);
        expect(found2).toEqual(found3);
      });

      it('should handle concurrent finds of different categories', async() => {
        // Arrange
        const cat1 = await createServiceCategory.execute({ name: 'Cat 1' });
        const cat2 = await createServiceCategory.execute({ name: 'Cat 2' });
        const cat3 = await createServiceCategory.execute({ name: 'Cat 3' });

        // Act
        const [found1, found2, found3] = await Promise.all([
          sut.execute(cat1.id),
          sut.execute(cat2.id),
          sut.execute(cat3.id),
        ]);

        // Assert
        expect(found1.name).toBe('Cat 1');
        expect(found2.name).toBe('Cat 2');
        expect(found3.name).toBe('Cat 3');
      });
    });

    describe('performance tests', () => {
      it('should find a category within reasonable time', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Performance Test' });
        const startTime = Date.now();

        // Act
        await sut.execute(created.id);

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should find categories efficiently among many', async() => {
        // Arrange
        const categories = [];
        for (let i = 1; i <= 100; i++) {
          const created = await createServiceCategory.execute({ name: `Category ${i}` });
          categories.push(created);
        }

        const startTime = Date.now();

        // Act
        for (const category of categories) {
          await sut.execute(category.id);
        }

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
      });

      it('should find 10 specific categories quickly', async() => {
        // Arrange
        for (let i = 1; i <= 50; i++) {
          await createServiceCategory.execute({ name: `Category ${i}` });
        }
        const targets = [];
        for (let i = 51; i <= 60; i++) {
          const created = await createServiceCategory.execute({ name: `Target ${i}` });
          targets.push(created);
        }

        const startTime = Date.now();

        // Act
        for (const target of targets) {
          await sut.execute(target.id);
        }

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(2000);
      });
    });
  });
});
