import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { CreateServiceCategory } from '../create-service-category/create-service-category.service';
import { FindServiceCategoryById } from '../find-service-category-by-id/find-service-category-by-id.service';
import { DeleteServiceCategory } from './delete-service-category.service';

describe('DeleteServiceCategory', () => {
  let sut: DeleteServiceCategory;
  let prisma: PrismaService;
  let createServiceCategory: CreateServiceCategory;
  let findServiceCategoryById: FindServiceCategoryById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceCategoryModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(DeleteServiceCategory);
    prisma = module.get(PrismaService);
    createServiceCategory = module.get(CreateServiceCategory);
    findServiceCategoryById = module.get(FindServiceCategoryById);

    await prisma.serviceCategory.deleteMany();
  });

  afterEach(async() => {
    await prisma.serviceCategory.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call serviceCategoryDao.findById and serviceCategoryDao.delete with correct values', async() => {
      // Arrange
      const id = 'service-category-id-to-delete';
      const serviceCategory = createMock<ServiceCategoryDto>({ id });
      const findByIdSpy = jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      const deleteSpy = jest.spyOn(sut['serviceCategoryDao'], 'delete').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(deleteSpy).toHaveBeenCalledWith(id);
    });

    it('should throw ServiceCategoryNotFoundError if serviceCategoryDao.findById returns null', async() => {
      // Arrange
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(sut['serviceCategoryDao'], 'delete');
      const id = 'non-existing-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(ServiceCategoryNotFoundError);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should not call delete if category does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(sut['serviceCategoryDao'], 'delete');

      // Act & Assert
      try {
        await sut.execute(id);
      } catch (error) {
        // Expected error
      }
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should return a success message on successful deletion', async() => {
      // Arrange
      const serviceCategory = createMock<ServiceCategoryDto>();
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'delete').mockResolvedValue();

      // Act
      const result = await sut.execute(serviceCategory.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
    });

    it('should return correct message structure', async() => {
      // Arrange
      const serviceCategory = createMock<ServiceCategoryDto>({ id: 'test-id' });
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'delete').mockResolvedValue();

      // Act
      const result = await sut.execute(serviceCategory.id);

      // Assert
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should propagate error when delete operation fails', async() => {
      // Arrange
      const serviceCategory = createMock<ServiceCategoryDto>();
      const error = new Error('Database connection lost');
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'delete').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute(serviceCategory.id)).rejects.toThrow('Database connection lost');
    });
  });

  describe('integration tests', () => {
    describe('error scenarios', () => {
      it('should throw ServiceCategoryNotFoundError if the service category does not exist', async() => {
        // Act & Assert
        await expect(sut.execute('non-existing-id')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceCategoryNotFoundError with invalid UUID format', async() => {
        // Act & Assert
        await expect(sut.execute('invalid-uuid')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceCategoryNotFoundError with empty string id', async() => {
        // Act & Assert
        await expect(sut.execute('')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceCategoryNotFoundError with random UUID', async() => {
        // Act & Assert
        await expect(sut.execute('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceCategoryNotFoundError for already deleted category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'To Be Deleted Twice' });
        await sut.execute(created.id);

        // Act & Assert
        await expect(sut.execute(created.id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });
    });

    describe('successful deletion scenarios', () => {
      it('should delete a service category successfully', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'To Be Deleted' });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
        await expect(findServiceCategoryById.execute(created.id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should delete active category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Active Category' });
        const category = await findServiceCategoryById.execute(created.id);
        expect(category.active).toBe(true);

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result.message).toBe('Categoria de serviço deletada com sucesso!');
        await expect(findServiceCategoryById.execute(created.id)).rejects.toThrow();
      });

      it('should delete inactive category', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: { name: 'Inactive Category', active: false },
        });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result.message).toBe('Categoria de serviço deletada com sucesso!');
        await expect(findServiceCategoryById.execute(created.id)).rejects.toThrow();
      });

      it('should delete category with simple name', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'A' });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
      });

      it('should delete category with long name', async() => {
        // Arrange
        const longName = 'A'.repeat(256);
        const created = await createServiceCategory.execute({ name: longName });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
      });

      it('should delete category with special characters', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Categoria & Serviço - 2025!' });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
      });

      it('should delete category with accents', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Instalação Elétrica' });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
      });

      it('should delete category with emojis', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Consultoria 💡' });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
      });

      it('should delete recently created category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Just Created' });
        const beforeDelete = new Date();

        // Act
        const result = await sut.execute(created.id);

        // Assert
        const afterDelete = new Date();
        expect(result.message).toBe('Categoria de serviço deletada com sucesso!');
        expect(afterDelete.getTime() - beforeDelete.getTime()).toBeLessThan(1000);
      });

      it('should delete old category', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: {
            name: 'Old Category',
            createdAt: new Date('2020-01-01'),
            updatedAt: new Date('2020-01-01'),
          },
        });

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço deletada com sucesso!' });
      });
    });

    describe('bulk deletion scenarios', () => {
      it('should delete multiple categories sequentially', async() => {
        // Arrange
        const categories = await Promise.all([
          createServiceCategory.execute({ name: 'Categoria 1' }),
          createServiceCategory.execute({ name: 'Categoria 2' }),
          createServiceCategory.execute({ name: 'Categoria 3' }),
        ]);

        // Act
        for (const category of categories) {
          const result = await sut.execute(category.id);
          expect(result.message).toBe('Categoria de serviço deletada com sucesso!');
        }

        // Assert
        const remaining = await prisma.serviceCategory.findMany();
        expect(remaining).toHaveLength(0);
      });

      it('should delete 10 categories successfully', async() => {
        // Arrange
        const count = 10;
        const categories = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Categoria ${i + 1}` });
          categories.push(created);
        }

        // Act
        for (const category of categories) {
          await sut.execute(category.id);
        }

        // Assert
        const remaining = await prisma.serviceCategory.findMany();
        expect(remaining).toHaveLength(0);
      });

      it('should delete 50 categories successfully', async() => {
        // Arrange
        const count = 50;
        const categoryIds = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Categoria ${i + 1}` });
          categoryIds.push(created.id);
        }

        // Act
        for (const id of categoryIds) {
          await sut.execute(id);
        }

        // Assert
        const remaining = await prisma.serviceCategory.findMany();
        expect(remaining).toHaveLength(0);
      });

      it('should delete some categories and keep others', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Keep 1' });
        await createServiceCategory.execute({ name: 'Keep 2' });

        const toDelete = [
          await createServiceCategory.execute({ name: 'Delete 1' }),
          await createServiceCategory.execute({ name: 'Delete 2' }),
        ];

        // Act
        for (const category of toDelete) {
          await sut.execute(category.id);
        }

        // Assert
        const remaining = await prisma.serviceCategory.findMany();
        expect(remaining).toHaveLength(2);
        expect(remaining.map(c => c.name).sort()).toEqual(['Keep 1', 'Keep 2']);
      });
    });

    describe('verification after deletion', () => {
      it('should verify category is completely removed from database', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Will Be Gone' });

        // Act
        await sut.execute(created.id);

        // Assert
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: created.id },
        });
        expect(directFromDb).toBeNull();
      });

      it('should not affect other categories when deleting one', async() => {
        // Arrange
        const category1 = await createServiceCategory.execute({ name: 'Category 1' });
        const category2 = await createServiceCategory.execute({ name: 'Category 2' });
        const category3 = await createServiceCategory.execute({ name: 'Category 3' });

        // Act
        await sut.execute(category2.id);

        // Assert
        const remaining = await prisma.serviceCategory.findMany();
        expect(remaining).toHaveLength(2);
        expect(remaining.map(c => c.id).sort()).toEqual([category1.id, category3.id].sort());
      });

      it('should verify database count after deletion', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Cat 1' });
        const toDelete = await createServiceCategory.execute({ name: 'Cat 2' });
        await createServiceCategory.execute({ name: 'Cat 3' });

        const beforeCount = await prisma.serviceCategory.count();
        expect(beforeCount).toBe(3);

        // Act
        await sut.execute(toDelete.id);

        // Assert
        const afterCount = await prisma.serviceCategory.count();
        expect(afterCount).toBe(2);
      });
    });

    describe('idempotency scenarios', () => {
      it('should not allow deleting the same category twice', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Once Only' });
        await sut.execute(created.id);

        // Act & Assert
        await expect(sut.execute(created.id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should fail on second deletion attempt with correct error', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Delete Once' });
        const firstResult = await sut.execute(created.id);
        expect(firstResult.message).toBe('Categoria de serviço deletada com sucesso!');

        // Act & Assert
        await expect(sut.execute(created.id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });
    });

    describe('performance tests', () => {
      it('should delete a category within reasonable time', async() => {
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

      it('should delete 100 categories in reasonable time', async() => {
        // Arrange
        const count = 100;
        const categoryIds = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Performance Category ${i}` });
          categoryIds.push(created.id);
        }

        const startTime = Date.now();

        // Act
        for (const id of categoryIds) {
          await sut.execute(id);
        }

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

        const remaining = await prisma.serviceCategory.findMany();
        expect(remaining).toHaveLength(0);
      });
    });

    describe('edge cases', () => {
      it('should handle deletion with whitespace in id gracefully', async() => {
        // Act & Assert
        await expect(sut.execute('  ')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should handle deletion with special characters in id', async() => {
        // Act & Assert
        await expect(sut.execute('id-with-special-chars-!@#$%')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should handle deletion with very long id', async() => {
        // Arrange
        const veryLongId = 'a'.repeat(1000);

        // Act & Assert
        await expect(sut.execute(veryLongId)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should handle deletion when database is empty', async() => {
        // Arrange
        await prisma.serviceCategory.deleteMany();

        // Act & Assert
        await expect(sut.execute('any-id')).rejects.toThrow(ServiceCategoryNotFoundError);
      });
    });
  });
});
