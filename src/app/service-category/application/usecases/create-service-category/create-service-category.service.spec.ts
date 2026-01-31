import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { FindServiceCategoryById } from '../find-service-category-by-id/find-service-category-by-id.service';
import { CreateServiceCategory } from './create-service-category.service';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from './dtos/create-service-category.dto';

describe('CreateServiceCategory', () => {
  let sut: CreateServiceCategory;
  let prisma: PrismaService;
  let findServiceCategoryById: FindServiceCategoryById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceCategoryModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateServiceCategory);
    prisma = module.get(PrismaService);
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
    it('should call serviceCategoryDao.save with correct values', async() => {
      // Arrange
      const id = 'service-category-id-123';
      const input = createMock<CreateServiceCategoryInputDto>({ name: 'Manutenção' });
      const serviceCategoryDaoSpy = jest.spyOn(sut['serviceCategoryDao'], 'save').mockResolvedValue(id);

      // Act
      await sut.execute(input);

      // Assert
      expect(serviceCategoryDaoSpy).toHaveBeenCalledWith(input);
    });

    it('should return correct output dto', async() => {
      // Arrange
      const id = 'service-category-id-456';
      const input = createMock<CreateServiceCategoryInputDto>({ name: 'Instalação' });
      jest.spyOn(sut['serviceCategoryDao'], 'save').mockResolvedValue(id);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual<CreateServiceCategoryOutputDto>({ id });
    });

    it('should generate a unique id for each service category created', async() => {
      // Arrange
      const input1 = createMock<CreateServiceCategoryInputDto>({ name: 'Categoria 1' });
      const input2 = createMock<CreateServiceCategoryInputDto>({ name: 'Categoria 2' });

      const id1 = 'unique-id-1';
      const id2 = 'unique-id-2';

      const saveSpy = jest.spyOn(sut['serviceCategoryDao'], 'save')
        .mockResolvedValueOnce(id1)
        .mockResolvedValueOnce(id2);

      // Act
      const result1 = await sut.execute(input1);
      const result2 = await sut.execute(input2);

      // Assert
      expect(result1.id).toBe(id1);
      expect(result2.id).toBe(id2);
      expect(result1.id).not.toBe(result2.id);
      expect(saveSpy).toHaveBeenCalledTimes(2);
    });

    it('should propagate error when serviceCategoryDao.save fails', async() => {
      // Arrange
      const input = createMock<CreateServiceCategoryInputDto>({ name: 'Test' });
      const error = new Error('Database error');
      jest.spyOn(sut['serviceCategoryDao'], 'save').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow('Database error');
    });
  });

  describe('integration tests', () => {
    describe('successful creation scenarios', () => {
      it('should create a service category with valid data', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Manutenção Preventiva',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory).toEqual<ServiceCategoryDto>({
          id: output.id,
          name: input.name,
          active: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it('should create a service category with minimum valid name length', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'A',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory.name).toBe('A');
      });

      it('should create a service category with maximum valid name length (256 chars)', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'A'.repeat(256),
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory.name).toBe('A'.repeat(256));
      });

      it('should create a service category with special characters in name', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Manutenção & Instalação - Serviços Técnicos!',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory.name).toBe(input.name);
      });

      it('should create a service category with numbers in name', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Manutenção Nível 1',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory.name).toBe(input.name);
      });

      it('should create a service category with accented characters', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Instalação Elétrica e Hidráulica',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory.name).toBe(input.name);
      });

      it('should create a service category with emojis in name', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Consultoria 💡',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory).toBeDefined();
        expect(createdCategory.name).toBe(input.name);
      });

      it('should set active to true by default', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Categoria Ativa',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory.active).toBe(true);
      });

      it('should set createdAt and updatedAt timestamps', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Categoria com Timestamps',
        };
        const beforeCreation = new Date();

        // Act
        const output = await sut.execute(input);

        // Assert
        const afterCreation = new Date();
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory.createdAt).toBeInstanceOf(Date);
        expect(createdCategory.updatedAt).toBeInstanceOf(Date);
        expect(createdCategory.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(createdCategory.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      });
    });

    describe('uniqueness constraint scenarios', () => {
      it('should throw error when trying to create a service category with duplicate name (exact match)', async() => {
        // Arrange
        await prisma.serviceCategory.create({
          data: { name: 'Consultoria' },
        });
        const input: CreateServiceCategoryInputDto = {
          name: 'Consultoria',
        };

        // Act & Assert
        await expect(sut.execute(input)).rejects.toThrow();
      });

      it('should throw error when trying to create a service category with duplicate name (case insensitive)', async() => {
        // Arrange
        await prisma.serviceCategory.create({
          data: { name: 'Instalação' },
        });
        const input: CreateServiceCategoryInputDto = {
          name: 'INSTALAÇÃO',
        };

        // Act & Assert
        await expect(sut.execute(input)).rejects.toThrow();
      });

      it('should throw error for lowercase duplicate', async() => {
        // Arrange
        await prisma.serviceCategory.create({
          data: { name: 'Manutenção' },
        });
        const input: CreateServiceCategoryInputDto = {
          name: 'manutenção',
        };

        // Act & Assert
        await expect(sut.execute(input)).rejects.toThrow();
      });

      it('should throw error for mixed case duplicate', async() => {
        // Arrange
        await prisma.serviceCategory.create({
          data: { name: 'Suporte Técnico' },
        });
        const input: CreateServiceCategoryInputDto = {
          name: 'SuPoRtE tÉcNiCo',
        };

        // Act & Assert
        await expect(sut.execute(input)).rejects.toThrow();
      });

      it('should allow creating categories with similar but different names', async() => {
        // Arrange
        await prisma.serviceCategory.create({
          data: { name: 'Manutenção' },
        });
        const input: CreateServiceCategoryInputDto = {
          name: 'Manutenção Preventiva',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        expect(output.id).toBeDefined();
        const createdCategory = await findServiceCategoryById.execute(output.id);
        expect(createdCategory.name).toBe('Manutenção Preventiva');
      });
    });

    describe('bulk creation scenarios', () => {
      it('should create multiple service categories sequentially', async() => {
        // Arrange
        const categories = [
          'Manutenção',
          'Instalação',
          'Consultoria',
          'Suporte',
          'Treinamento',
        ];

        // Act
        const results = [];
        for (const name of categories) {
          const output = await sut.execute({ name });
          results.push(output);
        }

        // Assert
        expect(results).toHaveLength(5);
        const allCategories = await prisma.serviceCategory.findMany();
        expect(allCategories).toHaveLength(5);
        expect(allCategories.map(c => c.name).sort()).toEqual(categories.sort());
      });

      it('should create 50 service categories with unique names', async() => {
        // Arrange
        const count = 50;
        const categories = Array.from({ length: count }, (_, i) => `Categoria ${i + 1}`);

        // Act
        const results = [];
        for (const name of categories) {
          const output = await sut.execute({ name });
          results.push(output);
        }

        // Assert
        expect(results).toHaveLength(count);
        const allCategories = await prisma.serviceCategory.findMany();
        expect(allCategories).toHaveLength(count);

        const uniqueIds = new Set(results.map(r => r.id));
        expect(uniqueIds.size).toBe(count);
      });
    });

    describe('concurrency scenarios', () => {
      it('should handle concurrent creation of different categories', async() => {
        // Arrange
        const categories = [
          'Categoria A',
          'Categoria B',
          'Categoria C',
          'Categoria D',
          'Categoria E',
        ];

        // Act
        const promises = categories.map(name => sut.execute({ name }));
        const results = await Promise.all(promises);

        // Assert
        expect(results).toHaveLength(5);
        const allCategories = await prisma.serviceCategory.findMany();
        expect(allCategories).toHaveLength(5);
      });

      it('should reject at least one when trying to create duplicate categories concurrently', async() => {
        // Arrange
        const sameName = 'Categoria Duplicada';
        const promises = [
          sut.execute({ name: sameName }),
          sut.execute({ name: sameName }),
          sut.execute({ name: sameName }),
        ];

        // Act & Assert
        const results = await Promise.allSettled(promises);
        const rejected = results.filter(r => r.status === 'rejected');
        const fulfilled = results.filter(r => r.status === 'fulfilled');

        expect(fulfilled.length).toBe(1); // Only one should succeed
        expect(rejected.length).toBe(2); // Two should fail
      });
    });

    describe('persistence verification', () => {
      it('should persist all fields correctly in database', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Categoria Persistida',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const directFromDb = await prisma.serviceCategory.findUnique({
          where: { id: output.id },
        });
        expect(directFromDb).toBeDefined();
        expect(directFromDb?.id).toBe(output.id);
        expect(directFromDb?.name).toBe(input.name);
        expect(directFromDb?.active).toBe(true);
        expect(directFromDb?.createdAt).toBeInstanceOf(Date);
        expect(directFromDb?.updatedAt).toBeInstanceOf(Date);
      });

      it('should return id that can be used to retrieve the category', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Categoria Recuperável',
        };

        // Act
        const output = await sut.execute(input);

        // Assert
        const retrieved = await findServiceCategoryById.execute(output.id);
        expect(retrieved).toBeDefined();
        expect(retrieved.id).toBe(output.id);
        expect(retrieved.name).toBe(input.name);
      });
    });

    describe('performance tests', () => {
      it('should create a service category within reasonable time', async() => {
        // Arrange
        const input: CreateServiceCategoryInputDto = {
          name: 'Performance Test',
        };
        const startTime = Date.now();

        // Act
        await sut.execute(input);

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should create 100 categories in reasonable time', async() => {
        // Arrange
        const count = 100;
        const startTime = Date.now();

        // Act
        for (let i = 0; i < count; i++) {
          await sut.execute({ name: `Performance Category ${i}` });
        }

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

        const allCategories = await prisma.serviceCategory.findMany();
        expect(allCategories).toHaveLength(count);
      });
    });
  });
});
