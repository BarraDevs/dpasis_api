import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceDuplicateCategoryError } from 'src/app/service-category/domain/errors/duplicate-service-category.error';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { CreateServiceCategory } from '../create-service-category/create-service-category.service';
import { FindServiceCategoryById } from '../find-service-category-by-id/find-service-category-by-id.service';
import { EditServiceCategoryInputDto } from './dtos/edit-service-category.dto';
import { EditServiceCategory } from './edit-service-category.service';

describe('EditServiceCategory', () => {
  let sut: EditServiceCategory;
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

    sut = module.get(EditServiceCategory);
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
    it('should call serviceCategoryDao.findById and serviceCategoryDao.edit with correct values', async() => {
      // Arrange
      const id = 'service-category-id-1';
      const serviceCategory = createMock<ServiceCategoryDto>({ id, name: 'Old Name' });
      const input = createMock<EditServiceCategoryInputDto>({ name: 'New Name' });
      const findByIdSpy = jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      const findByNameSpy = jest.spyOn(sut['serviceCategoryDao'], 'findByName').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['serviceCategoryDao'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id, input);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(findByNameSpy).toHaveBeenCalledWith(input.name);
      expect(editSpy).toHaveBeenCalledWith(id, input);
    });

    it('should throw ServiceCategoryNotFoundError if serviceCategoryDao.findById returns null', async() => {
      // Arrange
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const id = 'non-existing-id';
      const input = createMock<EditServiceCategoryInputDto>();

      // Act & Assert
      await expect(sut.execute(id, input)).rejects.toThrow(ServiceCategoryNotFoundError);
    });

    it('should throw ServiceDuplicateCategoryError if name already exists for another category', async() => {
      // Arrange
      const id = 'category-id-1';
      const existingCategory = createMock<ServiceCategoryDto>({ id, name: 'Original' });
      const duplicateCategory = createMock<ServiceCategoryDto>({ id: 'other-id', name: 'Duplicate' });
      const input = createMock<EditServiceCategoryInputDto>({ name: 'Duplicate' });

      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(existingCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'findByName').mockResolvedValue(duplicateCategory);

      // Act & Assert
      await expect(sut.execute(id, input)).rejects.toThrow(ServiceDuplicateCategoryError);
    });

    it('should allow editing to the same name (no change)', async() => {
      // Arrange
      const id = 'category-id-1';
      const serviceCategory = createMock<ServiceCategoryDto>({ id, name: 'Same Name' });
      const input = createMock<EditServiceCategoryInputDto>({ name: 'Same Name' });

      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'findByName').mockResolvedValue(serviceCategory);
      const editSpy = jest.spyOn(sut['serviceCategoryDao'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id, input);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(id, input);
    });

    it('should return a success message on successful edit', async() => {
      // Arrange
      const serviceCategory = createMock<ServiceCategoryDto>();
      const input = createMock<EditServiceCategoryInputDto>();
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'findByName').mockResolvedValue(null);
      jest.spyOn(sut['serviceCategoryDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(serviceCategory.id, input);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço atualizada com sucesso!' });
    });

    it('should not call edit if category not found', async() => {
      // Arrange
      const id = 'non-existing-id';
      const input = createMock<EditServiceCategoryInputDto>();
      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['serviceCategoryDao'], 'edit');

      // Act & Assert
      try {
        await sut.execute(id, input);
      } catch (error) {
        // Expected error
      }
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should not call edit if duplicate name found', async() => {
      // Arrange
      const id = 'category-id-1';
      const serviceCategory = createMock<ServiceCategoryDto>({ id, name: 'Original' });
      const duplicateCategory = createMock<ServiceCategoryDto>({ id: 'other-id', name: 'Duplicate' });
      const input = createMock<EditServiceCategoryInputDto>({ name: 'Duplicate' });

      jest.spyOn(sut['serviceCategoryDao'], 'findById').mockResolvedValue(serviceCategory);
      jest.spyOn(sut['serviceCategoryDao'], 'findByName').mockResolvedValue(duplicateCategory);
      const editSpy = jest.spyOn(sut['serviceCategoryDao'], 'edit');

      // Act & Assert
      try {
        await sut.execute(id, input);
      } catch (error) {
        // Expected error
      }
      expect(editSpy).not.toHaveBeenCalled();
    });
  });

  describe('integration tests', () => {
    describe('error scenarios', () => {
      it('should throw ServiceCategoryNotFoundError if service category does not exist', async() => {
        // Arrange
        const id = 'non-existing-id';
        const data = createMock<EditServiceCategoryInputDto>();

        // Act & Assert
        await expect(sut.execute(id, data)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceCategoryNotFoundError with invalid UUID', async() => {
        // Arrange
        const data: EditServiceCategoryInputDto = { name: 'New Name' };

        // Act & Assert
        await expect(sut.execute('invalid-uuid', data)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceCategoryNotFoundError with empty id', async() => {
        // Arrange
        const data: EditServiceCategoryInputDto = { name: 'New Name' };

        // Act & Assert
        await expect(sut.execute('', data)).rejects.toThrow(ServiceCategoryNotFoundError);
      });

      it('should throw ServiceDuplicateCategoryError when editing to existing name', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Categoria 1' });
        const existing2 = await createServiceCategory.execute({ name: 'Categoria 2' });
        const editData: EditServiceCategoryInputDto = { name: 'Categoria 1' };

        // Act & Assert
        await expect(sut.execute(existing2.id, editData)).rejects.toThrow(ServiceDuplicateCategoryError);
      });

      it('should throw ServiceDuplicateCategoryError with case-insensitive duplicate', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Manutenção' });
        const existing2 = await createServiceCategory.execute({ name: 'Instalação' });
        const editData: EditServiceCategoryInputDto = { name: 'MANUTENÇÃO' };

        // Act & Assert
        await expect(sut.execute(existing2.id, editData)).rejects.toThrow(ServiceDuplicateCategoryError);
      });

      it('should throw ServiceDuplicateCategoryError with lowercase duplicate', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Consultoria' });
        const existing2 = await createServiceCategory.execute({ name: 'Suporte' });
        const editData: EditServiceCategoryInputDto = { name: 'consultoria' };

        // Act & Assert
        await expect(sut.execute(existing2.id, editData)).rejects.toThrow(ServiceDuplicateCategoryError);
      });
    });

    describe('successful edit scenarios', () => {
      it('should edit a service category name', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original Name' });
        const editData: EditServiceCategoryInputDto = { name: 'Updated Name' };

        // Act
        const result = await sut.execute(created.id, editData);

        // Assert
        expect(result).toEqual<SuccessMessage>({ message: 'Categoria de serviço atualizada com sucesso!' });
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Updated Name');
      });

      it('should allow editing to the same name (no change)', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Same Name' });
        const editData: EditServiceCategoryInputDto = { name: 'Same Name' };

        // Act
        const result = await sut.execute(created.id, editData);

        // Assert
        expect(result.message).toBe('Categoria de serviço atualizada com sucesso!');
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Same Name');
      });

      it('should allow editing to same name with different case', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'ORIGINAL' };

        // Act
        const result = await sut.execute(created.id, editData);

        // Assert
        expect(result.message).toBe('Categoria de serviço atualizada com sucesso!');
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('ORIGINAL');
      });

      it('should edit name from simple to complex', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'A' });
        const editData: EditServiceCategoryInputDto = { name: 'Manutenção Preventiva e Corretiva' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Manutenção Preventiva e Corretiva');
      });

      it('should edit name from complex to simple', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Instalação Elétrica e Hidráulica' });
        const editData: EditServiceCategoryInputDto = { name: 'B' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('B');
      });

      it('should edit name to maximum length (256 chars)', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Short' });
        const longName = 'A'.repeat(256);
        const editData: EditServiceCategoryInputDto = { name: longName };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe(longName);
        expect(edited.name.length).toBe(256);
      });

      it('should preserve accents when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'Instalação Técnica' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Instalação Técnica');
      });

      it('should preserve special characters when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'Categoria & Serviço - 2025!' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Categoria & Serviço - 2025!');
      });

      it('should preserve emojis when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'Consultoria 💡' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Consultoria 💡');
      });

      it('should preserve numbers when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'Serviço Nível 1' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Serviço Nível 1');
      });

      it('should not change id when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const originalId = created.id;
        const editData: EditServiceCategoryInputDto = { name: 'Updated' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.id).toBe(originalId);
      });

      it('should not change active status when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'Updated' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.active).toBe(true);
      });

      it('should not change createdAt when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const original = await findServiceCategoryById.execute(created.id);
        const originalCreatedAt = original.createdAt;

        // Wait a bit to ensure time difference
        await new Promise(resolve => setTimeout(resolve, 10));

        const editData: EditServiceCategoryInputDto = { name: 'Updated' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.createdAt).toEqual(originalCreatedAt);
      });

      it('should update updatedAt when editing', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const original = await findServiceCategoryById.execute(created.id);
        const originalUpdatedAt = original.updatedAt;

        // Wait a bit to ensure time difference
        await new Promise(resolve => setTimeout(resolve, 100));

        const editData: EditServiceCategoryInputDto = { name: 'Updated' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });

    describe('bulk edit scenarios', () => {
      it('should edit multiple categories sequentially', async() => {
        // Arrange
        const categories = await Promise.all([
          createServiceCategory.execute({ name: 'Categoria 1' }),
          createServiceCategory.execute({ name: 'Categoria 2' }),
          createServiceCategory.execute({ name: 'Categoria 3' }),
        ]);

        // Act
        await sut.execute(categories[0].id, { name: 'Updated 1' });
        await sut.execute(categories[1].id, { name: 'Updated 2' });
        await sut.execute(categories[2].id, { name: 'Updated 3' });

        // Assert
        const updated1 = await findServiceCategoryById.execute(categories[0].id);
        const updated2 = await findServiceCategoryById.execute(categories[1].id);
        const updated3 = await findServiceCategoryById.execute(categories[2].id);
        expect(updated1.name).toBe('Updated 1');
        expect(updated2.name).toBe('Updated 2');
        expect(updated3.name).toBe('Updated 3');
      });

      it('should edit some categories and keep others unchanged', async() => {
        // Arrange
        const toEdit = await createServiceCategory.execute({ name: 'To Edit' });
        const toKeep = await createServiceCategory.execute({ name: 'To Keep' });

        // Act
        await sut.execute(toEdit.id, { name: 'Edited' });

        // Assert
        const edited = await findServiceCategoryById.execute(toEdit.id);
        const kept = await findServiceCategoryById.execute(toKeep.id);
        expect(edited.name).toBe('Edited');
        expect(kept.name).toBe('To Keep');
      });

      it('should handle multiple edits on same category', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });

        // Act
        await sut.execute(created.id, { name: 'First Edit' });
        await sut.execute(created.id, { name: 'Second Edit' });
        await sut.execute(created.id, { name: 'Third Edit' });

        // Assert
        const final = await findServiceCategoryById.execute(created.id);
        expect(final.name).toBe('Third Edit');
      });

      it('should edit 10 categories successfully', async() => {
        // Arrange
        const count = 10;
        const categories = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Original ${i}` });
          categories.push(created);
        }

        // Act
        for (let i = 0; i < count; i++) {
          await sut.execute(categories[i].id, { name: `Updated ${i}` });
        }

        // Assert
        for (let i = 0; i < count; i++) {
          const updated = await findServiceCategoryById.execute(categories[i].id);
          expect(updated.name).toBe(`Updated ${i}`);
        }
      });
    });

    describe('verification after edit', () => {
      it('should verify category exists in database after edit', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });

        // Act
        await sut.execute(created.id, { name: 'Updated' });

        // Assert
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: created.id },
        });
        expect(directFromDb).toBeDefined();
        expect(directFromDb?.name).toBe('Updated');
      });

      it('should not affect total count when editing', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Cat 1' });
        const toEdit = await createServiceCategory.execute({ name: 'Cat 2' });
        await createServiceCategory.execute({ name: 'Cat 3' });

        const beforeCount = await prisma.serviceCategory.count();
        expect(beforeCount).toBe(3);

        // Act
        await sut.execute(toEdit.id, { name: 'Updated Cat 2' });

        // Assert
        const afterCount = await prisma.serviceCategory.count();
        expect(afterCount).toBe(3);
      });
    });

    describe('performance tests', () => {
      it('should edit a category within reasonable time', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Performance Test' });
        const startTime = Date.now();

        // Act
        await sut.execute(created.id, { name: 'Updated Performance' });

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should edit 100 categories in reasonable time', async() => {
        // Arrange
        const count = 100;
        const categoryIds = [];
        for (let i = 0; i < count; i++) {
          const created = await createServiceCategory.execute({ name: `Category ${i}` });
          categoryIds.push(created.id);
        }

        const startTime = Date.now();

        // Act
        for (let i = 0; i < count; i++) {
          await sut.execute(categoryIds[i], { name: `Updated ${i}` });
        }

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
      });
    });

    describe('edge cases', () => {
      it('should handle editing with unicode characters', async() => {
        // Arrange
        const created = await createServiceCategory.execute({ name: 'Original' });
        const editData: EditServiceCategoryInputDto = { name: 'Serviço 中文 日本語' };

        // Act
        await sut.execute(created.id, editData);

        // Assert
        const edited = await findServiceCategoryById.execute(created.id);
        expect(edited.name).toBe('Serviço 中文 日本語');
      });

      it('should handle editing inactive category', async() => {
        // Arrange
        const created = await prisma.serviceCategory.create({
          data: { name: 'Inactive', active: false },
        });

        // Act
        const result = await sut.execute(created.id, { name: 'Updated Inactive' });

        // Assert
        expect(result.message).toBe('Categoria de serviço atualizada com sucesso!');
        const edited = await prisma.serviceCategory.findUnique({ where: { id: created.id } });
        expect(edited?.name).toBe('Updated Inactive');
        expect(edited?.active).toBe(false);
      });
    });
  });
});
