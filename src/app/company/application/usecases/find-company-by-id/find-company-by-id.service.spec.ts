import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDto } from '../../dtos/company.dto';
import { CreateCompany } from '../create-company/create-company.service';
import { CreateCompanyInputDto } from '../create-company/dtos/create-company.dto';
import { FindCompanyById } from './find-company-by-id.service';

describe('FindCompanyById', () => {
  let sut: FindCompanyById;
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

    sut = module.get(FindCompanyById);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);

    // Clean database for integration tests
    await prisma.truncate();

    // Create a company for testing
    createCompanyData = {
      name: 'Test Company Ltd',
      fantasyName: 'Test Company',
      document: '67942043000167',
      ie: '123456789',
      phone01: '11999887766',
      phone02: '1133445566',
      cellphone: '11988776655',
      email01: 'test@company.com',
      email02: 'sales@company.com',
      zipCode: '01234567',
      street: 'Test Street',
      number: '123',
      complement: 'Suite 1',
      reference: 'Near the mall',
      neighborhood: 'Downtown',
      city: 'São Paulo',
      state: 'SP',
    };

    const createResult = await createCompany.execute(createCompanyData);
    existingCompanyId = createResult.id;
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw CompanyNotFoundError when company does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(CompanyNotFoundError);
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(nonExistentId);
    });

    it('should return company data when company exists', async() => {
      // Arrange
      const companyId = 'existing-company-id';
      const expectedCompany = createMock<CompanyDto>();

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(expectedCompany);

      // Act
      const result = await sut.execute(companyId);

      // Assert
      expect(sut['companyDao'].findById).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(expectedCompany);
    });

    it('should call companyDao.findById with correct id', async() => {
      // Arrange
      const companyId = 'test-company-id';
      const mockCompany = createMock<CompanyDto>({ id: companyId });
      const findByIdSpy = jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(mockCompany);

      // Act
      await sut.execute(companyId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(companyId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should return exactly what companyDao returns when company exists', async() => {
      // Arrange
      const companyId = 'test-id';
      const mockCompanyData = createMock<CompanyDto>();

      jest.spyOn(sut['companyDao'], 'findById').mockResolvedValue(mockCompanyData);

      // Act
      const result = await sut.execute(companyId);

      // Assert
      expect(result).toBe(mockCompanyData);
    });
  });

  describe('integration tests', () => {
    it('should throw CompanyNotFoundError when company does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id-123';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(CompanyNotFoundError);
    });

    it('should return complete company data when company exists in database', async() => {
      // Act
      const result = await sut.execute(existingCompanyId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<CompanyDto>({
        id: existingCompanyId,
        name: createCompanyData.name,
        fantasyName: createCompanyData.fantasyName,
        document: createCompanyData.document,
        ie: createCompanyData.ie,
        phone01: createCompanyData.phone01,
        phone02: createCompanyData.phone02,
        cellphone: createCompanyData.cellphone,
        email01: createCompanyData.email01,
        email02: createCompanyData.email02,
        zipCode: createCompanyData.zipCode,
        street: createCompanyData.street,
        number: createCompanyData.number,
        complement: createCompanyData.complement,
        reference: createCompanyData.reference,
        neighborhood: createCompanyData.neighborhood,
        city: createCompanyData.city,
        state: createCompanyData.state,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return different companies for different IDs', async() => {
      // Arrange
      const secondCompanyData: CreateCompanyInputDto = {
        ...createCompanyData,
        name: 'Second Company Ltd',
        fantasyName: 'Second Company',
        document: '01427316000127',
        ie: '987654321',
      };

      const secondCompanyResult = await createCompany.execute(secondCompanyData);
      const secondCompanyId = secondCompanyResult.id;

      // Act
      const firstCompany = await sut.execute(existingCompanyId);
      const secondCompany = await sut.execute(secondCompanyId);

      // Assert
      expect(firstCompany.id).toBe(existingCompanyId);
      expect(secondCompany.id).toBe(secondCompanyId);
      expect(firstCompany.id).not.toBe(secondCompany.id);
      expect(firstCompany.name).toBe(createCompanyData.name);
      expect(secondCompany.name).toBe(secondCompanyData.name);
      expect(firstCompany.document).toBe(createCompanyData.document);
      expect(secondCompany.document).toBe(secondCompanyData.document);
    });

    it('should handle company with null optional fields', async() => {
      // Arrange
      const companyWithNulls: CreateCompanyInputDto = {
        ...createCompanyData,
        name: 'Company With Nulls Ltd',
        document: '01427316000127',
        ie: '111111111',
        phone02: null,
        cellphone: null,
        email02: null,
        complement: null,
        reference: null,
      };

      const createResult = await createCompany.execute(companyWithNulls);
      const companyWithNullsId = createResult.id;

      // Act
      const result = await sut.execute(companyWithNullsId);

      // Assert
      expect(result).toEqual<CompanyDto>({
        ...companyWithNulls,
        id: companyWithNullsId,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return consistent data on multiple calls for same ID', async() => {
      // Act
      const firstCall = await sut.execute(existingCompanyId);
      const secondCall = await sut.execute(existingCompanyId);

      // Assert
      expect(firstCall).toEqual(secondCall);
      expect(firstCall.id).toBe(secondCall.id);
      expect(firstCall.name).toBe(secondCall.name);
      expect(firstCall.document).toBe(secondCall.document);
      expect(firstCall.createdAt).toEqual(secondCall.createdAt);
      expect(firstCall.updatedAt).toEqual(secondCall.updatedAt);
    });
  });
});
