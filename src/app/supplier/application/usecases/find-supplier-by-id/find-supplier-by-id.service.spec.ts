import { Test, TestingModule } from '@nestjs/testing';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDto } from '../../dtos/supplier.dto';
import { FindSupplierById } from './find-supplier-by-id.service';

describe('FindSupplierById', () => {
  let sut: FindSupplierById;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindSupplierById);
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

  describe('unit tests', () => {
    it('should call supplierDao.findById with correct id', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(null);

      // Act
      await sut.execute(supplierId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      findByIdSpy.mockRestore();
    });

    it('should return supplier data when found', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const mockSupplier: SupplierDto = {
        id: supplierId,
        cnpj: '11.222.333/0001-44',
        ie: '123.456.789',
        group: 'Test Group',
        type: 'Test Type',
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Fantasy',
        representative: 'Test Representative',
        active: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(mockSupplier);

      // Act
      const result = await sut.execute(supplierId);

      // Assert
      expect(result).toEqual(mockSupplier);
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);

      // Cleanup
      findByIdSpy.mockRestore();
    });

    it('should return null when supplier is not found', async() => {
      // Arrange
      const supplierId = 'non-existent-id';
      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(null);

      // Act
      const result = await sut.execute(supplierId);

      // Assert
      expect(result).toBeNull();
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);

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
    let createdSupplier: any;

    beforeEach(async() => {
      createdSupplier = await prisma.supplier.create({
        data: {
          id: 'integration-test-supplier-id',
          cnpj: '11.222.333/0001-44',
          ie: '123.456.789',
          group: 'Integration Test Group',
          type: 'Integration Test Type',
          companyName: 'Integration Test Company Ltd',
          fantasyName: 'Integration Test Fantasy',
          representative: 'Integration Test Representative',
          active: true,
        },
      });
    });

    it('should return supplier when found by existing id', async() => {
      // Act
      const result = await sut.execute(createdSupplier.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdSupplier.id);
      expect(result?.cnpj).toBe(createdSupplier.cnpj);
      expect(result?.ie).toBe(createdSupplier.ie);
      expect(result?.group).toBe(createdSupplier.group);
      expect(result?.type).toBe(createdSupplier.type);
      expect(result?.companyName).toBe(createdSupplier.companyName);
      expect(result?.fantasyName).toBe(createdSupplier.fantasyName);
      expect(result?.representative).toBe(createdSupplier.representative);
      expect(result?.active).toBe(createdSupplier.active);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null when supplier does not exist', async() => {
      // Act
      const result = await sut.execute('non-existent-supplier-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when id is empty string', async() => {
      // Act
      const result = await sut.execute('');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle malformed UUID gracefully', async() => {
      // Act
      const result = await sut.execute('invalid-uuid-format');

      // Assert
      expect(result).toBeNull();
    });

    it('should return correct supplier even when multiple suppliers exist', async() => {
      // Arrange - Create additional suppliers
      const supplier2 = await prisma.supplier.create({
        data: {
          id: 'second-supplier-id',
          cnpj: '22.333.444/0001-55',
          ie: '987.654.321',
          group: 'Second Group',
          type: 'Second Type',
          companyName: 'Second Company Ltd',
          fantasyName: 'Second Fantasy',
          representative: 'Second Representative',
          active: false,
        },
      });

      const supplier3 = await prisma.supplier.create({
        data: {
          id: 'third-supplier-id',
          cnpj: '33.444.555/0001-66',
          ie: '111.222.333',
          group: 'Third Group',
          type: 'Third Type',
          companyName: 'Third Company Ltd',
          fantasyName: 'Third Fantasy',
          representative: 'Third Representative',
          active: true,
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
      expect(result?.id).not.toBe(createdSupplier.id);
      expect(result?.id).not.toBe(supplier3.id);
    });

    it('should return supplier with all expected SupplierDto properties', async() => {
      // Act
      const result = await sut.execute(createdSupplier.id);

      // Assert - Verify all SupplierDto properties are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('cnpj');
      expect(result).toHaveProperty('ie');
      expect(result).toHaveProperty('group');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('fantasyName');
      expect(result).toHaveProperty('representative');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      // Verify property types
      expect(typeof result?.id).toBe('string');
      expect(typeof result?.cnpj).toBe('string');
      expect(typeof result?.ie).toBe('string');
      expect(typeof result?.group).toBe('string');
      expect(typeof result?.type).toBe('string');
      expect(typeof result?.companyName).toBe('string');
      expect(typeof result?.fantasyName).toBe('string');
      expect(typeof result?.representative).toBe('string');
      expect(typeof result?.active).toBe('boolean');
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
