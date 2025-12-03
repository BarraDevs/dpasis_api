import { Test } from '@nestjs/testing';
import { Company, Supplier } from '@prisma/client';
import { SupplierDto } from 'src/app/supplier/application/dtos/supplier.dto';
import { SupplierPersistenceModule } from 'src/app/supplier/application/persistence/supplier-persistence.module';
import { FindAllSupplierQueryDto } from 'src/app/supplier/application/usecases/find-all-supplier/dtos/find-all-supplier.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDaoAdapterPrisma } from './supplier.dao';

describe('SupplierDaoAdapterPrisma', () => {
  let sut: SupplierDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SupplierPersistenceModule,
        ConfigModule,
      ],
      providers: [
        SupplierDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(SupplierDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.company.deleteMany();
    await prisma.supplier.deleteMany();
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    let company1: Company;
    let company2: Company;
    let company3: Company;

    beforeEach(async() => {
      // Create test companies
      company1 = await prisma.company.create({
        data: {
          name: 'Company A',
          fantasyName: 'Company A Fantasy',
          document: '11111111000101',
          ie: 'IE-A',
          zipCode: '11111111',
          street: 'Street A',
          number: '100',
          neighborhood: 'District A',
          city: 'City A',
          state: 'CA',
          phone01: '1111111111',
          email01: 'companyA@test.com',
          active: true,
        },
      });

      company2 = await prisma.company.create({
        data: {
          name: 'Company B',
          fantasyName: 'Company B Fantasy',
          document: '22222222000102',
          ie: 'IE-B',
          zipCode: '22222222',
          street: 'Street B',
          number: '200',
          neighborhood: 'District B',
          city: 'City B',
          state: 'CB',
          phone01: '2222222222',
          email01: 'companyB@test.com',
          active: true,
        },
      });

      company3 = await prisma.company.create({
        data: {
          name: 'Company C',
          fantasyName: 'Company C Fantasy',
          document: '33333333000103',
          ie: 'IE-C',
          zipCode: '33333333',
          street: 'Street C',
          number: '300',
          neighborhood: 'District C',
          city: 'City C',
          state: 'CC',
          phone01: '3333333333',
          email01: 'companyC@test.com',
          active: true,
        },
      });

      // Supplier 1: Technology, Nacional - Company A
      await prisma.supplier.create({
        data: {
          id: 'supplier-1',
          cnpj: '11.111.111/0001-11',
          ie: '111.111.111.111',
          group: 'Technology',
          type: 'Nacional',
          companyName: 'Alpha Tech Supplies Ltd',
          fantasyName: 'Alpha Tech',
          representative: 'John Alpha Smith',
          active: true,
          companies: { connect: { id: company1.id } },
        },
      });

      // Supplier 2: Industrial, Internacional - Company A and B
      await prisma.supplier.create({
        data: {
          id: 'supplier-2',
          cnpj: '22.222.222/0001-22',
          ie: '222.222.222.222',
          group: 'Industrial',
          type: 'Internacional',
          companyName: 'Beta Industrial Materials',
          fantasyName: 'Beta Industrial',
          representative: 'Jane Beta Santos',
          active: true,
          companies: { connect: [{ id: company1.id }, { id: company2.id }] },
        },
      });

      // Supplier 3: Technology, Nacional - Company B
      await prisma.supplier.create({
        data: {
          id: 'supplier-3',
          cnpj: '33.333.333/0001-33',
          ie: '333.333.333.333',
          group: 'Technology',
          type: 'Nacional',
          companyName: 'Gamma Corporation Supplies',
          fantasyName: 'Gamma Corp',
          representative: 'Robert Gamma Wilson',
          active: false,
          companies: { connect: { id: company2.id } },
        },
      });

      // Supplier 4: Raw Materials, Regional - Company C
      await prisma.supplier.create({
        data: {
          id: 'supplier-4',
          cnpj: '44.444.444/0001-44',
          ie: '444.444.444.444',
          group: 'Raw Materials',
          type: 'Regional',
          companyName: 'Delta Raw Materials Inc',
          fantasyName: 'Delta Materials',
          representative: 'Maria Delta Costa',
          active: true,
          companies: { connect: { id: company3.id } },
        },
      });

      // Supplier 5: Services, Internacional - Company A, B, and C
      await prisma.supplier.create({
        data: {
          id: 'supplier-5',
          cnpj: '55.555.555/0001-55',
          ie: '555.555.555.555',
          group: 'Services',
          type: 'Internacional',
          companyName: 'Epsilon Consulting Services',
          fantasyName: 'Epsilon Consulting',
          representative: 'Carlos Epsilon Lima',
          active: true,
          companies: { connect: [{ id: company1.id }, { id: company2.id }, { id: company3.id }] },
        },
      });

      // Supplier 6: Industrial, Nacional - No companies
      await prisma.supplier.create({
        data: {
          id: 'supplier-6',
          cnpj: '66.666.666/0001-66',
          ie: '666.666.666.666',
          group: 'Industrial',
          type: 'Nacional',
          companyName: 'Foxtrot Manufacturing Supplies',
          fantasyName: 'Foxtrot Manufacturing',
          representative: 'Ana Foxtrot Silva',
          active: false,
        },
      });
    });

    it('should return all suppliers when no filters are provided', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {};

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(6);
      expect(suppliers).toHaveLength(6);

      // Should be ordered by createdAt desc (most recent first)
      expect(suppliers[0].id).toBe('supplier-6');
      expect(suppliers[1].id).toBe('supplier-5');
      expect(suppliers[2].id).toBe('supplier-4');
      expect(suppliers[3].id).toBe('supplier-3');
      expect(suppliers[4].id).toBe('supplier-2');
      expect(suppliers[5].id).toBe('supplier-1');
    });

    it('should return paginated results', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 2,
        size: 2,
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(6);
      expect(suppliers).toHaveLength(2);
      expect(suppliers[0].id).toBe('supplier-4');
      expect(suppliers[1].id).toBe('supplier-3');
    });

    describe('Individual filter tests', () => {
      it('should filter by cnpj - exact match', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          cnpj: '11.111.111/0001-11',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-1');
        expect(suppliers[0].cnpj).toBe('11.111.111/0001-11');
      });

      it('should filter by cnpj - partial match', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          cnpj: '22.222',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].cnpj).toBe('22.222.222/0001-22');
      });

      it('should filter by ie - exact match', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          ie: '333.333.333.333',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-3');
        expect(suppliers[0].ie).toBe('333.333.333.333');
      });

      it('should filter by group - Technology', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'Technology',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 1, 3
        expect(suppliers).toHaveLength(2);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-1', 'supplier-3']);
        suppliers.forEach(supplier => {
          expect(supplier.group).toContain('Technology');
        });
      });

      it('should filter by group - Industrial', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'Industrial',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 2, 6
        expect(suppliers).toHaveLength(2);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-2', 'supplier-6']);
        suppliers.forEach(supplier => {
          expect(supplier.group).toContain('Industrial');
        });
      });

      it('should filter by type - Nacional', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          type: 'Nacional',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(5); // suppliers 1, 2, 3, 5, 6
        expect(suppliers).toHaveLength(5);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-1', 'supplier-2', 'supplier-3', 'supplier-5', 'supplier-6']);
      });

      it('should filter by type - Internacional', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          type: 'Internacional',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 2, 5
        expect(suppliers).toHaveLength(2);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-2', 'supplier-5']);
        suppliers.forEach(supplier => {
          expect(supplier.type).toBe('Internacional');
        });
      });

      it('should filter by companyName - partial match', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyName: 'Corp',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // Gamma Corporation
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-3');
      });

      it('should filter by fantasyName - partial match', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          fantasyName: 'Tech',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // Alpha Tech
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-1');
        expect(suppliers[0].fantasyName).toBe('Alpha Tech');
      });

      it('should filter by representative - partial match', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          representative: 'Smith',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // John Alpha Smith
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-1');
        expect(suppliers[0].representative).toBe('John Alpha Smith');
      });

      it('should filter by active status - true', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          active: true,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(4); // suppliers 1, 2, 4, 6
        expect(suppliers).toHaveLength(4);
        suppliers.forEach(supplier => {
          expect(supplier.active).toBe(true);
        });
      });

      it('should filter by active status - false', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          active: false,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 3, 5
        expect(suppliers).toHaveLength(2);
        suppliers.forEach(supplier => {
          expect(supplier.active).toBe(false);
        });
      });

      it('should filter by companyIds - single company (Company A)', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(3); // suppliers 1, 2, 5 (have Company A)
        expect(suppliers).toHaveLength(3);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-1', 'supplier-2', 'supplier-5']);

        // Verify each supplier has Company A
        suppliers.forEach(supplier => {
          const companyIds = supplier.companies.map(c => c.id);
          expect(companyIds).toContain(company1.id);
        });
      });

      it('should filter by companyIds - single company (Company B)', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company2.id],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(3); // suppliers 2, 3, 5 (have Company B)
        expect(suppliers).toHaveLength(3);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-2', 'supplier-3', 'supplier-5']);

        // Verify each supplier has Company B
        suppliers.forEach(supplier => {
          const companyIds = supplier.companies.map(c => c.id);
          expect(companyIds).toContain(company2.id);
        });
      });

      it('should filter by companyIds - single company (Company C)', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company3.id],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 4, 5 (have Company C)
        expect(suppliers).toHaveLength(2);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-4', 'supplier-5']);

        // Verify each supplier has Company C
        suppliers.forEach(supplier => {
          const companyIds = supplier.companies.map(c => c.id);
          expect(companyIds).toContain(company3.id);
        });
      });

      it('should filter by companyIds - multiple companies (A and B)', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id, company2.id],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(4); // suppliers 1, 2, 3, 5 (have Company A OR B)
        expect(suppliers).toHaveLength(4);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-1', 'supplier-2', 'supplier-3', 'supplier-5']);
      });

      it('should filter by companyIds - all companies', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id, company2.id, company3.id],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(5); // All suppliers except supplier-6 (which has no companies)
        expect(suppliers).toHaveLength(5);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-1', 'supplier-2', 'supplier-3', 'supplier-4', 'supplier-5']);
      });

      it('should filter by companyIds - non-existent company', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: ['non-existent-company-id'],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(0);
        expect(suppliers).toHaveLength(0);
      });

      it('should filter by companyIds - empty array', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [],
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(6); // Should return all suppliers (empty array is ignored)
        expect(suppliers).toHaveLength(6);
      });
    });

    describe('Case insensitive filter tests', () => {
      it('should handle case insensitive search for group', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'technology',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2);
        suppliers.forEach(supplier => {
          expect(supplier.group).toBe('Technology');
        });
      });

      it('should handle case insensitive search for type', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          type: 'REGIONAL',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        suppliers.forEach(supplier => {
          expect(supplier.type).toBe('Regional');
        });
      });

      it('should handle case insensitive search for companyName', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyName: 'ALPHA',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        expect(suppliers[0].companyName).toBe('Alpha Tech Supplies Ltd');
      });

      it('should handle case insensitive search for representative', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          representative: 'JANE',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        expect(suppliers[0].representative).toBe('Jane Beta Santos');
      });
    });

    describe('Combined filter tests', () => {
      it('should filter by group AND type', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'Technology',
          type: 'Nacional',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 1, 3 (both Technology and Nacional)
        expect(suppliers).toHaveLength(2);
        suppliers.forEach(supplier => {
          expect(supplier.group).toContain('Technology');
          expect(supplier.type).toBe('Nacional');
        });
      });

      it('should filter by companyName AND representative', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyName: 'Beta',
          representative: 'Santos',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // supplier-2
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-2');
      });

      it('should filter by multiple string fields', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyName: 'Manufacturing',
          fantasyName: 'Foxtrot',
          representative: 'Silva',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // supplier-6
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-6');
      });

      it('should return empty when filters do not match any supplier', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'Technology',
          type: 'Regional', // No Technology suppliers have Regional type
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(0);
        expect(suppliers).toHaveLength(0);
      });

      it('should filter by exact CNPJ AND IE', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          cnpj: '44.444.444/0001-44',
          ie: '444.444.444.444',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // supplier-4
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-4');
      });

      it('should filter by companyIds AND group', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id],
          group: 'Technology',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // Only supplier-1 (has Company A AND Technology group)
        expect(suppliers).toHaveLength(1);
        expect(suppliers[0].id).toBe('supplier-1');
        expect(suppliers[0].group).toBe('Technology');
      });

      it('should filter by companyIds AND type', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company2.id],
          type: 'Internacional',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 2, 5 (have Company B AND Internacional)
        expect(suppliers).toHaveLength(2);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-2', 'supplier-5']);
      });

      it('should filter by companyIds AND active status', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company2.id],
          active: true,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 2, 5 (have Company B AND active)
        expect(suppliers).toHaveLength(2);
        suppliers.forEach(supplier => {
          expect(supplier.active).toBe(true);
        });
      });

      it('should filter by multiple companyIds AND multiple string filters', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id, company2.id],
          group: 'Technology',
          type: 'Nacional',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // suppliers 1, 3
        expect(suppliers).toHaveLength(2);
        const supplierIds = suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-1', 'supplier-3']);
      });

      it('should return empty when companyIds filter does not match with other filters', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company3.id],
          group: 'Technology', // No Technology supplier has only Company C
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(0);
        expect(suppliers).toHaveLength(0);
      });
    });

    describe('Pagination with filters', () => {
      it('should combine pagination with type filter', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          type: 'Nacional',
          page: 1,
          size: 2,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(5); // Total Nacional suppliers
        expect(suppliers).toHaveLength(2); // Page size
        // Should return first 2 Nacional suppliers (ordered by createdAt desc)
        expect(suppliers[0].id).toBe('supplier-6');
        expect(suppliers[1].id).toBe('supplier-5');
      });

      it('should combine pagination with multiple filters', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'Technology',
          page: 1,
          size: 1,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // Total Technology suppliers
        expect(suppliers).toHaveLength(1); // Page size
        // Should return first Technology supplier (ordered by createdAt desc)
        expect(suppliers[0].id).toBe('supplier-3');
      });

      it('should handle pagination beyond available results', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          type: 'Regional',
          page: 3,
          size: 2,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1); // Total Regional suppliers
        expect(suppliers).toHaveLength(0); // No results on page 3
      });

      it('should combine pagination with companyIds filter', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id],
          page: 1,
          size: 2,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(3); // Total suppliers with Company A
        expect(suppliers).toHaveLength(2); // Page size
        // Should return first 2 suppliers with Company A (ordered by createdAt desc)
        expect(suppliers[0].id).toBe('supplier-5');
        expect(suppliers[1].id).toBe('supplier-2');
      });

      it('should combine pagination with multiple companyIds', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company2.id, company3.id],
          page: 2,
          size: 2,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(4); // suppliers 2, 3, 4, 5 (have Company B or C)
        expect(suppliers).toHaveLength(2); // Page size
        // Should return second page (suppliers 3, 2 in createdAt desc order)
        expect(suppliers[0].id).toBe('supplier-3');
        expect(suppliers[1].id).toBe('supplier-2');
      });

      it('should combine pagination with companyIds and other filters', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyIds: [company1.id, company2.id],
          active: true,
          page: 1,
          size: 1,
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(3); // suppliers 1, 2, 5 (have Company A/B and active)
        expect(suppliers).toHaveLength(1); // Page size
        // Should return first active supplier with Company A/B (ordered by createdAt desc)
        expect(suppliers[0].id).toBe('supplier-5');
      });
    });

    describe('Edge cases and special scenarios', () => {
      it('should return empty result when filtering by non-existent value', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyName: 'NonExistentCompany',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(0);
        expect(suppliers).toHaveLength(0);
      });

      it('should handle empty string filters', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          companyName: '',
          fantasyName: '',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(6); // Should return all suppliers (empty strings are ignored)
        expect(suppliers).toHaveLength(6);
      });

      it('should handle undefined filters mixed with valid ones', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          group: 'Technology',
          companyName: undefined,
          type: 'Nacional',
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(2); // Technology AND Nacional suppliers
        expect(suppliers).toHaveLength(2);
      });

      it('should handle partial matches correctly', async() => {
        // Arrange
        const queries: FindAllSupplierQueryDto = {
          representative: 'Alpha', // Should match John Alpha Smith
        };

        // Act
        const [suppliers, total] = await sut.findAll(queries);

        // Assert
        expect(total).toBe(1);
        expect(suppliers).toHaveLength(1);
        suppliers.forEach(supplier => {
          expect(supplier.representative).toContain('Alpha');
        });
      });
    });
  });

  describe('findById', () => {
    let supplier: Supplier;
    let company: Company;

    beforeEach(async() => {
      company = await prisma.company.create({
        data: {
          name: 'name teste',
          fantasyName: 'fantasyName teste',
          document: 'document teste',
          ie: 'ie teste',
          zipCode: 'zipCode teste',
          street: 'street teste',
          number: 'number teste',
          neighborhood: 'neighborhood teste',
          city: 'city teste',
          state: 'state teste',
          phone01: 'phone01 teste',
          email01: 'email01 teste',
          active: true,
        },
      });

      supplier = await prisma.supplier.create({
        data: {
          id: 'supplier-find-by-id',
          cnpj: '11.111.111/0001-11',
          ie: '111111111',
          group: 'Test Group',
          type: 'Test Type',
          companyName: 'Test Company',
          fantasyName: 'Test Fantasy',
          representative: 'Test Representative',
          active: true,
          companies: { connect: { id: company.id } },
        },
      });
    });

    it('should return the correct supplier when found', async() => {
      // Act
      const result = await sut.findById(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<SupplierDto>({
        id: supplier.id,
        cnpj: supplier.cnpj,
        ie: supplier.ie,
        group: supplier.group,
        type: supplier.type,
        companyName: supplier.companyName,
        fantasyName: supplier.fantasyName,
        representative: supplier.representative,
        active: supplier.active,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        companies: [
          {
            id: company.id,
            name: company.name,
          },
        ],
      });
    });

    it('should return null when supplier is not found', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByCnpj', () => {
    let supplier: Supplier;

    beforeEach(async() => {
      supplier = await prisma.supplier.create({
        data: {
          id: 'supplier-find-by-cnpj',
          cnpj: '22.222.222/0001-22',
          ie: '222222222',
          group: 'CNPJ Test Group',
          type: 'CNPJ Test Type',
          companyName: 'CNPJ Test Company',
          fantasyName: 'CNPJ Test Fantasy',
          representative: 'CNPJ Test Representative',
          active: true,
        },
      });
    });

    it('should return the correct supplier when found by CNPJ', async() => {
      // Act
      const result = await sut.findByCnpj(supplier.cnpj);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<SupplierDto>({
        id: supplier.id,
        cnpj: supplier.cnpj,
        ie: supplier.ie,
        group: supplier.group,
        type: supplier.type,
        companyName: supplier.companyName,
        fantasyName: supplier.fantasyName,
        representative: supplier.representative,
        active: supplier.active,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        companies: [],
      });
    });

    it('should return null when supplier with CNPJ is not found', async() => {
      // Act
      const result = await sut.findByCnpj('99.999.999/0001-99');

      // Assert
      expect(result).toBeNull();
    });
  });
});
