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

  afterAll(async() => {
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    let supplier1: Supplier;
    let supplier2: Supplier;
    let supplier3: Supplier;

    beforeEach(async() => {
      // Seed data for findAll tests
      supplier1 = await prisma.supplier.create({
        data: {
          id: 'supplier-01',
          cnpj: '11.222.333/0001-44',
          ie: '123456789',
          group: 'Group A',
          type: 'Type A',
          companyName: 'Empresa ABC Ltda',
          fantasyName: 'ABC',
          representative: 'João Silva',
          active: true,
        },
      });

      supplier2 = await prisma.supplier.create({
        data: {
          id: 'supplier-02',
          cnpj: '22.333.444/0001-55',
          ie: '987654321',
          group: 'Group B',
          type: 'Type B',
          companyName: 'XYZ Comércio S.A.',
          fantasyName: 'XYZ',
          representative: 'Maria Santos',
          active: true,
        },
      });

      supplier3 = await prisma.supplier.create({
        data: {
          id: 'supplier-03',
          cnpj: '33.444.555/0001-66',
          ie: '111222333',
          group: 'Group A',
          type: 'Type C',
          companyName: 'DEF Indústria e Comércio',
          fantasyName: 'DEF',
          representative: 'Carlos Oliveira',
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
      expect(total).toBe(3);
      expect(suppliers).toHaveLength(3);
      expect(suppliers.map(s => s.id)).toEqual(
        expect.arrayContaining([supplier1.id, supplier2.id, supplier3.id])
      );
    });

    it('should return suppliers ordered by createdAt desc by default', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {};

      // Act
      const [suppliers] = await sut.findAll(queries);

      // Assert
      expect(suppliers).toHaveLength(3);
      // The most recently created should be first (supplier3 was created last)
      expect(suppliers[0].id).toBe(supplier3.id);
    });

    it('should filter suppliers by company name (case insensitive)', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'abc',
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(1);
      expect(suppliers).toHaveLength(1);
      expect(suppliers[0].id).toBe(supplier1.id);
      expect(suppliers[0].companyName).toBe('Empresa ABC Ltda');
    });

    it('should filter suppliers by partial company name', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'Comércio',
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(2);
      expect(suppliers).toHaveLength(2);
      expect(suppliers.map(s => s.id)).toEqual(
        expect.arrayContaining([supplier2.id, supplier3.id])
      );
    });

    it('should filter suppliers by CNPJ', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        cnpj: '22.333',
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(2);
      expect(suppliers).toHaveLength(2);
      expect(suppliers.map(s => s.id)).toEqual(
        expect.arrayContaining([supplier2.id, supplier1.id])
      );
    });

    it('should filter suppliers by company name OR CNPJ', async() => {
      const queries1: FindAllSupplierQueryDto = {
        companyName: 'ABC',
        cnpj: '0001-66',
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries1);

      // Assert
      expect(total).toBe(2);
      expect(suppliers).toHaveLength(2);
      expect(suppliers.map(s => s.id)).toEqual(
        expect.arrayContaining([supplier1.id, supplier3.id])
      );
    });

    it('should return paginated results', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        page: 2,
        size: 1,
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(suppliers).toHaveLength(1);
      expect(suppliers[0].id).toBe(supplier2.id);
    });

    it('should return empty results when no matches are found', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: 'Nonexistent Company',
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(0);
      expect(suppliers).toHaveLength(0);
    });

    it('should handle empty search terms', async() => {
      // Arrange
      const queries: FindAllSupplierQueryDto = {
        companyName: '',
        cnpj: '',
      };

      // Act
      const [suppliers, total] = await sut.findAll(queries);

      // Assert
      expect(total).toBe(3);
      expect(suppliers).toHaveLength(3);
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

  describe('findByIe', () => {
    let supplier: Supplier;

    beforeEach(async() => {
      supplier = await prisma.supplier.create({
        data: {
          id: 'supplier-find-by-ie',
          cnpj: '33.333.333/0001-33',
          ie: '333333333',
          group: 'IE Test Group',
          type: 'IE Test Type',
          companyName: 'IE Test Company',
          fantasyName: 'IE Test Fantasy',
          representative: 'IE Test Representative',
          active: true,
        },
      });
    });

    it('should return the correct supplier when found by IE', async() => {
      // Act
      const result = await sut.findByIe(supplier.ie);

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

    it('should return null when supplier with IE is not found', async() => {
      // Act
      const result = await sut.findByIe('999999999');

      // Assert
      expect(result).toBeNull();
    });
  });
});
