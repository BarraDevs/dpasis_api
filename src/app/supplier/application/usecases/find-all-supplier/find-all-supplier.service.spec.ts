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
  let companyId1: string;
  let companyId2: string;
  let companyId3: string;

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

    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    // Create test companies
    const company1 = await prisma.company.create({
      data: {
        name: 'Test Company 1',
        fantasyName: 'Company 1',
        document: '12345678000190',
        ie: '111111111',
        zipCode: '12345678',
        street: 'Test Street 1',
        number: '100',
        neighborhood: 'District 1',
        city: 'City 1',
        state: 'C1',
        phone01: '1111111111',
        email01: 'company1@test.com',
        active: true,
      },
    });
    companyId1 = company1.id;

    const company2 = await prisma.company.create({
      data: {
        name: 'Test Company 2',
        fantasyName: 'Company 2',
        document: '98765432000190',
        ie: '222222222',
        zipCode: '87654321',
        street: 'Test Street 2',
        number: '200',
        neighborhood: 'District 2',
        city: 'City 2',
        state: 'C2',
        phone01: '2222222222',
        email01: 'company2@test.com',
        active: true,
      },
    });
    companyId2 = company2.id;

    const company3 = await prisma.company.create({
      data: {
        name: 'Test Company 3',
        fantasyName: 'Company 3',
        document: '11122233000190',
        ie: '333333333',
        zipCode: '11223344',
        street: 'Test Street 3',
        number: '300',
        neighborhood: 'District 3',
        city: 'City 3',
        state: 'C3',
        phone01: '3333333333',
        email01: 'company3@test.com',
        active: true,
      },
    });
    companyId3 = company3.id;

    baseSupplierData = {
      cnpj: '85.693.309/0001-67',
      ie: '123.456.789.012',
      group: 'Matéria Prima',
      type: 'Nacional',
      companyName: 'Fornecedor Base Ltda',
      fantasyName: 'Fornecedor Base',
      representative: 'João Silva',
      companyIds: [],
    };

    // Create diverse test suppliers for comprehensive filter testing
    createdSupplierIds = [];

    // Supplier 1: Technology, Nacional, Premium - No companies
    const supplier1 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '09.048.836/0001-30',
      ie: '111.111.111.111',
      group: 'Technology',
      type: 'Nacional',
      companyName: 'Alpha Tech Supplies Ltd',
      fantasyName: 'Alpha Tech',
      representative: 'John Alpha Smith',
      companyIds: [],
    });
    createdSupplierIds.push(supplier1.id);

    // Supplier 2: Industrial, Internacional, Standard - Company 1
    const supplier2 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '34.145.406/0001-84',
      ie: '222.222.222.222',
      group: 'Industrial',
      type: 'Internacional',
      companyName: 'Beta Industrial Materials',
      fantasyName: 'Beta Industrial',
      representative: 'Jane Beta Santos',
      companyIds: [companyId1],
    });
    createdSupplierIds.push(supplier2.id);

    // Supplier 3: Technology, Nacional, Premium - Companies 1 and 2
    const supplier3 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '74.097.670/0001-04',
      ie: '333.333.333.333',
      group: 'Technology',
      type: 'Nacional',
      companyName: 'Gamma Corporation Supplies',
      fantasyName: 'Gamma Corp',
      representative: 'Robert Gamma Wilson',
      companyIds: [companyId1, companyId2],
    });
    createdSupplierIds.push(supplier3.id);

    // Supplier 4: Raw Materials, Regional, Basic - Company 2
    const supplier4 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '74.678.725/0001-70',
      ie: '444.444.444.444',
      group: 'Raw Materials',
      type: 'Regional',
      companyName: 'Delta Raw Materials Inc',
      fantasyName: 'Delta Materials',
      representative: 'Maria Delta Costa',
      companyIds: [companyId2],
    });
    createdSupplierIds.push(supplier4.id);

    // Supplier 5: Services, Internacional, Standard - Company 3
    const supplier5 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '38.570.883/0001-48',
      ie: '555.555.555.555',
      group: 'Services',
      type: 'Internacional',
      companyName: 'Epsilon Consulting Services',
      fantasyName: 'Epsilon Consulting',
      representative: 'Carlos Epsilon Lima',
      companyIds: [companyId3],
    });
    createdSupplierIds.push(supplier5.id);

    // Supplier 6: Industrial, Nacional, Premium - All companies
    const supplier6 = await createSupplier.execute({
      ...baseSupplierData,
      cnpj: '68.383.796/0001-42',
      ie: '666.666.666.666',
      group: 'Industrial',
      type: 'Nacional',
      companyName: 'Foxtrot Manufacturing Supplies',
      fantasyName: 'Foxtrot Manufacturing',
      representative: 'Ana Foxtrot Silva',
      companyIds: [companyId1, companyId2, companyId3],
    });
    createdSupplierIds.push(supplier6.id);
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();
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

    it('should return correct dto structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const supplier = result.data.filter(s => s.companies.length > 0)[0];
      expect(supplier).toEqual<SupplierDto>({
        id: expect.any(String),
        cnpj: expect.any(String),
        ie: expect.any(String),
        group: expect.any(String),
        type: expect.any(String),
        companyName: expect.any(String),
        fantasyName: expect.any(String),
        representative: expect.any(String),
        active: expect.any(Boolean),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        ]),
      });
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

  describe('Integration tests - Company associations', () => {
    it('should return suppliers with empty companies array', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const suppliersWithNoCompanies = result.data.filter(s => s.companies.length === 0);
      expect(suppliersWithNoCompanies).toHaveLength(1); // Only supplier 1 has no companies
      expect(suppliersWithNoCompanies[0].id).toBe(createdSupplierIds[0]);
    });

    it('should return suppliers with companies array populated', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const suppliersWithCompanies = result.data.filter(s => s.companies.length > 0);
      expect(suppliersWithCompanies).toHaveLength(5); // Suppliers 2, 3, 4, 5, 6 have companies
    });

    it('should return supplier with single company association', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Beta Industrial' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(1);
      expect(result.data[0].companies[0].id).toBe(companyId1);
      expect(result.data[0].companies[0].name).toBe('Test Company 1');
    });

    it('should return supplier with multiple company associations', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Gamma Corporation' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(2);
      const companyIds = result.data[0].companies.map(c => c.id);
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);
    });

    it('should return supplier with all companies associated', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Foxtrot Manufacturing' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(3);
      const companyIds = result.data[0].companies.map(c => c.id);
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);
      expect(companyIds).toContain(companyId3);
    });

    it('should return correct company names and ids in companies array', async() => {
      // Act
      const result = await sut.execute({ representative: 'Maria Delta Costa' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(1);
      expect(result.data[0].companies[0]).toEqual({
        id: companyId2,
        name: 'Test Company 2',
      });
    });

    it('should return all suppliers and verify companies array structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);

      // Verify each supplier has companies array
      result.data.forEach(supplier => {
        expect(supplier).toHaveProperty('companies');
        expect(Array.isArray(supplier.companies)).toBe(true);

        // Verify each company in the array has id and name
        supplier.companies.forEach(company => {
          expect(company).toHaveProperty('id');
          expect(company).toHaveProperty('name');
          expect(typeof company.id).toBe('string');
          expect(typeof company.name).toBe('string');
        });
      });
    });

    it('should verify specific supplier company associations', async() => {
      // Act
      const result = await sut.execute({});

      // Assert - Verify specific suppliers have correct number of companies
      const supplier1 = result.data.find(s => s.id === createdSupplierIds[0]);
      const supplier2 = result.data.find(s => s.id === createdSupplierIds[1]);
      const supplier3 = result.data.find(s => s.id === createdSupplierIds[2]);
      const supplier4 = result.data.find(s => s.id === createdSupplierIds[3]);
      const supplier5 = result.data.find(s => s.id === createdSupplierIds[4]);
      const supplier6 = result.data.find(s => s.id === createdSupplierIds[5]);

      expect(supplier1?.companies).toHaveLength(0); // No companies
      expect(supplier2?.companies).toHaveLength(1); // Company 1
      expect(supplier3?.companies).toHaveLength(2); // Companies 1, 2
      expect(supplier4?.companies).toHaveLength(1); // Company 2
      expect(supplier5?.companies).toHaveLength(1); // Company 3
      expect(supplier6?.companies).toHaveLength(3); // Companies 1, 2, 3
    });

    it('should handle pagination with companies array', async() => {
      // Act
      const result = await sut.execute({ page: 1, size: 3 });

      // Assert
      expect(result.data).toHaveLength(3);
      result.data.forEach(supplier => {
        expect(supplier).toHaveProperty('companies');
        expect(Array.isArray(supplier.companies)).toBe(true);
      });
    });
  });
});
