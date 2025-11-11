import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { CompanyDuplicateIeError } from 'src/app/company/domain/errors/duplicate-ie.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDto } from '../../dtos/company.dto';
import { CreateCompany } from '../create-company/create-company.service';
import { CreateCompanyInputDto } from '../create-company/dtos/create-company.dto';
import { EditCompanyInputDto } from './dtos/edit-company.dto';
import { EditCompany } from './edit-company.service';

describe('EditCompany', () => {
  let sut: EditCompany;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let existingCompanyId: string;
  let createCompanyData: CreateCompanyInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditCompany);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);

    // Clean database for integration tests
    await prisma.company.deleteMany();

    // Create a company for testing edits
    createCompanyData = {
      name: 'Original Company Ltd',
      fantasyName: 'Original Company',
      document: '12345678000195',
      ie: '123456789',
      phone01: '11999887766',
      phone02: '1133445566',
      cellphone: '11988776655',
      email01: 'original@company.com',
      email02: 'sales@company.com',
      zipCode: '01234567',
      street: 'Rua Original',
      number: '123',
      complement: 'Sala 1',
      reference: 'Próximo ao mercado',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };

    const createResult = await createCompany.execute(createCompanyData);
    existingCompanyId = createResult.id;
  });

  afterAll(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw CompanyNotFoundError when company does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const editData: EditCompanyInputDto = {};

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(CompanyNotFoundError);
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(nonExistentId);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should throw CompanyDuplicateDocumentError when document already exists for another company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        document: '12345678000195',
      });
      const duplicateCompany = createMock<CompanyDto>({
        id: 'another-id',
        document: '98765432000187',
      });
      const editData: EditCompanyInputDto = { document: '98765432000187' };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      jest.spyOn(sut['companyDao'], 'findByDocument').mockResolvedValue(duplicateCompany);
      const editSpy = jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(sut['companyDao'].findByDocument).toHaveBeenCalledWith(editData.document);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should throw CompanyDuplicateIeError when ie already exists for another company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        ie: '123456789',
      });
      const duplicateCompany = createMock<CompanyDto>({
        id: 'another-id',
        ie: '987654321',
      });
      const editData: EditCompanyInputDto = { ie: '987654321' };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      jest.spyOn(sut['companyDao'], 'findByIe').mockResolvedValue(duplicateCompany);
      const editSpy = jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateIeError);
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(sut['companyDao'].findByIe).toHaveBeenCalledWith(editData.ie);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should not check for document duplication when document is not being changed', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        document: '12345678000195',
      });
      const editData: EditCompanyInputDto = { name: 'Updated Company Name' };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      const findByDocumentSpy = jest.spyOn(sut['companyDao'], 'findByDocument').mockResolvedValue(null);
      jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByDocumentSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should not check for ie duplication when ie is not being changed', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        ie: '123456789',
      });
      const editData: EditCompanyInputDto = { name: 'Updated Company Name' };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      const findByIeSpy = jest.spyOn(sut['companyDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByIeSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should allow same document when updating the same company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        document: '12345678000195',
      });
      const editData: EditCompanyInputDto = {
        name: 'Updated Name',
        document: '12345678000195',
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      const findByDocumentSpy = jest.spyOn(sut['companyDao'], 'findByDocument').mockResolvedValue(null);
      jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByDocumentSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should allow same ie when updating the same company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        ie: '123456789',
      });
      const editData: EditCompanyInputDto = {
        name: 'Updated Name',
        ie: '123456789',
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      const findByIeSpy = jest.spyOn(sut['companyDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByIeSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should successfully update company when all validations pass', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        document: '12345678000195',
        ie: '123456789',
      });
      const editData: EditCompanyInputDto = {
        name: 'Updated Company Name',
        fantasyName: 'Updated Fantasy',
        phone01: '11888777666',
      };

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(existingCompany);
      jest.spyOn(sut['companyDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(existingCompanyId);
      expect(sut['companyDao'].edit).toHaveBeenCalledWith(existingCompanyId, editData);
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });
  });

  describe('integration tests', () => {
    it('should throw CompanyNotFoundError when company does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const editData: EditCompanyInputDto = { name: 'Updated Company' };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(CompanyNotFoundError);
    });

    it('should throw CompanyDuplicateDocumentError when document already exists for another company in database', async() => {
      // Arrange
      const anotherCompanyData: CreateCompanyInputDto = {
        ...createCompanyData,
        document: '98765432000187',
        ie: '987654321',
      };
      await createCompany.execute(anotherCompanyData);

      const editData: EditCompanyInputDto = { document: '98765432000187' };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
    });

    it('should throw CompanyDuplicateIeError when ie already exists for another company in database', async() => {
      // Arrange
      const anotherCompanyData: CreateCompanyInputDto = {
        ...createCompanyData,
        document: '98765432000187',
        ie: '987654321',
      };
      await createCompany.execute(anotherCompanyData);

      const editData: EditCompanyInputDto = { ie: '987654321' };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateIeError);
    });

    it('should successfully update company name in database', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        name: 'Updated Company Name',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      // Verify update in database
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany).toEqual<CompanyDto>({
        ...createCompanyData,
        name: 'Updated Company Name',
        id: existingCompanyId,
        createdAt: updatedCompany!.createdAt,
        updatedAt: updatedCompany!.updatedAt,
      });
    });

    it('should successfully update multiple fields in database', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        name: 'Completely Updated Company',
        fantasyName: 'Updated Fantasy',
        phone01: '11999999999',
        email01: 'updated@company.com',
        city: 'Rio de Janeiro',
        state: 'RJ',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      // Verify updates in database
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany).toEqual<CompanyDto>({
        ...createCompanyData,
        ...editData,
        id: existingCompanyId,
        createdAt: updatedCompany!.createdAt,
        updatedAt: updatedCompany!.updatedAt,
      });
    });

    it('should successfully update document to new unique value', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '11111111000111',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      // Verify update in database
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany?.document).toBe(editData.document);
    });

    it('should successfully update ie to new unique value', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        ie: '111111111',
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      // Verify update in database
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany?.ie).toBe(editData.ie);
    });

    it('should handle optional fields being set to null', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        phone02: null,
        cellphone: null,
        email02: null,
        complement: null,
        reference: null,
      };

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });

      // Verify update in database
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany).toBeDefined();
      expect(updatedCompany?.phone02).toBeNull();
      expect(updatedCompany?.cellphone).toBeNull();
      expect(updatedCompany?.email02).toBeNull();
      expect(updatedCompany?.complement).toBeNull();
      expect(updatedCompany?.reference).toBeNull();
    });
  });
});
