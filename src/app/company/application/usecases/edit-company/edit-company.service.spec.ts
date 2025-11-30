import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { CompanyDuplicateIeError } from 'src/app/company/domain/errors/duplicate-ie.error';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDto } from '../../dtos/company.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import type { ICompanyRepository } from '../../persistence/repository/company-repository.interface';
import { CreateCompany } from '../create-company/create-company.service';
import { CreateCompanyInputDto } from '../create-company/dtos/create-company.dto';
import { EditCompanyInputDto } from './dtos/edit-company.dto';
import { EditCompany } from './edit-company.service';

describe('EditCompany', () => {
  let sut: EditCompany;
  let companyDao: jest.Mocked<ICompanyDao>;
  let companyRepository: jest.Mocked<ICompanyRepository>;
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
    companyDao = module.get(TOKENS.CompanyDao);
    companyRepository = module.get(TOKENS.CompanyRepository);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);

    // Clean database for integration tests
    await prisma.company.deleteMany();

    // Create a company for testing edits
    createCompanyData = {
      name: 'Original Company Ltd',
      fantasyName: 'Original Company',
      document: '23741590000109',
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

  afterEach(async() => {
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

      jest.spyOn(companyDao, 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(CompanyNotFoundError);
      expect(companyDao.findById).toHaveBeenCalledWith(nonExistentId);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should throw CompanyDuplicateDocumentError when document already exists for another company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>();
      const duplicateCompany = createMock<CompanyDto>();
      const editData: EditCompanyInputDto = { document: '98765432000187' };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(duplicateCompany);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(companyDao.findByDocument).toHaveBeenCalledWith(editData.document);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should throw CompanyDuplicateIeError when ie already exists for another company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>();
      const duplicateCompany = createMock<CompanyDto>();
      const editData: EditCompanyInputDto = { ie: '987654321' };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      jest.spyOn(companyDao, 'findByIe').mockResolvedValue(duplicateCompany);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateIeError);
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(companyDao.findByIe).toHaveBeenCalledWith(editData.ie);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should not check for document duplication when document is not being changed', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
      });
      const editData: EditCompanyInputDto = { name: 'Updated Company Name' };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const findByDocumentSpy = jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(null);
      jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByDocumentSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should not check for ie duplication when ie is not being changed', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
      });
      const editData: EditCompanyInputDto = { name: 'Updated Company Name' };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const findByIeSpy = jest.spyOn(companyDao, 'findByIe').mockResolvedValue(null);
      jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByIeSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should allow same document when updating the same company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
      });
      const editData: EditCompanyInputDto = {
        document: '23741590000109',
      };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const findByDocumentSpy = jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(null);
      jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByDocumentSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should allow same ie when updating the same company', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
        ie: '123456789',
      });
      const editData: EditCompanyInputDto = {
        ie: '123456789',
      };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const findByIeSpy = jest.spyOn(companyDao, 'findByIe').mockResolvedValue(null);
      jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(findByIeSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should successfully update company when all validations pass', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
      });
      const editData: EditCompanyInputDto = {
        name: 'Updated Company Ltd',
        fantasyName: 'Updated Company',
        phone01: '11991112222',
      };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(companyDao.findById).toHaveBeenCalledWith(existingCompanyId);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.any(Company));
      expect(result).toEqual<SuccessMessage>({ message: 'Empresa atualizada com sucesso!' });
    });

    it('should create Company entity with merged data when editing', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        name: 'Original Name',
        fantasyName: 'Original Fantasy',
        document: '23741590000109',
        ie: '123456789',
        email01: 'original@example.com',
        phone01: '11111111111',
      });
      const editData: EditCompanyInputDto = {
        name: 'Updated Name',
        fantasyName: 'Updated Fantasy',
      };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const savedCompany = editSpy.mock.calls[0][0];
      expect(savedCompany).toBeInstanceOf(Company);
      expect(savedCompany.props.id).toBe(existingCompanyId);
      expect(savedCompany.props.name).toBe(editData.name);
      expect(savedCompany.props.fantasyName).toBe(editData.fantasyName);
      expect(savedCompany.props.document).toBe(existingCompany.document);
      expect(savedCompany.props.ie).toBe(existingCompany.ie);
      expect(savedCompany.props.email01).toBe(existingCompany.email01);
      expect(savedCompany.props.phone01).toBe(existingCompany.phone01);
    });

    it('should handle partial updates with only some fields', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        name: 'Original',
        city: 'São Paulo',
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
      });
      const editData: EditCompanyInputDto = {
        city: 'Rio de Janeiro',
      };

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const savedCompany = editSpy.mock.calls[0][0];
      expect(savedCompany.props.name).toBe(existingCompany.name);
      expect(savedCompany.props.city).toBe(editData.city);
    });

    it('should handle empty edit data', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        id: existingCompanyId,
        name: 'Company Name',
        document: '23741590000109',
        email01: 'existing@example.com',
        phone01: '11999998888',
      });
      const editData: EditCompanyInputDto = {};

      jest.spyOn(companyDao, 'findById').mockResolvedValue(existingCompany);
      const editSpy = jest.spyOn(companyRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingCompanyId, editData);

      // Assert
      expect(editSpy).toHaveBeenCalledTimes(1);
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
        document: '34800075000179',
        ie: '987654321',
      };
      await createCompany.execute(anotherCompanyData);

      const editData: EditCompanyInputDto = { document: '34800075000179' };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(existingCompanyId, editData)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
    });

    it('should throw CompanyDuplicateIeError when ie already exists for another company in database', async() => {
      // Arrange
      const anotherCompanyData: CreateCompanyInputDto = {
        ...createCompanyData,
        document: '34800075000179',
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
      expect(updatedCompany?.name).toBe('Updated Company Name');
      expect(updatedCompany?.fantasyName).toBe(createCompanyData.fantasyName);
      expect(updatedCompany?.document).toBe(createCompanyData.document);
      expect(updatedCompany?.ie).toBe(createCompanyData.ie);
      expect(updatedCompany?.active).toBe(true);
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
      expect(updatedCompany?.name).toBe(editData.name);
      expect(updatedCompany?.fantasyName).toBe(editData.fantasyName);
      expect(updatedCompany?.phone01).toBe(editData.phone01);
      expect(updatedCompany?.email01).toBe(editData.email01);
      expect(updatedCompany?.city).toBe(editData.city);
      expect(updatedCompany?.state).toBe(editData.state);
      expect(updatedCompany?.document).toBe(createCompanyData.document);
      expect(updatedCompany?.ie).toBe(createCompanyData.ie);
      expect(updatedCompany?.active).toBe(true);
    });

    it('should successfully update document to new unique value', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '36990654000157',
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

    it('should preserve createdAt timestamp', async() => {
      // Arrange
      const originalCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });
      const originalCreatedAt = originalCompany!.createdAt;

      const editData: EditCompanyInputDto = { name: 'Updated Name' };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany?.createdAt).toEqual(originalCreatedAt);
    });

    it('should sanitize document when updating', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '41.455.539/0001-12',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany?.document).toBe('41455539000112');
    });

    it('should sanitize phones when updating', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        phone01: '(11) 1111-2222',
        phone02: '(11) 3333-4444',
        cellphone: '(11) 98888-7777',
      };

      // Act
      await sut.execute(existingCompanyId, editData);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany?.phone01).toBe('1111112222');
      expect(updatedCompany?.phone02).toBe('1133334444');
      expect(updatedCompany?.cellphone).toBe('11988887777');
    });

    it('should validate email format when updating', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        email01: 'invalid-email',
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow();
    });

    it('should validate document format when updating', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        document: '00000000000000',
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow();
    });

    it('should validate phone format when updating', async() => {
      // Arrange
      const editData: EditCompanyInputDto = {
        phone01: '123',
      };

      // Act & Assert
      await expect(sut.execute(existingCompanyId, editData)).rejects.toThrow();
    });

    it('should allow updating null optional fields to values', async() => {
      // Arrange
      const editToNull: EditCompanyInputDto = {
        phone02: null,
        cellphone: null,
        email02: null,
        complement: null,
        reference: null,
      };
      await sut.execute(existingCompanyId, editToNull);

      const editToValues: EditCompanyInputDto = {
        phone02: '1144445555',
        cellphone: '11988887777',
        email02: 'newemail@company.com',
        complement: 'New Complement',
        reference: 'New Reference',
      };

      // Act
      await sut.execute(existingCompanyId, editToValues);

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany?.phone02).toBe('1144445555');
      expect(updatedCompany?.cellphone).toBe('11988887777');
      expect(updatedCompany?.email02).toBe('newemail@company.com');
      expect(updatedCompany?.complement).toBe('New Complement');
      expect(updatedCompany?.reference).toBe('New Reference');
    });

    it('should successfully edit company multiple times', async() => {
      // Arrange & Act
      await sut.execute(existingCompanyId, { name: 'First Update' });
      await sut.execute(existingCompanyId, { fantasyName: 'Second Update' });
      await sut.execute(existingCompanyId, { city: 'Third Update City' });

      // Assert
      const updatedCompany = await prisma.company.findUnique({
        where: { id: existingCompanyId },
      });

      expect(updatedCompany?.name).toBe('First Update');
      expect(updatedCompany?.fantasyName).toBe('Second Update');
      expect(updatedCompany?.city).toBe('Third Update City');
    });
  });
});
