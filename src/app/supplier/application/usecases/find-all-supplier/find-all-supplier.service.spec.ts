import { Test, TestingModule } from '@nestjs/testing';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SupplierDto } from '../../dtos/supplier.dto';
import { FindAllSupplierQueryDto } from './dtos/find-all-supplier.dto';
import { FindAllSupplier } from './find-all-supplier.service';

describe('FindAllSupplier', () => {
  let sut: FindAllSupplier;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllSupplier);
    prisma = module.get(PrismaService);

    await prisma.supplier.deleteMany();
  });

  afterAll(async() => {
    await prisma.supplier.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call supplierDao.findAll with correct parameters', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 1,
        size: 10,
        companyName: 'Test Company',
        cnpj: '11.222.333/0001-44',
      };

      const mockResult: SupplierDto[] = [];
      const mockTotal = 0;
      const findAllSpy = jest.spyOn(sut['supplierDao'], 'findAll').mockResolvedValue([mockResult, mockTotal]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
      expect(findAllSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      findAllSpy.mockRestore();
    });

    it('should return paginated result with correct structure', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 2,
        size: 5,
      };

      const mockSuppliers: SupplierDto[] = [
        {
          id: 'supplier-1',
          cnpj: '11.222.333/0001-44',
          ie: '123.456.789',
          group: 'Group 1',
          type: 'Type 1',
          companyName: 'Company 1',
          fantasyName: 'Fantasy 1',
          representative: 'Rep 1',
          active: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'supplier-2',
          cnpj: '22.333.444/0001-55',
          ie: '987.654.321',
          group: 'Group 2',
          type: 'Type 2',
          companyName: 'Company 2',
          fantasyName: 'Fantasy 2',
          representative: 'Rep 2',
          active: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];
      const mockTotal = 15;

      const findAllSpy = jest.spyOn(sut['supplierDao'], 'findAll').mockResolvedValue([mockSuppliers, mockTotal]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result).toEqual<IPagination<SupplierDto>>({
        currentPage: 2,
        itemsPerPage: 5,
        totalItems: 15,
        totalPages: 3, // Math.ceil(15/5)
        data: mockSuppliers,
      });

      // Cleanup
      findAllSpy.mockRestore();
    });

    it('should handle empty result correctly', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 1,
        size: 10,
      };

      const mockResult: SupplierDto[] = [];
      const mockTotal = 0;
      const findAllSpy = jest.spyOn(sut['supplierDao'], 'findAll').mockResolvedValue([mockResult, mockTotal]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result).toEqual<IPagination<SupplierDto>>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
        data: [],
      });

      // Cleanup
      findAllSpy.mockRestore();
    });

    it('should handle queries without pagination parameters', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'Test Company',
      };

      const mockSuppliers: SupplierDto[] = [
        {
          id: 'supplier-1',
          cnpj: '11.222.333/0001-44',
          ie: '123.456.789',
          group: 'Group 1',
          type: 'Type 1',
          companyName: 'Test Company',
          fantasyName: 'Fantasy 1',
          representative: 'Rep 1',
          active: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];
      const mockTotal = 1;

      const findAllSpy = jest.spyOn(sut['supplierDao'], 'findAll').mockResolvedValue([mockSuppliers, mockTotal]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result).toEqual<IPagination<SupplierDto>>({
        currentPage: 1, // Default page
        itemsPerPage: 1, // Default size equals total when not provided
        totalItems: 1,
        totalPages: 1,
        data: mockSuppliers,
      });

      // Cleanup
      findAllSpy.mockRestore();
    });

    it('should pass through errors from supplierDao', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {};
      const error = new Error('Database connection error');
      const findAllSpy = jest.spyOn(sut['supplierDao'], 'findAll').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute(queries)).rejects.toThrow('Database connection error');

      // Cleanup
      findAllSpy.mockRestore();
    });
  });

  describe('integration tests', () => {
    let supplier1: any;
    let supplier2: any;
    let supplier3: any;

    beforeEach(async() => {
      // Create test suppliers
      supplier1 = await prisma.supplier.create({
        data: {
          id: 'supplier-1',
          cnpj: '11.222.333/0001-44',
          ie: '123.456.789',
          group: 'Matéria Prima',
          type: 'Nacional',
          companyName: 'Empresa ABC Ltda',
          fantasyName: 'ABC',
          representative: 'João Silva',
          active: true,
        },
      });

      supplier2 = await prisma.supplier.create({
        data: {
          id: 'supplier-2',
          cnpj: '22.333.444/0001-55',
          ie: '987.654.321',
          group: 'Serviços',
          type: 'Internacional',
          companyName: 'XYZ Comércio S.A.',
          fantasyName: 'XYZ',
          representative: 'Maria Santos',
          active: false,
        },
      });

      supplier3 = await prisma.supplier.create({
        data: {
          id: 'supplier-3',
          cnpj: '33.444.555/0001-66',
          ie: '111.222.333',
          group: 'Matéria Prima',
          type: 'Nacional',
          companyName: 'DEF Indústria e Comércio',
          fantasyName: 'DEF',
          representative: 'Carlos Oliveira',
          active: true,
        },
      });
    });

    it('should return all suppliers when no filters are applied', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {};

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(3); // Default size equals total
      expect(result.totalPages).toBe(1);

      const supplierIds = result.data.map(s => s.id);
      expect(supplierIds).toContain(supplier1.id);
      expect(supplierIds).toContain(supplier2.id);
      expect(supplierIds).toContain(supplier3.id);
    });

    it('should return paginated results correctly', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 1,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(3);
      expect(result.data).toHaveLength(2);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(2); // Math.ceil(3/2)
    });

    it('should return second page correctly', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 2,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(3);
      expect(result.data).toHaveLength(1); // Only 1 item on second page
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter suppliers by company name (case insensitive)', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'abc', // Should match "Empresa ABC Ltda"
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(supplier1.id);
      expect(result.data[0].companyName).toBe('Empresa ABC Ltda');
    });

    it('should filter suppliers by CNPJ', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        cnpj: '0001-55', // Should match supplier2
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(supplier2.id);
      expect(result.data[0].cnpj).toBe('22.333.444/0001-55');
    });

    it('should filter by company name OR CNPJ', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'ABC', // Should match supplier1
        cnpj: '22.333', // Should match supplier2
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(2);

      const supplierIds = result.data.map(s => s.id);
      expect(supplierIds).toContain(supplier1.id);
      expect(supplierIds).toContain(supplier2.id);
      expect(supplierIds).not.toContain(supplier3.id);
    });

    it('should return empty result when no suppliers match filters', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'Nonexistent Company',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });

    it('should combine pagination with filters', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'Comércio', // Should match suppliers 2 and 3
        page: 1,
        size: 1,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(1); // Only 1 item per page
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should return suppliers ordered by createdAt desc by default', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {};

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(3);
      // supplier3 was created last, so should be first in desc order
      expect(result.data[0].id).toBe(supplier3.id);
    });

    it('should return all SupplierDto properties correctly', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 1,
        size: 1,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      const supplier = result.data[0];

      expect(supplier).toHaveProperty('id');
      expect(supplier).toHaveProperty('cnpj');
      expect(supplier).toHaveProperty('ie');
      expect(supplier).toHaveProperty('group');
      expect(supplier).toHaveProperty('type');
      expect(supplier).toHaveProperty('companyName');
      expect(supplier).toHaveProperty('fantasyName');
      expect(supplier).toHaveProperty('representative');
      expect(supplier).toHaveProperty('active');
      expect(supplier).toHaveProperty('createdAt');
      expect(supplier).toHaveProperty('updatedAt');

      // Verify property types
      expect(typeof supplier.id).toBe('string');
      expect(typeof supplier.cnpj).toBe('string');
      expect(typeof supplier.ie).toBe('string');
      expect(typeof supplier.group).toBe('string');
      expect(typeof supplier.type).toBe('string');
      expect(typeof supplier.companyName).toBe('string');
      expect(typeof supplier.fantasyName).toBe('string');
      expect(typeof supplier.representative).toBe('string');
      expect(typeof supplier.active).toBe('boolean');
      expect(supplier.createdAt).toBeInstanceOf(Date);
      expect(supplier.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty search parameters gracefully', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: '',
        cnpj: '',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.totalItems).toBe(3); // Should return all suppliers
      expect(result.data).toHaveLength(3);
    });
  });
});
