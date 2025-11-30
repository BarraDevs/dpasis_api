import { Test, TestingModule } from '@nestjs/testing';
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

    await prisma.supplier.deleteMany();
  });

  afterEach(async() => {
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
      });
    });

    it('should return null when supplier does not exist', async() => {
      // Act
      const result = await sut.execute('non-existent-supplier-id');

      // Assert
      expect(result).toBeNull();
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
  });
});
