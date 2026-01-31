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
import { UpdateServiceCategoryStatus } from './update-service-category-status.service';

describe('UpdateServiceCategoryStatus', () => {
  let sut: UpdateServiceCategoryStatus;
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

    sut = module.get(UpdateServiceCategoryStatus);
    prisma = module.get(PrismaService);
    createServiceCategory = module.get(CreateServiceCategory);
    findServiceCategoryById = module.get(FindServiceCategoryById);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw ServiceCategoryNotFoundError if category does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const findByIdSpy = jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const updateStatusSpy = jest.spyOn(sut['serviceCategoryDao'], 'updateStatus');

      // Act & Assert
      expect.assertions(3);
      return sut.execute(id).catch((error) => {
        expect(error).toBeInstanceOf(ServiceCategoryNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith(id);
        expect(updateStatusSpy).not.toHaveBeenCalled();
      });
    });

    it('should call serviceCategoryDao.findById and serviceCategoryDao.updateStatus with correct values', async() => {
      // Arrange
      const id = 'category-id-123';
      const mockCategory = createMock<ServiceCategoryDto>({ id, active: true });
      const findByIdSpy = jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(mockCategory);
      const updateStatusSpy = jest.spyOn(sut['serviceCategoryDao'], 'updateStatus').mockResolvedValue();

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(updateStatusSpy).toHaveBeenCalledWith(id, false);
      expect(result).toEqual<SuccessMessage>({ message: 'Status da categoria de serviço atualizado com sucesso!' });
    });

    it('should toggle status from active to inactive', async() => {
      // Arrange
      const id = 'category-id-123';
      const activeCategory = createMock<ServiceCategoryDto>({ id, active: true });
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(activeCategory);
      const updateStatusSpy = jest.spyOn(sut['serviceCategoryDao'], 'updateStatus').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(updateStatusSpy).toHaveBeenCalledWith(id, false);
    });

    it('should toggle status from inactive to active', async() => {
      // Arrange
      const id = 'category-id-123';
      const inactiveCategory = createMock<ServiceCategoryDto>({ id, active: false });
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(inactiveCategory);
      const updateStatusSpy = jest.spyOn(sut['serviceCategoryDao'], 'updateStatus').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(updateStatusSpy).toHaveBeenCalledWith(id, true);
    });

    it('should return success message', async() => {
      // Arrange
      const mockCategory = createMock<ServiceCategoryDto>({ active: true });
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(mockCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'updateStatus').mockResolvedValue();

      // Act
      const result = await sut.execute('any-id');

      // Assert
      expect(result.message).toBe('Status da categoria de serviço atualizado com sucesso!');
    });

    it('should not call updateStatus if category not found', async() => {
      // Arrange
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const updateStatusSpy = jest.spyOn(sut['serviceCategoryDao'], 'updateStatus');

      // Act & Assert
      try {
        await sut.execute('non-existing-id');
      } catch (error) {
        // Expected error
      }
      expect(updateStatusSpy).not.toHaveBeenCalled();
    });
  });

  describe('integration tests', () => {
    describe('error scenarios', () => {
      it('should throw ServiceCategoryNotFoundError if category does not exist', async() => {
        // Arrange
        const id = 'non-existing-category-id';

        // Act & Assert
        await expect(sut.execute(id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with invalid UUID', async() => {
        // Act & Assert
        await expect(sut.execute('invalid-uuid')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with empty string id', async() => {
        // Act & Assert
        await expect(sut.execute('')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with random UUID', async() => {
        // Act & Assert
        await expect(sut.execute('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error with whitespace id', async() => {
        // Act & Assert
        await expect(sut.execute('   ')).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw error for deleted category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'To Be Deleted' });
        await prisma.serviceCategory.delete({ where: { id: created.id } });

        // Act & Assert
        await expect(sut.execute(created.id)).rejects.toThrow(ServiceCategoryNotFoundError);
      });
    });

    describe('toggle from active to inactive', () => {
      it('should toggle active category to inactive', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Active Category' });
        const before = await findServiceCategoryById.execute(created.id);
        expect(before.active).toBe(true);

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Status da categoria de serviço atualizado com sucesso!' });
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(false);
      });

      it('should update status correctly in database', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Test Category' });

        // Act
        await sut.execute(created.id);

        // Assert
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: created.id },
        });
        expect(directFromDb?.active).toBe(false);
      });

      it('should preserve all other fields when toggling status', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Preserve Fields' });
        const before = await findServiceCategoryById.execute(created.id);

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.id).toBe(before.id);
        expect(after.name).toBe(before.name);
        expect(after.createdAt).toEqual(before.createdAt);
        // Only active should change
        expect(after.active).not.toBe(before.active);
      });

      it('should toggle category with simple name', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'A' });

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(false);
      });

      it('should toggle category with long name', async() => {
        // Arrange
        const longName = 'A'.repeat(256);
        const created = await createServiceCategory.execute({ name: longName });

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(false);
      });

      it('should toggle category with special characters', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Categoria & Serviço - 2025!' });

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(false);
      });

      it('should toggle category with emojis', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Consultoria 💡' });

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(false);
      });

      it('should toggle recently created category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Recent' });

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(false);
      });
    });

    describe('toggle from inactive to active', () => {
      it('should toggle inactive category to active', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: { name: 'Inactive Category', active: false },
        });
        expect(created.active).toBe(false);

        // Act
        const result = await sut.execute(created.id);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Status da categoria de serviço atualizado com sucesso!' });
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.active).toBe(true);
      });

      it('should activate inactive category correctly in database', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: { name: 'Activate Me', active: false },
        });

        // Act
        await sut.execute(created.id);

        // Assert
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: created.id },
        });
        expect(directFromDb?.active).toBe(true);
      });

      it('should preserve all fields when activating', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: { name: 'Preserve on Activate', active: false },
        });
        const before = await findServiceCategoryById.execute(created.id);

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.id).toBe(before.id);
        expect(after.name).toBe(before.name);
        expect(after.createdAt).toEqual(before.createdAt);
        expect(after.active).toBe(true);
      });
    });

    describe('multiple toggles', () => {
      it('should toggle status multiple times correctly', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Toggle Multiple' });
        expect((await findServiceCategoryById.execute(created.id)).active).toBe(true);

        // Act & Assert - First toggle (active -> inactive)
        await sut.execute(created.id);
        expect((await findServiceCategoryById.execute(created.id)).active).toBe(false);

        // Second toggle (inactive -> active)
        await sut.execute(created.id);
        expect((await findServiceCategoryById.execute(created.id)).active).toBe(true);

        // Third toggle (active -> inactive)
        await sut.execute(created.id);
        expect((await findServiceCategoryById.execute(created.id)).active).toBe(false);

        // Fourth toggle (inactive -> active)
        await sut.execute(created.id);
        expect((await findServiceCategoryById.execute(created.id)).active).toBe(true);
      });

      it('should return success message on every toggle', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Success Messages' });

        // Act & Assert
        const result1 = await sut.execute(created.id);
        expect(result1.message).toBe('Status da categoria de serviço atualizado com sucesso!');

        const result2 = await sut.execute(created.id);
        expect(result2.message).toBe('Status da categoria de serviço atualizado com sucesso!');

        const result3 = await sut.execute(created.id);
        expect(result3.message).toBe('Status da categoria de serviço atualizado com sucesso!');
      });
    });

    describe('bulk status update scenarios', () => {
      it('should toggle status for multiple categories', async() => {
        // Arrange
        const categories = [];
        for (let i = 1; i <= 5; i++) {
          const created = await createServiceCategory.execute({ name: `Categoria ${i}` });
          categories.push(created);
        }

        // Act
        for (const category of categories) {
          await sut.execute(category.id);
        }

        // Assert
        for (const category of categories) {
          const updated = await findServiceCategoryById.execute(category.id);
          expect(updated.active).toBe(false);
        }
      });

      it('should toggle some categories and keep others', async() => {
        // Arrange
        const toToggle = [
          await createServiceCategory.execute({ name: 'Toggle 1' }),
          await createServiceCategory.execute({ name: 'Toggle 2' }),
        ];
        const toKeep = [
          await createServiceCategory.execute({ name: 'Keep 1' }),
          await createServiceCategory.execute({ name: 'Keep 2' }),
        ];

        // Act
        for (const category of toToggle) {
          await sut.execute(category.id);
        }

        // Assert
        for (const category of toToggle) {
          const updated = await findServiceCategoryById.execute(category.id);
          expect(updated.active).toBe(false);
        }
        for (const category of toKeep) {
          const kept = await findServiceCategoryById.execute(category.id);
          expect(kept.active).toBe(true);
        }
      });

      it('should toggle 20 categories successfully', async() => {
        // Arrange
        const count = 20;
        const categoryIds = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Category ${i}` });
          categoryIds.push(created.id);
        }

        // Act
        for (const id of categoryIds) {
          await sut.execute(id);
        }

        // Assert
        const allCategories = await prisma.serviceCategory.findMany();
        expect(allCategories).toHaveLength(count);
        expect(allCategories.every(c => c.active === false)).toBe(true);
      });
    });

    describe('timestamp updates', () => {
      it('should update updatedAt timestamp when toggling status', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Timestamp Test' });
        const before = await findServiceCategoryById.execute(created.id);

        // Wait to ensure time difference
        await new Promise(resolve => setTimeout(resolve, 100));

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
      });

      it('should not change createdAt timestamp', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'CreatedAt Test' });
        const before = await findServiceCategoryById.execute(created.id);
        const originalCreatedAt = before.createdAt;

        // Act
        await sut.execute(created.id);

        // Assert
        const after = await findServiceCategoryById.execute(created.id);
        expect(after.createdAt).toEqual(originalCreatedAt);
      });

      it('should update updatedAt on each toggle', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Multiple Updates' });

        // Act & Assert
        let previousUpdatedAt = (await findServiceCategoryById.execute(created.id)).updatedAt;

        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          await sut.execute(created.id);
          const current = await findServiceCategoryById.execute(created.id);
          expect(current.updatedAt.getTime()).toBeGreaterThan(previousUpdatedAt.getTime());
          previousUpdatedAt = current.updatedAt;
        }
      });
    });

    describe('database consistency', () => {
      it('should maintain database count after status toggle', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Cat 1' });
        const toToggle = await createServiceCategory.execute({ name: 'Cat 2' });
        await createServiceCategory.execute({ name: 'Cat 3' });

        const beforeCount = await prisma.serviceCategory.count();
        expect(beforeCount).toBe(3);

        // Act
        await sut.execute(toToggle.id);

        // Assert
        const afterCount = await prisma.serviceCategory.count();
        expect(afterCount).toBe(3);
      });

      it('should verify status change is persisted in database', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Persist Test' });

        // Act
        await sut.execute(created.id);

        // Assert
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: created.id },
        });
        expect(directFromDb).not.toBeNull();
        expect(directFromDb?.active).toBe(false);
      });

      it('should not affect other categories when toggling one', async() => {
        // Arrange
        const cat1 = await createServiceCategory.execute({ name: 'Category 1' });
        const cat2 = await createServiceCategory.execute({ name: 'Category 2' });
        const cat3 = await createServiceCategory.execute({ name: 'Category 3' });

        // Act
        await sut.execute(cat2.id);

        // Assert
        const updated1 = await findServiceCategoryById.execute(cat1.id);
        const updated2 = await findServiceCategoryById.execute(cat2.id);
        const updated3 = await findServiceCategoryById.execute(cat3.id);

        expect(updated1.active).toBe(true);
        expect(updated2.active).toBe(false); // Only this should change
        expect(updated3.active).toBe(true);
      });
    });

    describe('concurrent operations', () => {
      it('should handle concurrent toggles of same category gracefully', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Concurrent' });

        // Act - Execute concurrently (may cause race condition)
        const promises = [
          sut.execute(created.id),
          sut.execute(created.id),
          sut.execute(created.id),
        ];
        await Promise.allSettled(promises);

        // Assert - Final state should be either active or inactive (not undefined)
        const final = await findServiceCategoryById.execute(created.id);
        expect(typeof final.active).toBe('boolean');
      });

      it('should handle concurrent toggles of different categories', async() => {
        // Arrange
        const cat1 = await createServiceCategory.execute({ name: 'Concurrent 1' });
        const cat2 = await createServiceCategory.execute({ name: 'Concurrent 2' });
        const cat3 = await createServiceCategory.execute({ name: 'Concurrent 3' });

        // Act
        await Promise.all([
          sut.execute(cat1.id),
          sut.execute(cat2.id),
          sut.execute(cat3.id),
        ]);

        // Assert
        const updated1 = await findServiceCategoryById.execute(cat1.id);
        const updated2 = await findServiceCategoryById.execute(cat2.id);
        const updated3 = await findServiceCategoryById.execute(cat3.id);

        expect(updated1.active).toBe(false);
        expect(updated2.active).toBe(false);
        expect(updated3.active).toBe(false);
      });
    });

    describe('performance tests', () => {
      it('should toggle status within reasonable time', async() => {
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

      it('should toggle 100 categories in reasonable time', async() => {
        // Arrange
        const count = 100;
        const categoryIds = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Category ${i}` });
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
      });
    });

    describe('edge cases', () => {
      it('should handle toggling old category', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: {
            name: 'Old Category',
            createdAt: new Date('2020-01-01'),
            updatedAt: new Date('2020-01-01'),
          },
        });

        // Act
        await sut.execute(created.id);

        // Assert
        const updated = await findServiceCategoryById.execute(created.id);
        expect(updated.active).toBe(false);
      });

      it('should handle category with unicode name', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Serviço 中文' });

        // Act
        await sut.execute(created.id);

        // Assert
        const updated = await findServiceCategoryById.execute(created.id);
        expect(updated.active).toBe(false);
        expect(updated.name).toBe('Serviço 中文');
      });
    });
  });
});
