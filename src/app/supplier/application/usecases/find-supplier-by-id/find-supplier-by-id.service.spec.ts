import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDto } from '../../dtos/supplier.dto';
import { CreateSupplier } from '../create-supplier/create-supplier.service';
import { FindSupplierById } from './find-supplier-by-id.service';

describe('FindSupplierById', () => {
  let sut: FindSupplierById;
  let prisma: PrismaService;
  let createSupplier: CreateSupplier;
  let companyId1: string;
  let companyId2: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindSupplierById);
    prisma = module.get(PrismaService);
    createSupplier = module.get(CreateSupplier);

    await prisma.truncate();

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
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if supplier is not found', async() => {
      // Arrange
      const supplierId = 'non-existent-supplier-id';
      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(supplierId)).rejects.toBeInstanceOf(SupplierNotFoundError);
      expect(sut['supplierDao'].findById).toHaveBeenCalledWith(supplierId);

      // Cleanup
      findByIdSpy.mockRestore();
    });

    it('should return supplier data when found', async() => {
      // Arrange
      const supplierId = 'existing-supplier-id';
      const expectedSupplier = createMock<SupplierDto>();

      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(expectedSupplier);

      // Act
      const result = await sut.execute(supplierId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(expectedSupplier);

      // Cleanup
      findByIdSpy.mockRestore();
    });

    it('should pass through any errors from supplierDao', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const error = new Error('Database connection error');
      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute(supplierId)).rejects.toThrow('Database connection error');
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);

      // Cleanup
      findByIdSpy.mockRestore();
    });
  });

  describe('integration tests', () => {
    it('should return supplier when found by existing id', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '29.303.255/0001-05',
        ie: '123.456.789',
        group: 'Integration Test Group',
        type: 'Integration Test Type',
        companyName: 'Integration Test Company Ltd',
        fantasyName: 'Integration Test Fantasy',
        representative: 'Integration Test Representative',
        companyIds: [companyId1],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<SupplierDto>({
        id: supplier.id,
        cnpj: '29303255000105',
        ie: '123.456.789',
        group: 'Integration Test Group',
        type: 'Integration Test Type',
        companyName: 'Integration Test Company Ltd',
        fantasyName: 'Integration Test Fantasy',
        representative: 'Integration Test Representative',
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({ id: companyId1 }),
        ]),
      });
    });

    it('should throw an error when supplier does not exist', async() => {
      // Act & Assert
      await expect(sut.execute('non-existent-supplier-id')).rejects.toBeInstanceOf(SupplierNotFoundError);
    });

    it('should return correct supplier even when multiple suppliers exist', async() => {
      // Arrange - Create additional suppliers
      const supplier2 = await prisma.supplier.create({
        data: {
          id: 'second-supplier-id',
          cnpj: '86.038.719/0001-37',
          ie: '987.654.321',
          group: 'Second Group',
          type: 'Second Type',
          companyName: 'Second Company Ltd',
          fantasyName: 'Second Fantasy',
          representative: 'Second Representative',
          active: false,
          resource: {
            create: {
              id: 'second-supplier-id',
              active: false,
            },
          },
        },
      });

      const supplier3 = await prisma.supplier.create({
        data: {
          id: 'third-supplier-id',
          cnpj: '35275774000100',
          ie: '111.222.333',
          group: 'Third Group',
          type: 'Third Type',
          companyName: 'Third Company Ltd',
          fantasyName: 'Third Fantasy',
          representative: 'Third Representative',
          active: true,
          resource: {
            create: {
              id: 'third-supplier-id',
              active: true,
            },
          },
        },
      });

      // Act
      const result = await sut.execute(supplier2.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(supplier2.id);
      expect(result?.cnpj).toBe(supplier2.cnpj);
      expect(result?.companyName).toBe(supplier2.companyName);
      expect(result?.active).toBe(false);

      // Should not return data from other suppliers
      expect(result?.id).not.toBe(supplier3.id);
    });

    it('should return supplier with empty companies array', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '67.942.043/0001-67',
        ie: '999.888.777',
        group: 'No Company Group',
        type: 'No Company Type',
        companyName: 'No Company Supplier Ltd',
        fantasyName: 'No Company',
        representative: 'No Company Rep',
        companyIds: [],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.companies).toBeDefined();
      expect(result?.companies).toEqual([]);
      expect(result?.companies).toHaveLength(0);
    });

    it('should return supplier with single company', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '01.427.316/0001-27',
        ie: '111.222.333',
        group: 'Single Company Group',
        type: 'Single Company Type',
        companyName: 'Single Company Supplier Ltd',
        fantasyName: 'Single Company',
        representative: 'Single Company Rep',
        companyIds: [companyId1],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.companies).toBeDefined();
      expect(result?.companies).toHaveLength(1);
      expect(result?.companies[0]).toEqual({
        id: companyId1,
        name: 'Test Company 1',
      });
    });

    it('should return supplier with multiple companies', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '52.435.131/0001-03',
        ie: '444.555.666',
        group: 'Multiple Companies Group',
        type: 'Multiple Companies Type',
        companyName: 'Multiple Companies Supplier Ltd',
        fantasyName: 'Multiple Companies',
        representative: 'Multiple Companies Rep',
        companyIds: [companyId1, companyId2],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.companies).toBeDefined();
      expect(result?.companies).toHaveLength(2);

      const companyIds = result?.companies.map(c => c.id) || [];
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);

      expect(result?.companies).toEqual(
        expect.arrayContaining([
          { id: companyId1, name: 'Test Company 1' },
          { id: companyId2, name: 'Test Company 2' },
        ])
      );
    });

    it('should return companies with correct structure (id and name)', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '20.021.261/0001-03',
        ie: '777.888.999',
        group: 'Structure Test Group',
        type: 'Structure Test Type',
        companyName: 'Structure Test Supplier Ltd',
        fantasyName: 'Structure Test',
        representative: 'Structure Test Rep',
        companyIds: [companyId2],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.companies).toBeDefined();
      expect(result?.companies).toHaveLength(1);

      const company = result?.companies[0];
      expect(company).toHaveProperty('id');
      expect(company).toHaveProperty('name');
      expect(typeof company?.id).toBe('string');
      expect(typeof company?.name).toBe('string');
      expect(company?.id).toBe(companyId2);
      expect(company?.name).toBe('Test Company 2');
    });

    it('should always return companies array even when supplier has no companies', async() => {
      // Arrange
      const supplier = await createSupplier.execute({
        cnpj: '75.279.173/0001-90',
        ie: '000.111.222',
        group: 'Always Array Group',
        type: 'Always Array Type',
        companyName: 'Always Array Supplier Ltd',
        fantasyName: 'Always Array',
        representative: 'Always Array Rep',
        companyIds: [],
      });

      // Act
      const result = await sut.execute(supplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.companies).toBeDefined();
      expect(Array.isArray(result?.companies)).toBe(true);
      expect(result?.companies).toEqual([]);
    });
  });
});
