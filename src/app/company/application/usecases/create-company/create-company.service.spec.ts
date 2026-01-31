import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { CompanyDuplicateDocumentError } from 'src/app/company/domain/errors/duplicate-document.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDto } from '../../dtos/company.dto';
import { FindCompanyById } from '../find-company-by-id/find-company-by-id.service';
import { CreateCompany } from './create-company.service';
import { CreateCompanyInputDto } from './dtos/create-company.dto';

describe('CreateCompany', () => {
  let sut: CreateCompany;
  let prisma: PrismaService;
  let data: CreateCompanyInputDto;
  let findCompanyById: FindCompanyById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateCompany);
    prisma = module.get(PrismaService);
    findCompanyById = module.get(FindCompanyById);

    // Clean database for integration tests
    await prisma.truncate();

    data = {
      name: 'Tech Solutions Ltda',
      fantasyName: 'Tech Solutions',
      document: '01.341.367/0001-31',
      ie: '123456789',
      phone01: '(11) 99988-7766',
      phone02: '(11) 3344-5566',
      cellphone: '(11) 98877-6655',
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
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw CompanyDuplicateDocumentError when document already exists', async() => {
      // Arrange
      const existingCompany = createMock<CompanyDto>({
        document: data.document,
        email01: data.email01,
        phone01: data.phone01,
      });
      const findByDocumentSpy = jest.spyOn(sut['companyDao'], 'findByDocument').mockResolvedValue(existingCompany);
      const saveSpy = jest.spyOn(sut['companyRepository'], 'save').mockResolvedValue();
      const company = Company.create(data);

      // Act & Assert
      expect.assertions(3);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(CompanyDuplicateDocumentError);
        expect(findByDocumentSpy).toHaveBeenCalledWith(company.props.document);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should create company entity and call repository.save when no duplicates exist', async() => {
      // Arrange
      const findByDocumentSpy = jest.spyOn(sut['companyDao'], 'findByDocument').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['companyRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(data);

      // Assert
      expect(findByDocumentSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Company));
    });

    it('should create Company entity with all provided data', async() => {
      // Arrange
      const saveSpy = jest.spyOn(sut['companyRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(data);

      // Assert
      const savedCompany = saveSpy.mock.calls[0][0];
      expect(savedCompany).toBeInstanceOf(Company);
      expect(savedCompany.props).toEqual({
        ...data,
        id: expect.any(String),
        document: '01341367000131',
        phone01: '11999887766',
        phone02: '1133445566',
        cellphone: '11988776655',
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('integration tests', () => {
    it('should throw CompanyDuplicateDocumentError when document already exists in database', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(data)).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
    });

    it('should throw an error when trying to create company with duplicate document (using different formatting)', async() => {
      // Arrange
      const formattedData: CreateCompanyInputDto = {
        ...data,
        document: '01341367000131',
      };
      await sut.execute(formattedData);

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute({
        ...data,
        document: '01.341.367/0001-31',
      })).rejects.toBeInstanceOf(CompanyDuplicateDocumentError);
    });

    it('should persist company in database and return generated id', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');

      // Verify company was actually saved in database
      const savedCompany = await findCompanyById.execute(result.id);

      expect(savedCompany).toBeDefined();
      expect(savedCompany).toEqual<CompanyDto>({
        ...data,
        id: result.id,
        document: '01341367000131',
        phone01: '11999887766',
        phone02: '1133445566',
        cellphone: '11988776655',
        active: true,
        createdAt: savedCompany!.createdAt,
        updatedAt: savedCompany!.updatedAt,
      });
    });

    it('should create multiple companies with different documents and ies', async() => {
      // Arrange
      const secondCompanyData: CreateCompanyInputDto = {
        ...data,
        document: '62.771.563/0001-30',
      };

      // Act
      const firstResult = await sut.execute(data);
      const secondResult = await sut.execute(secondCompanyData);

      // Assert
      const firstCompany = await findCompanyById.execute(firstResult.id);
      const secondCompany = await findCompanyById.execute(secondResult.id);

      expect(firstCompany).toBeDefined();
      expect(secondCompany).toBeDefined();
      expect(firstResult.id).not.toBe(secondResult.id);
      expect(firstCompany?.document).toBe('01341367000131');
      expect(secondCompany?.document).toBe('62771563000130');
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

      const savedCompany = await findCompanyById.execute(result.id);

      expect(savedCompany).toBeDefined();
      expect(savedCompany).toEqual<CompanyDto>(expect.objectContaining({
        phone02: null,
        cellphone: null,
        email02: null,
        complement: null,
        reference: null,
      }));
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
      const savedCompany = await findCompanyById.execute(result.id);
      expect(savedCompany?.active).toBe(true);
    });

    it('should set createdAt and updatedAt timestamps', async() => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const result = await sut.execute(data);

      // Assert
      const afterCreate = new Date();
      const savedCompany = await findCompanyById.execute(result.id);

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
