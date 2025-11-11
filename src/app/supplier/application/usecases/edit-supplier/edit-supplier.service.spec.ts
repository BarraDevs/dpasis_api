import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierDuplicateIeError } from 'src/app/supplier/domain/errors/duplicate-ie.error';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDto } from '../../dtos/supplier.dto';
import { EditSupplierInputDto } from './dtos/edit-supplier.dto';
import { EditSupplier } from './edit-supplier.service';

describe('EditSupplier', () => {
  let sut: EditSupplier;
  let prisma: PrismaService;

  const validEditDto: EditSupplierInputDto = {
    cnpj: '99.888.777/0001-66',
    ie: '999.888.777.000',
    group: 'Grupo Atualizado',
    type: 'Tipo Atualizado',
    companyName: 'Empresa Atualizada Ltda',
    fantasyName: 'Fantasia Atualizada',
    representative: 'Representante Atualizado',
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditSupplier);
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

  describe('unit tests', () => {
    it('should call supplierDao.findById with correct id', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>();

      const findByIdSpy = jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, validEditDto);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(supplierId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw SupplierNotFoundError when supplier does not exist', async() => {
      // Arrange
      const supplierId = 'non-existent-id';
      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(supplierId, validEditDto)).rejects.toThrow(SupplierNotFoundError);
    });

    it('should call findByCnpj when CNPJ is being changed', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>({ cnpj: '11.222.333/0001-44' });

      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, validEditDto);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith(validEditDto.cnpj);
      expect(findByCnpjSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT call findByCnpj when CNPJ is not being changed', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>({ cnpj: validEditDto.cnpj });

      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj');
      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, validEditDto);

      // Assert
      expect(findByCnpjSpy).not.toHaveBeenCalled();
    });

    it('should throw SupplierDuplicateCnpjError when trying to change to existing CNPJ', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>();
      const duplicateSupplier = { id: 'other-id', cnpj: validEditDto.cnpj };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(duplicateSupplier as any);

      // Act & Assert
      await expect(sut.execute(supplierId, validEditDto)).rejects.toThrow(SupplierDuplicateCnpjError);
    });

    it('should call findByIe when IE is being changed', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>({ ie: '123.456.789' });

      const findByIeSpy = jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(supplierId, validEditDto);

      // Assert
      expect(findByIeSpy).toHaveBeenCalledWith(validEditDto.ie);
      expect(findByIeSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw SupplierDuplicateIeError when trying to change to existing IE', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>();
      const duplicateSupplier = { id: 'other-id', ie: validEditDto.ie };

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(duplicateSupplier as any);

      // Act & Assert
      await expect(sut.execute(supplierId, validEditDto)).rejects.toThrow(SupplierDuplicateIeError);
    });

    it('should call supplierRepository.edit with updated supplier', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>();

      const editSpy = jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();
      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);

      // Act
      await sut.execute(supplierId, validEditDto);

      // Assert
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.any(Supplier));
    });

    it('should return success message when edit is successful', async() => {
      // Arrange
      const supplierId = 'test-supplier-id';
      const existingSupplier = createMock<SupplierDto>();

      jest.spyOn(sut['supplierDao'], 'findById').mockResolvedValue(existingSupplier);
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(supplierId, validEditDto);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Fornecedor editado com sucesso!',
      });
    });
  });

  describe('integration tests', () => {
    let existingSupplier: any;

    beforeEach(async() => {
      existingSupplier = await prisma.supplier.create({
        data: {
          id: 'existing-supplier-id',
          cnpj: '11.222.333/0001-44',
          ie: '123.456.789',
          group: 'Original Group',
          type: 'Original Type',
          companyName: 'Original Company',
          fantasyName: 'Original Fantasy',
          representative: 'Original Representative',
          active: true,
        },
      });
    });

    it('should successfully edit all supplier fields', async() => {
      // Act
      const result = await sut.execute(existingSupplier.id, validEditDto);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Fornecedor editado com sucesso!',
      });

      // Verify changes in database
      const updatedSupplier = await prisma.supplier.findUnique({
        where: { id: existingSupplier.id },
      });

      expect(updatedSupplier).not.toBeNull();
      expect(updatedSupplier?.cnpj).toBe(validEditDto.cnpj);
      expect(updatedSupplier?.ie).toBe(validEditDto.ie);
      expect(updatedSupplier?.group).toBe(validEditDto.group);
      expect(updatedSupplier?.type).toBe(validEditDto.type);
      expect(updatedSupplier?.companyName).toBe(validEditDto.companyName);
      expect(updatedSupplier?.fantasyName).toBe(validEditDto.fantasyName);
      expect(updatedSupplier?.representative).toBe(validEditDto.representative);
      expect(updatedSupplier?.active).toBe(true); // Should remain unchanged
    });

    it('should successfully edit only some fields', async() => {
      // Arrange
      const partialEditDto: EditSupplierInputDto = {
        companyName: 'Nova Razão Social',
        representative: 'Novo Representante',
      };

      // Act
      const result = await sut.execute(existingSupplier.id, partialEditDto);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Fornecedor editado com sucesso!',
      });

      // Verify changes in database
      const updatedSupplier = await prisma.supplier.findUnique({
        where: { id: existingSupplier.id },
      });

      expect(updatedSupplier?.companyName).toBe(partialEditDto.companyName);
      expect(updatedSupplier?.representative).toBe(partialEditDto.representative);
      // Unchanged fields
      expect(updatedSupplier?.cnpj).toBe(existingSupplier.cnpj);
      expect(updatedSupplier?.ie).toBe(existingSupplier.ie);
      expect(updatedSupplier?.group).toBe(existingSupplier.group);
    });

    it('should throw SupplierNotFoundError when supplier does not exist', async() => {
      // Act & Assert
      await expect(sut.execute('non-existent-id', validEditDto)).rejects.toThrow(SupplierNotFoundError);
    });

    it('should throw SupplierDuplicateCnpjError when trying to change to existing CNPJ', async() => {
      // Arrange - Create another supplier with different CNPJ
      const anotherSupplier = await prisma.supplier.create({
        data: {
          id: 'another-supplier-id',
          cnpj: '99.888.777/0001-66', // This will be the target CNPJ
          ie: '999.888.777',
          group: 'Another Group',
          type: 'Another Type',
          companyName: 'Another Company',
          fantasyName: 'Another Fantasy',
          representative: 'Another Representative',
          active: true,
        },
      });

      const editDto: EditSupplierInputDto = {
        cnpj: anotherSupplier.cnpj, // Trying to use existing CNPJ
      };

      // Act & Assert
      await expect(sut.execute(existingSupplier.id, editDto)).rejects.toThrow(SupplierDuplicateCnpjError);
    });

    it('should throw SupplierDuplicateIeError when trying to change to existing IE', async() => {
      // Arrange - Create another supplier with different IE
      const anotherSupplier = await prisma.supplier.create({
        data: {
          id: 'another-supplier-id',
          cnpj: '99.888.777/0001-66',
          ie: '999.888.777', // This will be the target IE
          group: 'Another Group',
          type: 'Another Type',
          companyName: 'Another Company',
          fantasyName: 'Another Fantasy',
          representative: 'Another Representative',
          active: true,
        },
      });

      const editDto: EditSupplierInputDto = {
        ie: anotherSupplier.ie, // Trying to use existing IE
      };

      // Act & Assert
      await expect(sut.execute(existingSupplier.id, editDto)).rejects.toThrow(SupplierDuplicateIeError);
    });

    it('should allow updating to same CNPJ and IE (no changes)', async() => {
      // Arrange
      const editDto: EditSupplierInputDto = {
        cnpj: existingSupplier.cnpj, // Same CNPJ
        ie: existingSupplier.ie, // Same IE
        companyName: 'Nova Razão Social',
      };

      // Act
      const result = await sut.execute(existingSupplier.id, editDto);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Fornecedor editado com sucesso!',
      });

      // Verify changes in database
      const updatedSupplier = await prisma.supplier.findUnique({
        where: { id: existingSupplier.id },
      });

      expect(updatedSupplier?.cnpj).toBe(existingSupplier.cnpj);
      expect(updatedSupplier?.ie).toBe(existingSupplier.ie);
      expect(updatedSupplier?.companyName).toBe(editDto.companyName);
    });

    it('should handle empty edit data', async() => {
      // Arrange
      const emptyEditDto: EditSupplierInputDto = {};

      // Act
      const result = await sut.execute(existingSupplier.id, emptyEditDto);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Fornecedor editado com sucesso!',
      });

      // Verify no changes in database (all fields remain the same)
      const updatedSupplier = await prisma.supplier.findUnique({
        where: { id: existingSupplier.id },
      });

      expect(updatedSupplier?.cnpj).toBe(existingSupplier.cnpj);
      expect(updatedSupplier?.ie).toBe(existingSupplier.ie);
      expect(updatedSupplier?.group).toBe(existingSupplier.group);
      expect(updatedSupplier?.companyName).toBe(existingSupplier.companyName);
    });
  });
});
