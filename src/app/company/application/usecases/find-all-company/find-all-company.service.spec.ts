import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CompanyDto } from '../../dtos/company.dto';
import type { ICompanyDao } from '../../persistence/dao/company-dao.interface';
import { CreateCompany } from '../create-company/create-company.service';
import { CreateCompanyInputDto } from '../create-company/dtos/create-company.dto';
import { FindAllCompanyQueryDto } from './dtos/find-all-company.dto';
import { FindAllCompany } from './find-all-company.service';

describe('FindAllCompany', () => {
  let sut: FindAllCompany;
  let companyDao: jest.Mocked<ICompanyDao>;
  let prisma: PrismaService;
  let createCompany: CreateCompany;
  let testCompanies: string[] = [];

  const createTestCompanies = async() => {
    const companies: CreateCompanyInputDto[] = [
      {
        name: 'Alpha Tech Solutions Ltda',
        fantasyName: 'Alpha Tech',
        document: '76.150.767/0001-69',
        ie: '111111111',
        phone01: '11999111111',
        phone02: '1133111111',
        cellphone: '11988111111',
        email01: 'contact@alphatech.com',
        email02: 'sales@alphatech.com',
        zipCode: '01111111',
        street: 'Rua Alpha',
        number: '111',
        complement: 'Sala 1',
        reference: 'Próximo ao Alpha Mall',
        neighborhood: 'Alpha District',
        city: 'São Paulo',
        state: 'SP',
      },
      {
        name: 'Beta Innovations Ltda',
        fantasyName: 'Beta Innovations',
        document: '56.369.794/0001-10',
        ie: '222222222',
        phone01: '11999222222',
        phone02: null,
        cellphone: null,
        email01: 'info@betainnovations.com',
        email02: null,
        zipCode: '02222222',
        street: 'Avenida Beta',
        number: '222',
        complement: null,
        reference: null,
        neighborhood: 'Beta Center',
        city: 'Rio de Janeiro',
        state: 'RJ',
      },
      {
        name: 'Gamma Enterprises Ltda',
        fantasyName: 'Gamma Corp',
        document: '90.233.549/0001-19',
        ie: '333333333',
        phone01: '11999333333',
        phone02: '1133333333',
        cellphone: '11988333333',
        email01: 'contact@gamma.com',
        email02: 'business@gamma.com',
        zipCode: '03333333',
        street: 'Rua Gamma',
        number: '333',
        complement: 'Andar 3',
        reference: 'Próximo à estação',
        neighborhood: 'Gamma Zone',
        city: 'Belo Horizonte',
        state: 'MG',
      },
      {
        name: 'Delta Services Ltda',
        fantasyName: 'Delta Services',
        document: '44.183.167/0001-00',
        ie: '444444444',
        phone01: '11999444444',
        phone02: '1133444444',
        cellphone: '11988444444',
        email01: 'services@delta.com',
        email02: 'support@delta.com',
        zipCode: '04444444',
        street: 'Alameda Delta',
        number: '444',
        complement: 'Bloco D',
        reference: 'Em frente ao parque',
        neighborhood: 'Delta Park',
        city: 'São Paulo',
        state: 'SP',
      },
      {
        name: 'Epsilon Consulting Ltda',
        fantasyName: 'Epsilon',
        document: '49.420.200/0001-92',
        ie: '555555555',
        phone01: '11999555555',
        phone02: null,
        cellphone: '11988555555',
        email01: 'consulting@epsilon.com',
        email02: null,
        zipCode: '05555555',
        street: 'Travessa Epsilon',
        number: '555',
        complement: null,
        reference: 'Próximo ao hospital',
        neighborhood: 'Epsilon Hills',
        city: 'Curitiba',
        state: 'PR',
      },
    ];

    testCompanies = [];
    for (const company of companies) {
      const result = await createCompany.execute(company);
      testCompanies.push(result.id);
    }
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CompanyModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllCompany);
    companyDao = module.get(TOKENS.CompanyDao);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);

    // Clean database
    await prisma.company.deleteMany();

    // Create test companies for integration tests
    await createTestCompanies();
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call companyDao.findAll with correct queries and return paginated result', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 1,
        size: 10,
        name: 'Test Company',
      };

      const mockCompanies = createMock<CompanyDto>();
      const findAllSpy = jest.spyOn(companyDao, 'findAll').mockResolvedValue([[mockCompanies], 1]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual<IPagination<CompanyDto>>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 1,
        totalPages: 1,
        data: [mockCompanies],
      });
    });

    it('should handle empty result set', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 1,
        size: 10,
        name: 'Non-existent Company',
      };

      jest.spyOn(companyDao, 'findAll').mockResolvedValue([[], 0]);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should correctly calculate pagination for multiple pages', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 2,
        size: 3,
      };

      const mockCompanies: CompanyDto[] = Array.from({ length: 3 }, (_, i) => ({
        id: `${i + 4}`,
        name: `Company ${i + 4}`,
        fantasyName: `Fantasy ${i + 4}`,
        document: `${(i + 4).toString().repeat(8)}000${(i + 4).toString().repeat(3)}`,
        ie: (i + 4).toString().repeat(9),
        phone01: `1199900000${i + 4}`,
        phone02: null,
        cellphone: null,
        email01: `company${i + 4}@test.com`,
        email02: null,
        zipCode: `0${i + 4}${(i + 4).toString().repeat(6)}`,
        street: `Street ${i + 4}`,
        number: `${i + 4}00`,
        complement: null,
        reference: null,
        neighborhood: `District ${i + 4}`,
        city: 'São Paulo',
        state: 'SP',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.spyOn(companyDao, 'findAll').mockResolvedValue([mockCompanies, 10]); // Total 10 items

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(3);
      expect(result.totalItems).toBe(10);
      expect(result.totalPages).toBe(4); // Math.ceil(10/3) = 4
      expect(result.data).toHaveLength(3);
    });
  });

  describe('integration tests - pagination', () => {
    it('should return all companies when no pagination is specified', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {};

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(5); // Default to total when no size specified
      expect(result.totalPages).toBe(1);
    });

    it('should handle first page pagination correctly', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 1,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3); // Math.ceil(5/2) = 3
    });

    it('should handle middle page pagination correctly', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 2,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should handle last page pagination correctly', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 3,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1); // Last page has only 1 item
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(3);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty page when page number exceeds available pages', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 10,
        size: 2,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(10);
      expect(result.itemsPerPage).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('integration tests - filters', () => {
    it('should filter by name (partial match)', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        name: 'Alpha',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alpha Tech Solutions Ltda');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by fantasyName (partial match)', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        fantasyName: 'Beta',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toBe('Beta Innovations');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by document', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        document: '49420200000192',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].document).toBe('49420200000192');
      expect(result.data[0].name).toContain('Epsilon Consulting Ltda');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by ie', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        ie: '444444444',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ie).toBe('444444444');
      expect(result.data[0].name).toContain('Delta');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by address (street + number + neighborhood + city)', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        address: 'Rua Alpha',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].street).toContain('Alpha');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by phone (phone01, phone02, cellphone)', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        phone: '11999333333',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].phone01).toBe('11999333333');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by email (email01, email02)', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        email: 'services@delta.com',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email01).toBe('services@delta.com');
      expect(result.totalItems).toBe(1);
    });

    it('should filter by state in address', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        address: 'SP',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(2); // Alpha and Delta are in SP
      result.data.forEach(company => {
        expect(company.state).toBe('SP');
      });
    });

    it('should filter by active status', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        active: false,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0); // No companies are inactive
    });

    it('should combine multiple filters', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        name: 'Tech',
        address: 'SP',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Tech');
      expect(result.data[0].state).toBe('SP');
      expect(result.totalItems).toBe(1);
    });

    it('should combine filters with pagination', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        address: 'SP', // Should match Alpha and Delta
        page: 1,
        size: 1,
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(2); // Total matches for SP
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.data[0].state).toBe('SP');
    });

    it('should return empty result when no matches found', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        name: 'NonExistentCompany',
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should be case insensitive in filters', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        name: 'alpha', // lowercase
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name.toLowerCase()).toContain('alpha');
      expect(result.totalItems).toBe(1);
    });

    it('should handle partial matches in filters', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        fantasyName: 'Innov', // Partial match for "Beta Innovations"
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toContain('Innovations');
      expect(result.totalItems).toBe(1);
    });
  });

  describe('integration tests - complex scenarios', () => {
    it('should maintain data integrity across paginated results', async() => {
      // Arrange & Act
      const page1 = await sut.execute({ page: 1, size: 2 });
      const page2 = await sut.execute({ page: 2, size: 2 });
      const page3 = await sut.execute({ page: 3, size: 2 });

      // Assert
      const allIds = [
        ...page1.data.map(c => c.id),
        ...page2.data.map(c => c.id),
        ...page3.data.map(c => c.id),
      ];

      // No duplicate IDs across pages
      expect(new Set(allIds).size).toBe(allIds.length);

      // Total items consistent across calls
      expect(page1.totalItems).toBe(5);
      expect(page2.totalItems).toBe(5);
      expect(page3.totalItems).toBe(5);
    });

    it('should handle edge case with size larger than total items', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        page: 1,
        size: 100, // Much larger than 5 available items
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.totalItems).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(100);
      expect(result.totalPages).toBe(1);
    });

    it('should handle multiple filter criteria with no matches', async() => {
      // Arrange
      const queries: FindAllCompanyQueryDto = {
        name: 'Alpha',
        address: 'RJ', // Alpha is in SP, not RJ
      };

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
