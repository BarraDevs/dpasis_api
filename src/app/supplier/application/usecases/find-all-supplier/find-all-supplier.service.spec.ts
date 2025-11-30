import { Test, TestingModule } from '@nestjs/testing';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SupplierDto } from '../../dtos/supplier.dto';
import { CreateSupplier } from '../create-supplier/create-supplier.service';
import { CreateSupplierInputDto } from '../create-supplier/dtos/create-supplier.dto';
import { FindAllSupplierQueryDto } from './dtos/find-all-supplier.dto';
import { FindAllSupplier } from './find-all-supplier.service';

describe('FindAllSupplier', () => {
  let sut: FindAllSupplier;
  let prisma: PrismaService;
  let createSupplier: CreateSupplier;
  let baseSupplierData: CreateSupplierInputDto;
  let createdSupplierIds: string[];

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllSupplier);
    prisma = module.get(PrismaService);
    createSupplier = module.get(CreateSupplier);

    baseSupplierData = {
      cnpj: '85.693.309/0001-67',
      ie: '123.456.789.012',
      group: 'Matéria Prima',
      type: 'Nacional',
      companyName: 'Fornecedor Base Ltda',
      fantasyName: 'Fornecedor Base',
      representative: 'João Silva',
    };

    await prisma.supplier.deleteMany();

    // Create diverse test suppliers for comprehensive filter testing
    createdSupplierIds = [];

    // Supplier 1: Technology, Nacional, Premium
    const supplier1 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '09.048.836/0001-30',
      ie: '111.111.111.111',
      group: 'Technology',
      type: 'Nacional',
      companyName: 'Alpha Tech Supplies Ltd',
      fantasyName: 'Alpha Tech',
      representative: 'John Alpha Smith',
    });
    createdSupplierIds.push(supplier1.id);

    // Supplier 2: Industrial, Internacional, Standard
    const supplier2 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '34.145.406/0001-84',
      ie: '222.222.222.222',
      group: 'Industrial',
      type: 'Internacional',
      companyName: 'Beta Industrial Materials',
      fantasyName: 'Beta Industrial',
      representative: 'Jane Beta Santos',
    });
    createdSupplierIds.push(supplier2.id);

    // Supplier 3: Technology, Nacional, Premium
    const supplier3 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '74.097.670/0001-04',
      ie: '333.333.333.333',
      group: 'Technology',
      type: 'Nacional',
      companyName: 'Gamma Corporation Supplies',
      fantasyName: 'Gamma Corp',
      representative: 'Robert Gamma Wilson',
    });
    createdSupplierIds.push(supplier3.id);

    // Supplier 4: Raw Materials, Regional, Basic
    const supplier4 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '74.678.725/0001-70',
      ie: '444.444.444.444',
      group: 'Raw Materials',
      type: 'Regional',
      companyName: 'Delta Raw Materials Inc',
      fantasyName: 'Delta Materials',
      representative: 'Maria Delta Costa',
    });
    createdSupplierIds.push(supplier4.id);

    // Supplier 5: Services, Internacional, Standard
    const supplier5 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '38.570.883/0001-48',
      ie: '555.555.555.555',
      group: 'Services',
      type: 'Internacional',
      companyName: 'Epsilon Consulting Services',
      fantasyName: 'Epsilon Consulting',
      representative: 'Carlos Epsilon Lima',
    });
    createdSupplierIds.push(supplier5.id);

    // Supplier 6: Industrial, Nacional, Premium
    const supplier6 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '68.383.796/0001-42',
      ie: '666.666.666.666',
      group: 'Industrial',
      type: 'Nacional',
      companyName: 'Foxtrot Manufacturing Supplies',
      fantasyName: 'Foxtrot Manufacturing',
      representative: 'Ana Foxtrot Silva',
    });
    createdSupplierIds.push(supplier6.id);
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call supplierDao with correct parameters', async() => {
      // Arrange
      const findAllSpy = jest.spyOn(sut['supplierDao'], 'findAll').mockResolvedValue([[], 0]);
      const queries: FindAllSupplierQueryDto = { page: 1, size: 10 };

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return a Pagination object with correct structure', async() => {
      // Arrange
      const mockData: SupplierDto[] = [{ id: 'test-id' } as SupplierDto];
      jest.spyOn(sut['supplierDao'], 'findAll').mockResolvedValue([mockData, 1]);

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('itemsPerPage');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalPages');
    });
  });

  describe('Integration tests - Basic functionality', () => {
    it('should return an empty result when no suppliers exist', async() => {
      // Arrange
      await prisma.supplier.deleteMany(); // Ensure database is clean

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toEqual<IPagination<SupplierDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all suppliers when no filters are provided', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.itemsPerPage).toBe(6);

      // Verify all created suppliers are returned
      const returnedIds = result.data.map(supplier => supplier.id).sort();
      const expectedIds = [...createdSupplierIds].sort();
      expect(returnedIds).toEqual(expectedIds);
    });

    it('should handle pagination correctly', async() => {
      // Act
      const result = await sut.execute({ page: 2, size: 2 });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(2);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.itemsPerPage).toBe(2);
    });
  });

  describe('Integration tests - Individual filter tests', () => {
    it('should filter by cnpj - exact match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '09048836000130' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('09048836000130');
      expect(result.data[0].id).toBe(createdSupplierIds[0]);
    });

    it('should filter by cnpj - partial match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '34145' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('34145406000184');
    });

    it('should filter by ie - exact match', async() => {
      // Act
      const result = await sut.execute({ ie: '333.333.333.333' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ie).toBe('333.333.333.333');
      expect(result.data[0].id).toBe(createdSupplierIds[2]);
    });

    it('should filter by group - Technology', async() => {
      // Act
      const result = await sut.execute({ group: 'Technology' });

      // Assert
      expect(result.totalItems).toBe(2); // suppliers 1, 3
      expect(result.data).toHaveLength(2);
      result.data.forEach(supplier => {
        expect(supplier.group).toContain('Technology');
      });
    });

    it('should filter by group - Industrial', async() => {
      // Act
      const result = await sut.execute({ group: 'Industrial' });

      // Assert
      expect(result.totalItems).toBe(2); // suppliers 2, 6
      expect(result.data).toHaveLength(2);
      result.data.forEach(supplier => {
        expect(supplier.group).toContain('Industrial');
      });
    });

    it('should filter by type - Regional', async() => {
      // Act
      const result = await sut.execute({ type: 'Regional' });

      // Assert
      expect(result.totalItems).toBe(1); // supplier 4
      expect(result.data).toHaveLength(1);
      result.data.forEach(supplier => {
        expect(supplier.type).toBe('Regional');
      });
    });

    it('should filter by type - Internacional', async() => {
      // Act
      const result = await sut.execute({ type: 'Internacional' });

      // Assert
      expect(result.totalItems).toBe(2); // suppliers 2, 5
      expect(result.data).toHaveLength(2);
      result.data.forEach(supplier => {
        expect(supplier.type).toBe('Internacional');
      });
    });

    it('should filter by companyName - partial match', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Alpha' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toBe('Alpha Tech Supplies Ltd');
    });

    it('should filter by companyName - multiple matches', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Corp' });

      // Assert
      expect(result.totalItems).toBe(1); // Gamma Corporation
      expect(result.data).toHaveLength(1);
    });

    it('should filter by fantasyName', async() => {
      // Act
      const result = await sut.execute({ fantasyName: 'Tech' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toBe('Alpha Tech');
    });

    it('should filter by representative', async() => {
      // Act
      const result = await sut.execute({ representative: 'Smith' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].representative).toBe('John Alpha Smith');
    });

    it('should filter by active status - true', async() => {
      // Act
      const result = await sut.execute({ active: true });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      result.data.forEach(supplier => {
        expect(supplier.active).toBe(true);
      });
    });

    it('should filter by active status - false', async() => {
      // Act
      const result = await sut.execute({ active: false });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Integration tests - Case insensitive filters', () => {
    it('should handle case insensitive search for group', async() => {
      // Act
      const result = await sut.execute({ group: 'technology' });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(supplier => {
        expect(supplier.group).toContain('Technology');
      });
    });

    it('should handle case insensitive search for type', async() => {
      // Act
      const result = await sut.execute({ type: 'REGIONAL' });

      // Assert
      expect(result.totalItems).toBe(1);
      result.data.forEach(supplier => {
        expect(supplier.type).toBe('Regional');
      });
    });

    it('should handle case insensitive search for companyName', async() => {
      // Act
      const result = await sut.execute({ companyName: 'ALPHA' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companyName).toBe('Alpha Tech Supplies Ltd');
    });

    it('should handle case insensitive search for representative', async() => {
      // Act
      const result = await sut.execute({ representative: 'JANE' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].representative).toBe('Jane Beta Santos');
    });
  });

  describe('Integration tests - Combined filters', () => {
    it('should filter by group AND type', async() => {
      // Act
      const result = await sut.execute({ group: 'Technology', type: 'Nacional' });

      // Assert
      expect(result.totalItems).toBe(2); // suppliers 1, 3 (both Technology and Nacional)
      expect(result.data).toHaveLength(2);
      result.data.forEach(supplier => {
        expect(supplier.group).toContain('Technology');
        expect(supplier.type).toBe('Nacional');
      });
    });

    it('should filter by companyName AND representative', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Beta', representative: 'Santos' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Beta');
      expect(result.data[0].representative).toContain('Santos');
    });

    it('should filter by multiple string fields', async() => {
      // Act
      const result = await sut.execute({
        companyName: 'Manufacturing',
        fantasyName: 'Foxtrot',
        representative: 'Silva',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Manufacturing');
      expect(result.data[0].fantasyName).toContain('Foxtrot');
      expect(result.data[0].representative).toContain('Silva');
    });

    it('should return empty when filters do not match any supplier', async() => {
      // Act
      const result = await sut.execute({ group: 'Technology', type: 'Regional' }); // No Technology suppliers are Regional

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should filter by exact CNPJ AND IE', async() => {
      // Act
      const result = await sut.execute({
        cnpj: '74678725000170',
        ie: '444.444.444.444',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('74678725000170');
      expect(result.data[0].ie).toBe('444.444.444.444');
    });
  });

  describe('Integration tests - Pagination with filters', () => {
    it('should combine pagination with type filter', async() => {
      // Act
      const result = await sut.execute({ type: 'Nacional', page: 1, size: 2 });

      // Assert
      expect(result.totalItems).toBe(5); // Total Nacional suppliers
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(3);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should combine pagination with multiple filters', async() => {
      // Act
      const result = await sut.execute({ group: 'Technology', page: 1, size: 1 });

      // Assert
      expect(result.totalItems).toBe(2); // Total Technology suppliers
      expect(result.data).toHaveLength(1); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should handle pagination beyond available results', async() => {
      // Act
      const result = await sut.execute({ type: 'Regional', page: 3, size: 2 });

      // Assert
      expect(result.totalItems).toBe(1); // Total Regional suppliers
      expect(result.data).toHaveLength(0); // No results on page 3
      expect(result.currentPage).toBe(3);
    });
  });

  describe('Integration tests - Edge cases', () => {
    it('should return empty result when filtering by non-existent value', async() => {
      // Act
      const result = await sut.execute({ companyName: 'NonExistentCompany' });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty string filters', async() => {
      // Act
      const result = await sut.execute({ companyName: '', fantasyName: '' });

      // Assert
      expect(result.totalItems).toBe(6); // Should return all suppliers
      expect(result.data).toHaveLength(6);
    });

    it('should handle undefined filters mixed with valid ones', async() => {
      // Act
      const result = await sut.execute({
        group: 'Technology',
        companyName: undefined,
        type: 'Nacional',
      });

      // Assert
      expect(result.totalItems).toBe(2); // Technology AND Nacional suppliers
      expect(result.data).toHaveLength(2);
    });

    it('should handle partial matches correctly', async() => {
      // Act
      const result = await sut.execute({ representative: 'Alpha' });

      // Assert
      expect(result.totalItems).toBeGreaterThan(0);
      result.data.forEach(supplier => {
        expect(supplier.representative).toContain('Alpha');
      });
    });
  });
});
