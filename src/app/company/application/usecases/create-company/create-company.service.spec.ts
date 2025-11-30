import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { CompanyDuplicateIeError } from 'src/app/company/domain/errors/duplicate-ie.error';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDto } from '../../dtos/company.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import type { ICompanyRepository } from '../../persistence/repository/company-repository.interface';
import { CreateCompany } from './create-company.service';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from './dtos/create-company.dto';

describe('CreateCompany', () => {
  let sut: CreateCompany;
  let companyDao: jest.Mocked<ICompanyDao>;
  let companyRepository: jest.Mocked<ICompanyRepository>;
  let prisma: PrismaService;
  let data: CreateCompanyInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateCompany);
    companyDao = module.get(TOKENS.CompanyDao);
    companyRepository = module.get(TOKENS.CompanyRepository);
    prisma = module.get(PrismaService);

    // Clean database for integration tests
    await prisma.company.deleteMany();

    data = {
      name: 'Tech Solutions Ltda',
      fantasyName: 'Tech Solutions',
      document: '26392272000178',
      ie: '123456789',
      phone01: '11999887766',
      phone02: '1133445566',
      cellphone: '11988776655',
      email01: 'contato@techsolutions.com',
      email02: 'vendas@techsolutions.com',
      zipCode: '01234567',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Sala 45',
      reference: 'Próximo ao shopping',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw CompanyDuplicateDocumentError when document already exists', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>();
      jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(existingCompany);
      jest.spyOn(companyDao, 'findByIe').mockResolvedValue(null);
      const saveSpy = jest.spyOn(companyRepository, 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(data)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
      expect(companyDao.findByDocument).toHaveBeenCalledWith(data.document);
      expect(companyDao.findByIe).toHaveBeenCalledWith(data.ie);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should throw CompanyDuplicateIeError when ie already exists', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>();
      jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(null);
      jest.spyOn(companyDao, 'findByIe').mockResolvedValue(existingCompany);
      const saveSpy = jest.spyOn(companyRepository, 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(data)).rejects.toBeInstanceOf(CompanyDuplicateIeError);
      expect(companyDao.findByDocument).toHaveBeenCalledWith(data.document);
      expect(companyDao.findByIe).toHaveBeenCalledWith(data.ie);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should create company entity and call repository.save when no duplicates exist', async() => {
      // Arrange
      jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(null);
      jest.spyOn(companyDao, 'findByIe').mockResolvedValue(null);
      const saveSpy = jest.spyOn(companyRepository, 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(companyDao.findByDocument).toHaveBeenCalledWith(data.document);
      expect(companyDao.findByIe).toHaveBeenCalledWith(data.ie);
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          name: data.name,
          fantasyName: data.fantasyName,
          document: data.document,
          ie: data.ie,
          active: true,
        }),
      }));
      expect(result).toEqual<CreateCompanyOutputDto>({
        id: expect.any(String),
      });
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should create Company entity with all provided data', async() => {
      // Arrange
      jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(null);
      jest.spyOn(companyDao, 'findByIe').mockResolvedValue(null);
      const saveSpy = jest.spyOn(companyRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(data);

      // Assert
      const savedCompany = saveSpy.mock.calls[0][0];
      expect(savedCompany).toBeInstanceOf(Company);
      expect(savedCompany.props.name).toBe(data.name);
      expect(savedCompany.props.fantasyName).toBe(data.fantasyName);
      expect(savedCompany.props.document).toBe(data.document);
      expect(savedCompany.props.ie).toBe(data.ie);
      expect(savedCompany.props.zipCode).toBe(data.zipCode);
      expect(savedCompany.props.street).toBe(data.street);
      expect(savedCompany.props.number).toBe(data.number);
      expect(savedCompany.props.complement).toBe(data.complement);
      expect(savedCompany.props.reference).toBe(data.reference);
      expect(savedCompany.props.neighborhood).toBe(data.neighborhood);
      expect(savedCompany.props.city).toBe(data.city);
      expect(savedCompany.props.state).toBe(data.state);
      expect(savedCompany.props.phone01).toBe(data.phone01);
      expect(savedCompany.props.phone02).toBe(data.phone02);
      expect(savedCompany.props.cellphone).toBe(data.cellphone);
      expect(savedCompany.props.email01).toBe(data.email01);
      expect(savedCompany.props.email02).toBe(data.email02);
      expect(savedCompany.props.active).toBe(true);
      expect(savedCompany.props.createdAt).toBeInstanceOf(Date);
      expect(savedCompany.props.updatedAt).toBeInstanceOf(Date);
    });

    it('should check both document and ie in parallel', async() => {
      // Arrange
      const findByDocumentSpy = jest.spyOn(companyDao, 'findByDocument').mockResolvedValue(null);
      const findByIeSpy = jest.spyOn(companyDao, 'findByIe').mockResolvedValue(null);
      jest.spyOn(companyRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(data);

      // Assert
      expect(findByDocumentSpy).toHaveBeenCalledWith(data.document);
      expect(findByIeSpy).toHaveBeenCalledWith(data.ie);
    });
  });

  describe('integration tests', () => {
    it('should throw CompanyDuplicateDocumentError when document already exists in database', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute({ ...data, ie: 'different-ie' })).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
    });

    it('should throw CompanyDuplicateIeError when ie already exists in database', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute({ ...data, document: '98765432000187' })).rejects.toBeInstanceOf(CompanyDuplicateIeError);
    });

    it('should persist company in database and return generated id', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');

      // Verify company was actually saved in database
      const savedCompany = await prisma.company.findUnique({
        where: { id: result.id },
      });

      expect(savedCompany).toBeDefined();
      expect(savedCompany).toEqual<CompanyDto>({
        id: result.id,
        name: data.name,
        fantasyName: data.fantasyName,
        document: data.document,
        ie: data.ie,
        active: true,
        phone01: data.phone01,
        phone02: data.phone02,
        cellphone: data.cellphone,
        email01: data.email01,
        email02: data.email02,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        reference: data.reference,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        createdAt: savedCompany!.createdAt,
        updatedAt: savedCompany!.updatedAt,
      });
    });

    it('should create multiple companies with different documents and ies', async() => {
      // Arrange
      const secondCompanyData: CreateCompanyInputDto = {
        ...data,
        name: 'Another Company',
        document: '62771563000130',
        ie: '987654321',
      };

      // Act
      const firstResult = await sut.execute(data);
      const secondResult = await sut.execute(secondCompanyData);

      // Assert
      expect(firstResult.id).not.toBe(secondResult.id);

      const firstCompany = await prisma.company.findUnique({
        where: { id: firstResult.id },
      });
      const secondCompany = await prisma.company.findUnique({
        where: { id: secondResult.id },
      });

      expect(firstCompany).toBeDefined();
      expect(secondCompany).toBeDefined();
      expect(firstCompany?.document).toBe(data.document);
      expect(secondCompany?.document).toBe(secondCompanyData.document);
    });

    it('should handle optional fields correctly', async() => {
      // Arrange
      const dataWithNulls: CreateCompanyInputDto = {
        ...data,
        phone02: null,
        cellphone: null,
        email02: null,
        complement: null,
        reference: null,
      };

      // Act
      const result = await sut.execute(dataWithNulls);

      // Assert
      expect(result).toBeDefined();

      const savedCompany = await prisma.company.findUnique({
        where: { id: result.id },
      });

      expect(savedCompany).toBeDefined();
      expect(savedCompany).toEqual<CompanyDto>({
        ...data,
        phone02: null,
        cellphone: null,
        email02: null,
        complement: null,
        reference: null,
        active: true,
        id: result.id,
        createdAt: savedCompany!.createdAt,
        updatedAt: savedCompany!.updatedAt,
      });
    });

    it('should generate valid UUID for company id', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should set company as active by default', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      const savedCompany = await prisma.company.findUnique({
        where: { id: result.id },
      });

      expect(savedCompany?.active).toBe(true);
    });

    it('should set createdAt and updatedAt timestamps', async() => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const result = await sut.execute(data);

      // Assert
      const afterCreate = new Date();
      const savedCompany = await prisma.company.findUnique({
        where: { id: result.id },
      });

      expect(savedCompany?.createdAt).toBeInstanceOf(Date);
      expect(savedCompany?.updatedAt).toBeInstanceOf(Date);
      expect(savedCompany?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(savedCompany?.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(savedCompany?.updatedAt).toEqual(savedCompany?.createdAt);
    });

    it('should sanitize document removing special characters', async() => {
      // Arrange
      const dataWithFormattedDoc: CreateCompanyInputDto = {
        ...data,
        document: '12.345.678/0001-95',
      };

      // Act
      const result = await sut.execute(dataWithFormattedDoc);

      // Assert
      const savedCompany = await prisma.company.findUnique({
        where: { id: result.id },
      });

      expect(savedCompany?.document).toBe('12345678000195');
    });

    it('should sanitize phones removing special characters', async() => {
      // Arrange
      const dataWithFormattedPhones: CreateCompanyInputDto = {
        ...data,
        phone01: '(11) 1111-2222',
        phone02: '(11) 3333-4444',
        cellphone: '(11) 98888-7777',
      };

      // Act
      const result = await sut.execute(dataWithFormattedPhones);

      // Assert
      const savedCompany = await prisma.company.findUnique({
        where: { id: result.id },
      });

      expect(savedCompany?.phone01).toBe('1111112222');
      expect(savedCompany?.phone02).toBe('1133334444');
      expect(savedCompany?.cellphone).toBe('11988887777');
    });

    it('should validate email format', async() => {
      // Arrange
      const dataWithInvalidEmail: CreateCompanyInputDto = {
        ...data,
        email01: 'invalid-email',
      };

      // Act & Assert
      await expect(sut.execute(dataWithInvalidEmail)).rejects.toThrow();
    });

    it('should validate document format', async() => {
      // Arrange
      const dataWithInvalidDoc: CreateCompanyInputDto = {
        ...data,
        document: '00000000000000',
      };

      // Act & Assert
      await expect(sut.execute(dataWithInvalidDoc)).rejects.toThrow();
    });

    it('should validate phone format', async() => {
      // Arrange
      const dataWithInvalidPhone: CreateCompanyInputDto = {
        ...data,
        phone01: '123',
      };

      // Act & Assert
      await expect(sut.execute(dataWithInvalidPhone)).rejects.toThrow();
    });
  });
});
