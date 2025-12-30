import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { CreateServiceCategory } from '../create-service-category/create-service-category.service';
import { FindAllServiceCategoryQueryDto } from './dtos/find-all-service-category.dto';
import { FindAllServiceCategory } from './find-all-service-category.service';

describe('FindAllServiceCategory', () => {
  let sut: FindAllServiceCategory;
  let prisma: PrismaService;
  let createServiceCategory: CreateServiceCategory;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ServiceCategoryModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllServiceCategory);
    prisma = module.get(PrismaService);
    createServiceCategory = module.get(CreateServiceCategory);

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
    it('should call serviceCategoryDao.findAll with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllServiceCategoryQueryDto>({ page: 2, size: 5, search: 'manutenção' });
      const findAllSpy = jest.spyOn(sut['serviceCategoryDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return paginated result from dao', async() => {
      // Arrange
      const queries = createMock<FindAllServiceCategoryQueryDto>({ page: 1, size: 10 });
      const mockCategories = [
        createMock<ServiceCategoryDto>({ name: 'Cat 1' }),
        createMock<ServiceCategoryDto>({ name: 'Cat 2' }),
      ];
      jest.spyOn(sut['serviceCategoryDao'], 'findAll').mockResolvedValue([mockCategories, 2]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
    });

    it('should handle empty results', async() => {
      // Arrange
      const queries = createMock<FindAllServiceCategoryQueryDto>({ page: 1, size: 10 });
      jest.spyOn(sut['serviceCategoryDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
    });
  });

  describe('integration tests', () => {
    describe('empty database scenarios', () => {
      it('should return an empty pagination object when no categories exist', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        expect(result).toEqual<IPagination<ServiceCategoryDto>>({
          data: [],
          currentPage: 1,
          itemsPerPage: 0,
          totalItems: 0,
          totalPages: 0,
        });
      });

      it('should return empty result with pagination parameters', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 10 });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalItems).toBe(0);
        expect(result.currentPage).toBe(1);
      });

      it('should return empty result with search parameter', async() => {
        // Act
        const result = await sut.execute({ search: 'nonexistent' });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalItems).toBe(0);
      });
    });

    describe('basic retrieval scenarios', () => {
      it('should return all service categories when no filters are applied', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Manutenção' });
        await createServiceCategory.execute({ name: 'Instalação' });
        await createServiceCategory.execute({ name: 'Consultoria' });

        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(3);
        expect(result.data).toHaveLength(3);
      });

      it('should return single category', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Única Categoria' });

        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Única Categoria');
      });

      it('should return 10 categories', async() => {
        // Arrange
        for (let i = 1; i <= 10; i++) {
          await createServiceCategory.execute({ name: `Categoria ${i}` });
        }

        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(10);
        expect(result.data).toHaveLength(10);
      });

      it('should return 100 categories', async() => {
        // Arrange
        for (let i = 1; i <= 100; i++) {
          await createServiceCategory.execute({ name: `Categoria ${i}` });
        }

        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(100);
        expect(result.data).toHaveLength(100);
      });

      it('should return categories with all fields populated', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Complete Category' });

        // Act
        const result = await sut.execute({});

        // Assert
        const category = result.data[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('active');
        expect(category).toHaveProperty('createdAt');
        expect(category).toHaveProperty('updatedAt');
        expect(category.id).toBeDefined();
        expect(category.name).toBe('Complete Category');
        expect(category.active).toBe(true);
      });
    });

    describe('pagination scenarios', () => {
      beforeEach(async() => {
        for (let i = 1; i <= 25; i++) {
          await createServiceCategory.execute({ name: `Categoria ${i.toString().padStart(2, '0')}` });
        }
      });

      it('should return first page with default size', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 10 });

        // Assert
        expect(result.data).toHaveLength(10);
        expect(result.totalItems).toBe(25);
        expect(result.totalPages).toBe(3);
        expect(result.currentPage).toBe(1);
        expect(result.itemsPerPage).toBe(10);
      });

      it('should return second page', async() => {
        // Act
        const result = await sut.execute({ page: 2, size: 10 });

        // Assert
        expect(result.data).toHaveLength(10);
        expect(result.totalItems).toBe(25);
        expect(result.totalPages).toBe(3);
        expect(result.currentPage).toBe(2);
      });

      it('should return last page with remaining items', async() => {
        // Act
        const result = await sut.execute({ page: 3, size: 10 });

        // Assert
        expect(result.data).toHaveLength(5);
        expect(result.totalItems).toBe(25);
        expect(result.totalPages).toBe(3);
        expect(result.currentPage).toBe(3);
      });

      it('should return empty data for page beyond total pages', async() => {
        // Act
        const result = await sut.execute({ page: 10, size: 10 });

        // Assert
        expect(result.data).toHaveLength(0);
        expect(result.totalItems).toBe(25);
        expect(result.currentPage).toBe(10);
      });

      it('should handle different page sizes', async() => {
        // Act
        const result5 = await sut.execute({ page: 1, size: 5 });
        const result20 = await sut.execute({ page: 1, size: 20 });
        const result25 = await sut.execute({ page: 1, size: 25 });

        // Assert
        expect(result5.data).toHaveLength(5);
        expect(result5.totalPages).toBe(5);

        expect(result20.data).toHaveLength(20);
        expect(result20.totalPages).toBe(2);

        expect(result25.data).toHaveLength(25);
        expect(result25.totalPages).toBe(1);
      });

      it('should handle size of 1', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 1 });

        // Assert
        expect(result.data).toHaveLength(1);
        expect(result.totalPages).toBe(25);
      });

      it('should handle large page size', async() => {
        // Act
        const result = await sut.execute({ page: 1, size: 100 });

        // Assert
        expect(result.data).toHaveLength(25);
        expect(result.totalPages).toBe(1);
      });

      it('should maintain consistency across pages', async() => {
        // Act
        const page1 = await sut.execute({ page: 1, size: 10 });
        const page2 = await sut.execute({ page: 2, size: 10 });
        const page3 = await sut.execute({ page: 3, size: 10 });

        // Assert
        const allIds = [
          ...page1.data.map(c => c.id),
          ...page2.data.map(c => c.id),
          ...page3.data.map(c => c.id),
        ];
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(allIds.length); // No duplicates
      });
    });

    describe('search scenarios', () => {
      beforeEach(async() => {
        await createServiceCategory.execute({ name: 'Manutenção Preventiva' });
        await createServiceCategory.execute({ name: 'Manutenção Corretiva' });
        await createServiceCategory.execute({ name: 'Instalação Elétrica' });
        await createServiceCategory.execute({ name: 'Instalação Hidráulica' });
        await createServiceCategory.execute({ name: 'Consultoria Técnica' });
        await createServiceCategory.execute({ name: 'Suporte Remoto' });
        await createServiceCategory.execute({ name: 'Treinamento' });
      });

      it('should filter by exact word match (case-insensitive)', async() => {
        // Act
        const result = await sut.execute({ search: 'manutenção' });

        // Assert
        expect(result.totalItems).toBe(2);
        expect(result.data).toHaveLength(2);
        expect(result.data.every(c => c.name.toLowerCase().includes('manutenção'))).toBe(true);
      });

      it('should filter by partial match', async() => {
        // Act
        const result = await sut.execute({ search: 'manut' });

        // Assert
        expect(result.totalItems).toBe(2);
        expect(result.data.every(c => c.name.toLowerCase().includes('manut'))).toBe(true);
      });

      it('should filter case-insensitively with uppercase', async() => {
        // Act
        const result = await sut.execute({ search: 'INSTALAÇÃO' });

        // Assert
        expect(result.totalItems).toBe(2);
        expect(result.data.every(c => c.name.toLowerCase().includes('instalação'))).toBe(true);
      });

      it('should filter case-insensitively with mixed case', async() => {
        // Act
        const result = await sut.execute({ search: 'InStAlAçÃo' });

        // Assert
        expect(result.totalItems).toBe(2);
      });

      it('should return single result for unique search', async() => {
        // Act
        const result = await sut.execute({ search: 'treinamento' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toBe('Treinamento');
      });

      it('should return empty result for non-matching search', async() => {
        // Act
        const result = await sut.execute({ search: 'Nonexistent' });

        // Assert
        expect(result.totalItems).toBe(0);
        expect(result.data).toHaveLength(0);
      });

      it('should filter by single character', async() => {
        // Act
        const result = await sut.execute({ search: 't' });

        // Assert
        expect(result.totalItems).toBeGreaterThan(0);
        expect(result.data.every(c => c.name.toLowerCase().includes('t'))).toBe(true);
      });

      it('should search with special characters', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Categoria & Serviço' });

        // Act
        const result = await sut.execute({ search: '&' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toBe('Categoria & Serviço');
      });

      it('should search with accents', async() => {
        // Act
        const result = await sut.execute({ search: 'técnica' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toBe('Consultoria Técnica');
      });

      it('should handle empty search string', async() => {
        // Act
        const result = await sut.execute({ search: '' });

        // Assert
        expect(result.totalItems).toBe(7);
      });

      it('should handle whitespace in search', async() => {
        // Act
        const result = await sut.execute({ search: '   ' });

        // Assert
        expect(result.totalItems).toBe(0);
      });
    });

    describe('search with pagination scenarios', () => {
      beforeEach(async() => {
        for (let i = 1; i <= 20; i++) {
          await createServiceCategory.execute({ name: `Serviço ${i}` });
        }
        for (let i = 1; i <= 15; i++) {
          await createServiceCategory.execute({ name: `Produto ${i}` });
        }
      });

      it('should combine search and pagination', async() => {
        // Act
        const result = await sut.execute({ search: 'serviço', page: 1, size: 5 });

        // Assert
        expect(result.data).toHaveLength(5);
        expect(result.totalItems).toBe(20);
        expect(result.totalPages).toBe(4);
        expect(result.currentPage).toBe(1);
      });

      it('should return second page of search results', async() => {
        // Act
        const result = await sut.execute({ search: 'produto', page: 2, size: 5 });

        // Assert
        expect(result.data).toHaveLength(5);
        expect(result.totalItems).toBe(15);
        expect(result.currentPage).toBe(2);
      });

      it('should handle last page of search results', async() => {
        // Act
        const result = await sut.execute({ search: 'serviço', page: 4, size: 5 });

        // Assert
        expect(result.data).toHaveLength(5);
        expect(result.totalItems).toBe(20);
        expect(result.currentPage).toBe(4);
      });
    });

    describe('ordering scenarios', () => {
      beforeEach(async() => {
        await createServiceCategory.execute({ name: 'Zebra' });
        await createServiceCategory.execute({ name: 'Alpha' });
        await createServiceCategory.execute({ name: 'Beta' });
        await createServiceCategory.execute({ name: 'Gamma' });
      });

      it('should return categories ordered alphabetically by name (ascending)', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.data[0].name).toBe('Alpha');
        expect(result.data[1].name).toBe('Beta');
        expect(result.data[2].name).toBe('Gamma');
        expect(result.data[3].name).toBe('Zebra');
      });

      it('should maintain alphabetical order with pagination', async() => {
        // Act
        const page1 = await sut.execute({ page: 1, size: 2 });
        const page2 = await sut.execute({ page: 2, size: 2 });

        // Assert
        expect(page1.data[0].name).toBe('Alpha');
        expect(page1.data[1].name).toBe('Beta');
        expect(page2.data[0].name).toBe('Gamma');
        expect(page2.data[1].name).toBe('Zebra');
      });

      it('should maintain alphabetical order with search', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Zeta Services' });
        await createServiceCategory.execute({ name: 'Alpha Services' });

        // Act
        const result = await sut.execute({ search: 'services' });

        // Assert
        expect(result.data[0].name).toBe('Alpha Services');
        expect(result.data[1].name).toBe('Zeta Services');
      });
    });

    describe('active/inactive categories scenarios', () => {
      it('should return both active and inactive categories', async() => {
        // Arrange
        await prisma.serviceCategory.create({ data: { name: 'Active Category', active: true } });
        await prisma.serviceCategory.create({ data: { name: 'Inactive Category', active: false } });

        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(2);
        expect(result.data).toHaveLength(2);
      });

      it('should include inactive categories in search results', async() => {
        // Arrange
        await prisma.serviceCategory.create({ data: { name: 'Active Test', active: true } });
        await prisma.serviceCategory.create({ data: { name: 'Inactive Test', active: false } });

        // Act
        const result = await sut.execute({ search: 'test' });

        // Assert
        expect(result.totalItems).toBe(2);
      });
    });

    describe('special characters scenarios', () => {
      beforeEach(async() => {
        await createServiceCategory.execute({ name: 'Instalação & Manutenção' });
        await createServiceCategory.execute({ name: 'Categoria (Premium)' });
        await createServiceCategory.execute({ name: 'Serviço A/B' });
        await createServiceCategory.execute({ name: 'Item #1' });
        await createServiceCategory.execute({ name: 'Consultoria 💡' });
      });

      it('should retrieve categories with ampersands', async() => {
        // Act
        const result = await sut.execute({ search: '&' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toContain('&');
      });

      it('should retrieve categories with parentheses', async() => {
        // Act
        const result = await sut.execute({ search: '(' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toContain('(');
      });

      it('should retrieve categories with slashes', async() => {
        // Act
        const result = await sut.execute({ search: '/' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toContain('/');
      });

      it('should retrieve categories with emojis', async() => {
        // Act
        const result = await sut.execute({ search: '💡' });

        // Assert
        expect(result.totalItems).toBe(1);
        expect(result.data[0].name).toContain('💡');
      });

      it('should retrieve all categories with special chars', async() => {
        // Act
        const result = await sut.execute({});

        // Assert
        expect(result.totalItems).toBe(5);
      });
    });

    describe('performance tests', () => {
      it('should retrieve 500 categories efficiently', async() => {
        // Arrange
        for (let i = 1; i <= 500; i++) {
          await createServiceCategory.execute({ name: `Categoria ${i}` });
        }

        const startTime = Date.now();

        // Act
        const result = await sut.execute({ page: 1, size: 100 });

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
        expect(result.totalItems).toBe(500);
      });

      it('should search within 500 categories efficiently', async() => {
        // Arrange
        for (let i = 1; i <= 500; i++) {
          await createServiceCategory.execute({ name: `Serviço ${i}` });
        }

        const startTime = Date.now();

        // Act
        const result = await sut.execute({ search: 'serviço', page: 1, size: 50 });

        // Assert
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(3000);
        expect(result.totalItems).toBe(500);
      });
    });

    describe('edge cases', () => {
      it('should handle page 0 (should return first page)', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Test' });

        // Act
        const result = await sut.execute({ page: 0, size: 10 });

        // Assert
        expect(result.currentPage).toBeGreaterThanOrEqual(0);
        expect(result.data).toBeDefined();
      });

      it('should handle very large page number', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Test' });

        // Act
        const result = await sut.execute({ page: 999999, size: 10 });

        // Assert
        expect(result.data).toHaveLength(0);
        expect(result.totalItems).toBe(1);
      });

      it('should handle size 0', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Test' });

        // Act
        const result = await sut.execute({ page: 1, size: 0 });

        // Assert
        expect(result).toBeDefined();
      });

      it('should handle unicode search', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Serviço 中文' });

        // Act
        const result = await sut.execute({ search: '中文' });

        // Assert
        expect(result.totalItems).toBe(1);
      });

      it('should return consistent results on multiple calls', async() => {
        // Arrange
        await createServiceCategory.execute({ name: 'Consistent Test' });

        // Act
        const result1 = await sut.execute({});
        const result2 = await sut.execute({});
        const result3 = await sut.execute({});

        // Assert
        expect(result1.totalItems).toBe(result2.totalItems);
        expect(result2.totalItems).toBe(result3.totalItems);
        expect(result1.data[0].id).toBe(result2.data[0].id);
      });
    });
  });
});
