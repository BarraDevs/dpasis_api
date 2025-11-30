import { Test, TestingModule } from '@nestjs/testing';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDto } from '../../dtos/supplier.dto';
import { CreateSupplier } from '../create-supplier/create-supplier.service';
import { CreateSupplierInputDto } from '../create-supplier/dtos/create-supplier.dto';
import { FindSupplierById } from '../find-supplier-by-id/find-supplier-by-id.service';
import { EditSupplierInputDto } from './dtos/edit-supplier.dto';
import { EditSupplier } from './edit-supplier.service';

describe('EditSupplier', () => {
  let sut: EditSupplier;
  let prisma: PrismaService;
  let createSupplier: CreateSupplier;
  let findSupplierById: FindSupplierById;
  let existingSupplierId: string;
  let createSupplierData: CreateSupplierInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditSupplier);
    prisma = module.get(PrismaService);
    createSupplier = module.get(CreateSupplier);
    findSupplierById = module.get(FindSupplierById);

    // Clean database for integration tests
    await prisma.supplier.deleteMany();

    // Create a supplier for testing edits
    createSupplierData = {
      cnpj: '23741590000109',
      ie: '123456789',
      group: 'Original Group',
      type: 'Original Type',
      companyName: 'Original Supplier Ltd',
      fantasyName: 'Original Supplier',
      representative: 'Original Rep',
    };

    const createResult = await createSupplier.execute(createSupplierData);
    existingSupplierId = createResult.id;
  });

  afterEach(async() => {
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw SupplierNotFoundError when supplier does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const editData: EditSupplierInputDto = {};

      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(SupplierNotFoundError);
      expect(findByIdSpy).toHaveBeenCalledWith(nonExistentId);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should call supplierDao.findById and supplierRepository.edit with correct values', async() => {
      // Arrange
      const supplierId = 'supplier-id-123';
      const existingSupplierData: SupplierDto = {
        id: supplierId,
        cnpj: '23741590000109',
        ie: '123456789',
        group: 'Old Group',
        type: 'Old Type',
        companyName: 'Old Supplier Ltd',
        fantasyName: 'Old Supplier',
        representative: 'Old Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditSupplierInputDto = {
        companyName: 'New Supplier Ltd',
      };

      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplierData);
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(supplierId, editData);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id: supplierId,
          companyName: 'New Supplier Ltd',
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Fornecedor editado com sucesso!' });
    });

    it('should merge existing data with new data when editing', async() => {
      // Arrange
      const supplierId = 'supplier-id-456';
      const existingSupplierData: SupplierDto = {
        id: supplierId,
        cnpj: '23741590000109',
        ie: '111111111',
        group: 'Existing Group',
        type: 'Existing Type',
        companyName: 'Existing Supplier Ltd',
        fantasyName: 'Existing Supplier',
        representative: 'Existing Rep',
        active: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const editData: EditSupplierInputDto = {
        fantasyName: 'Updated Supplier',
        group: 'Updated Group',
      };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplierData);
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, editData);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id: supplierId,
          companyName: 'Existing Supplier Ltd', // Preserved
          fantasyName: 'Updated Supplier', // Updated
          group: 'Updated Group', // Updated
          type: 'Existing Type', // Preserved
        }),
      }));
    });

    it('should throw SupplierDuplicateCnpjError when trying to change to existing CNPJ', async() => {
      // Arrange
      const supplierId = 'supplier-id-789';
      const existingSupplierData: SupplierDto = {
        id: supplierId,
        cnpj: '23741590000109',
        ie: '222222222',
        group: 'Supplier A Group',
        type: 'Supplier A Type',
        companyName: 'Supplier A Ltd',
        fantasyName: 'Supplier A',
        representative: 'Supplier A Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditSupplierInputDto = {
        cnpj: '55.967.002/0001-46', // CNPJ of another supplier
      };

      const duplicateSupplier: SupplierDto = {
        id: 'other-supplier-id',
        cnpj: '55967002000146',
        ie: '333333333',
        group: 'Supplier B Group',
        type: 'Supplier B Type',
        companyName: 'Supplier B Ltd',
        fantasyName: 'Supplier B',
        representative: 'Supplier B Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplierData);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(duplicateSupplier);
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(supplierId, editData)).rejects.toBeInstanceOf(SupplierDuplicateCnpjError);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should not check for duplicate CNPJ when CNPJ is not being changed', async() => {
      // Arrange
      const supplierId = 'supplier-id-999';
      const existingSupplierData: SupplierDto = {
        id: supplierId,
        cnpj: '23741590000109',
        ie: '444444444',
        group: 'Same CNPJ Group',
        type: 'Same CNPJ Type',
        companyName: 'Same CNPJ Supplier',
        fantasyName: 'Same CNPJ',
        representative: 'Same CNPJ Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditSupplierInputDto = {
        companyName: 'Updated Name',
      };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplierData);
      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj');
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, editData);

      // Assert
      expect(findByCnpjSpy).not.toHaveBeenCalled();
      expect(editSpy).toHaveBeenCalled();
    });

    it('should allow editing to same CNPJ (sanitized)', async() => {
      // Arrange
      const supplierId = 'supplier-id-111';
      const existingSupplierData: SupplierDto = {
        id: supplierId,
        cnpj: '23741590000109',
        ie: '555555555',
        group: 'Sanitized Group',
        type: 'Sanitized Type',
        companyName: 'Sanitized Supplier',
        fantasyName: 'Sanitized',
        representative: 'Sanitized Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditSupplierInputDto = {
        cnpj: '23.741.590/0001-09', // Same CNPJ with formatting
      };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplierData);
      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj');
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, editData);

      // Assert
      expect(findByCnpjSpy).not.toHaveBeenCalled(); // Because sanitized CNPJ is same as existing
      expect(editSpy).toHaveBeenCalled();
    });

    it('should sanitize CNPJ through Supplier entity', async() => {
      // Arrange
      const supplierId = 'supplier-id-222';
      const existingSupplierData: SupplierDto = {
        id: supplierId,
        cnpj: '23741590000109',
        ie: '666666666',
        group: 'Sanitize Test Group',
        type: 'Sanitize Test Type',
        companyName: 'Sanitize Test Supplier',
        fantasyName: 'Sanitize Test',
        representative: 'Sanitize Test Rep',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const editData: EditSupplierInputDto = {
        cnpj: '55.967.002/0001-46',
      };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplierData);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, editData);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          cnpj: '55967002000146',
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw SupplierNotFoundError when supplier does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id-123';
      const editData: EditSupplierInputDto = { companyName: 'New Name' };

      // Act & Assert
      await expect(sut.execute(nonExistentId, editData)).rejects.toThrow(SupplierNotFoundError);
    });

    it('should successfully edit supplier company name', async() => {
      // Arrange
      const editData: EditSupplierInputDto = {
        companyName: 'Updated Supplier Ltd',
      };

      // Act
      const result = await sut.execute(existingSupplierId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Fornecedor editado com sucesso!' });

      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.companyName).toBe('Updated Supplier Ltd');
      expect(updatedSupplier!.fantasyName).toBe(createSupplierData.fantasyName); // Unchanged
    });

    it('should successfully edit multiple fields', async() => {
      // Arrange
      const editData: EditSupplierInputDto = {
        companyName: 'Multi Edit Supplier Ltd',
        fantasyName: 'Multi Edit',
        group: 'New Group',
        type: 'New Type',
      };

      // Act
      const result = await sut.execute(existingSupplierId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Fornecedor editado com sucesso!' });

      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.companyName).toBe('Multi Edit Supplier Ltd');
      expect(updatedSupplier!.fantasyName).toBe('Multi Edit');
      expect(updatedSupplier!.group).toBe('New Group');
      expect(updatedSupplier!.type).toBe('New Type');
      expect(updatedSupplier!.cnpj).toBe(createSupplierData.cnpj); // Unchanged
      expect(updatedSupplier!.ie).toBe(createSupplierData.ie); // Unchanged
    });

    it('should preserve createdAt timestamp when editing', async() => {
      // Arrange
      const initialSupplier = await findSupplierById.execute(existingSupplierId);
      const initialCreatedAt = initialSupplier!.createdAt;

      const editData: EditSupplierInputDto = {
        companyName: 'CreatedAt Test Supplier',
      };

      // Act
      await sut.execute(existingSupplierId, editData);

      // Assert
      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.createdAt).toEqual(initialCreatedAt);
    });

    it('should sanitize CNPJ when editing', async() => {
      // Arrange
      const editData: EditSupplierInputDto = {
        cnpj: '67.942.043/0001-67', // With formatting
      };

      // Act
      await sut.execute(existingSupplierId, editData);

      // Assert
      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.cnpj).toBe('67942043000167'); // Sanitized (no formatting)
    });

    it('should throw SupplierDuplicateCnpjError when changing to existing CNPJ', async() => {
      // Arrange
      const secondSupplierResult = await createSupplier.execute({
        cnpj: '67942043000167',
        ie: '987654321',
        group: 'Second Group',
        type: 'Second Type',
        companyName: 'Second Supplier Ltd',
        fantasyName: 'Second Supplier',
        representative: 'Second Rep',
      });

      const secondSupplier = await findSupplierById.execute(secondSupplierResult.id);

      const editData: EditSupplierInputDto = {
        cnpj: secondSupplier!.cnpj, // Try to use second supplier's CNPJ
      };

      // Act & Assert
      await expect(sut.execute(existingSupplierId, editData)).rejects.toThrow(SupplierDuplicateCnpjError);

      // Verify first supplier's CNPJ was not changed
      const unchangedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(unchangedSupplier).not.toBeNull();
      expect(unchangedSupplier!.cnpj).toBe(createSupplierData.cnpj);
    });

    it('should allow editing supplier with same CNPJ (formatted differently)', async() => {
      // Arrange
      const editData: EditSupplierInputDto = {
        cnpj: '23.741.590/0001-09', // Same CNPJ with formatting
        companyName: 'Same CNPJ Test',
      };

      // Act
      const result = await sut.execute(existingSupplierId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Fornecedor editado com sucesso!' });

      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.cnpj).toBe('23741590000109');
      expect(updatedSupplier!.companyName).toBe('Same CNPJ Test');
    });

    it('should edit all fields at once', async() => {
      // Arrange
      const editData: EditSupplierInputDto = {
        cnpj: '67942043000167',
        ie: '999888777',
        group: 'Complete Group',
        type: 'Complete Type',
        companyName: 'Complete Edit Supplier Ltd',
        fantasyName: 'Complete Edit',
        representative: 'Complete Representative',
      };

      // Act
      await sut.execute(existingSupplierId, editData);

      // Assert
      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.id).toBe(existingSupplierId); // ID unchanged
      expect(updatedSupplier!.cnpj).toBe('67942043000167');
      expect(updatedSupplier!.ie).toBe('999888777');
      expect(updatedSupplier!.group).toBe('Complete Group');
      expect(updatedSupplier!.type).toBe('Complete Type');
      expect(updatedSupplier!.companyName).toBe('Complete Edit Supplier Ltd');
      expect(updatedSupplier!.fantasyName).toBe('Complete Edit');
      expect(updatedSupplier!.representative).toBe('Complete Representative');
      expect(updatedSupplier!.active).toBe(true); // active unchanged
    });

    it('should handle multiple edits to same supplier', async() => {
      // Arrange & Act - First edit
      await sut.execute(existingSupplierId, { companyName: 'First Edit' });
      const firstEdit = await findSupplierById.execute(existingSupplierId);

      // Second edit
      await sut.execute(existingSupplierId, { fantasyName: 'Second Edit Fantasy' });
      const secondEdit = await findSupplierById.execute(existingSupplierId);

      // Third edit
      await sut.execute(existingSupplierId, { group: 'Third Edit Group' });
      const thirdEdit = await findSupplierById.execute(existingSupplierId);

      // Assert
      expect(firstEdit).not.toBeNull();
      expect(firstEdit!.companyName).toBe('First Edit');
      expect(secondEdit).not.toBeNull();
      expect(secondEdit!.companyName).toBe('First Edit'); // Preserved from first edit
      expect(secondEdit!.fantasyName).toBe('Second Edit Fantasy');
      expect(thirdEdit).not.toBeNull();
      expect(thirdEdit!.companyName).toBe('First Edit'); // Still preserved
      expect(thirdEdit!.fantasyName).toBe('Second Edit Fantasy'); // Still preserved
      expect(thirdEdit!.group).toBe('Third Edit Group');
    });

    it('should preserve active status when editing', async() => {
      // Arrange
      const initialSupplier = await findSupplierById.execute(existingSupplierId);
      const editData: EditSupplierInputDto = {
        companyName: 'Active Status Test',
      };

      // Act
      await sut.execute(existingSupplierId, editData);

      // Assert
      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.active).toBe(initialSupplier!.active);
    });

    it('should validate CNPJ when editing', async() => {
      // Arrange
      const editData: EditSupplierInputDto = {
        cnpj: '00.000.000/0000-00', // Invalid CNPJ
      };

      // Act & Assert
      await expect(sut.execute(existingSupplierId, editData)).rejects.toThrow();
    });

    it('should edit only provided fields and keep others unchanged', async() => {
      // Arrange
      const initialSupplier = await findSupplierById.execute(existingSupplierId);
      const editData: EditSupplierInputDto = {
        fantasyName: 'Only Fantasy Changed',
      };

      // Act
      await sut.execute(existingSupplierId, editData);

      // Assert
      const updatedSupplier = await findSupplierById.execute(existingSupplierId);
      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier!.fantasyName).toBe('Only Fantasy Changed');
      expect(updatedSupplier!.companyName).toBe(initialSupplier!.companyName);
      expect(updatedSupplier!.cnpj).toBe(initialSupplier!.cnpj);
      expect(updatedSupplier!.ie).toBe(initialSupplier!.ie);
      expect(updatedSupplier!.group).toBe(initialSupplier!.group);
      expect(updatedSupplier!.type).toBe(initialSupplier!.type);
      expect(updatedSupplier!.representative).toBe(initialSupplier!.representative);
    });
  });
});
