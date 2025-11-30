import { Test } from '@nestjs/testing';
import { Supplier } from '@prisma/client';
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

    await prisma.supplier.deleteMany();
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Supplier 1: Technology, Nacional
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
        },
      });

      // Supplier 2: Industrial, Internacional
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
        },
      });

      // Supplier 3: Technology, Nacional
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
        },
      });

      // Supplier 4: Raw Materials, Regional
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
        },
      });

      // Supplier 5: Services, Internacional
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
        },
      });

      // Supplier 6: Industrial, Nacional
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

    beforeEach(async() => {
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
