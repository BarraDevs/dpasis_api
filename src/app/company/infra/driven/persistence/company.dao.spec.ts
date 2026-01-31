import { Test } from '@nestjs/testing';
import { CompanyPersistenceModule } from 'src/app/company/application/persistence/company-persistence.module';
import { CreateCompanyInputDto } from 'src/app/company/application/usecases/create-company/dtos/create-company.dto';
import { FindAllCompanyQueryDto } from 'src/app/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDaoAdapterPrisma } from './company.dao';

describe('CompanyDaoAdapterPrisma', () => {
  let sut: CompanyDaoAdapterPrisma;
  let prisma: PrismaService;
  let testCompanyIds: string[] = [];

  const createTestCompanies = async(): Promise<void> => {
    const companies: CreateCompanyInputDto[] = [
      {
        name: 'Alpha Technologies Ltda',
        fantasyName: 'Alpha Tech',
        document: '11111111000111',
        ie: '111111111',
        phone01: '11999111111',
        phone02: '1133111111',
        cellphone: '11988111111',
        email01: 'contact@alphatech.com',
        email02: 'sales@alphatech.com',
        zipCode: '01111111',
        street: 'Rua Alpha',
        number: '111',
        complement: 'Sala Alpha',
        reference: 'Próximo ao Alpha Mall',
        neighborhood: 'Alpha District',
        city: 'São Paulo',
        state: 'SP',
      },
      {
        name: 'Beta Innovations Ltda',
        fantasyName: 'Beta Corp',
        document: '22222222000222',
        ie: '222222222',
        phone01: '11999222222',
        phone02: null,
        cellphone: '11988222222',
        email01: 'info@betacorp.com',
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
        name: 'Gamma Solutions Ltda',
        fantasyName: 'Gamma Solutions',
        document: '33333333000333',
        ie: '333333333',
        phone01: '11999333333',
        phone02: '1133333333',
        cellphone: null,
        email01: 'solutions@gamma.com',
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
        document: '44444444000444',
        ie: '444444444',
        phone01: '21999444444',
        phone02: '2133444444',
        cellphone: '21988444444',
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
        document: '55555555000555',
        ie: '555555555',
        phone01: '41999555555',
        phone02: null,
        cellphone: '41988555555',
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
      {
        name: 'Zeta Industries Ltda',
        fantasyName: 'Zeta Industries',
        document: '66666666000666',
        ie: '666666666',
        phone01: '11999666666',
        phone02: '1133666666',
        cellphone: '11988666666',
        email01: 'industries@zeta.com',
        email02: 'commercial@zeta.com',
        zipCode: '06666666',
        street: 'Rua Zeta',
        number: '666',
        complement: 'Torre Z',
        reference: 'Ao lado do shopping',
        neighborhood: 'Zeta District',
        city: 'São Paulo',
        state: 'SP',
      },
    ];

    testCompanyIds = [];
    for (const [index, company] of companies.entries()) {
      const active = index % 2 === 0; // Set active true for even index companies
      const id = await prisma.company.create({ data: { ...company, active } }).then(c => c.id);
      testCompanyIds.push(id);
    }
  };

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        CompanyPersistenceModule,
        ConfigModule,
      ],
      providers: [
        CompanyDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(CompanyDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();
    await createTestCompanies();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    describe('pagination tests', () => {
      it('should return all companies when no pagination is specified', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = {};

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(6);
        expect(total).toBe(6);
      });

      it('should handle first page pagination', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { page: 1, size: 2 };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(2);
        expect(total).toBe(6);
      });

      it('should handle middle page pagination', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { page: 2, size: 2 };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(2);
        expect(total).toBe(6);
      });

      it('should handle last page pagination with partial results', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { page: 3, size: 2 };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(2);
        expect(total).toBe(6);
      });

      it('should return empty page when page exceeds total pages', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { page: 10, size: 2 };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(0);
        expect(total).toBe(6);
      });

      it('should handle large page size', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { page: 1, size: 100 };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(6);
        expect(total).toBe(6);
      });

      it('should maintain order by createdAt desc', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { page: 1, size: 3 };

        // Act
        const [companies] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(3);
        // Companies should be ordered by createdAt desc (newest first)
        for (let i = 0; i < companies.length - 1; i++) {
          expect(companies[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            companies[i + 1].createdAt.getTime()
          );
        }
      });
    });

    describe('name filter tests', () => {
      it('should filter by name (case insensitive)', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { name: 'alpha' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].name.toLowerCase()).toContain('alpha');
      });

      it('should filter by partial name match', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { name: 'Tech' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].name).toContain('Technologies');
      });

      it('should return empty when name does not match', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { name: 'NonExistent' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(0);
        expect(total).toBe(0);
      });
    });

    describe('fantasyName filter tests', () => {
      it('should filter by fantasyName', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { fantasyName: 'Beta' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].fantasyName).toContain('Beta');
      });

      it('should filter by partial fantasyName match (case insensitive)', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { fantasyName: 'solutions' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].fantasyName.toLowerCase()).toContain('solutions');
      });
    });

    describe('document filter tests', () => {
      it('should filter by document', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { document: '44444444000444' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].document).toBe('44444444000444');
      });

      it('should filter by partial document match', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { document: '5555' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].document).toBe('55555555000555');
      });
    });

    describe('ie filter tests', () => {
      it('should filter by ie', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { ie: '666666666' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].ie).toBe('666666666');
      });

      it('should filter by partial ie match', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { ie: '6666' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].ie).toBe('666666666');
      });
    });

    describe('phone filter tests', () => {
      it('should filter by phone01', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { phone: '21999444444' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].phone01).toBe('21999444444');
      });

      it('should filter by phone02', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { phone: '1133333333' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].phone02).toBe('1133333333');
      });

      it('should filter by cellphone', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { phone: '41988555555' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].cellphone).toBe('41988555555');
      });

      it('should find multiple matches for partial phone number', async() => {
      // Arrange - Looking for companies with phone starting with '11999'
        const queries: FindAllCompanyQueryDto = { phone: '11999' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies.length).toBeGreaterThan(1);
        expect(total).toBeGreaterThan(1);
        companies.forEach(company => {
          const hasMatchingPhone =
          company.phone01?.includes('11999') ||
          company.phone02?.includes('11999') ||
          company.cellphone?.includes('11999');
          expect(hasMatchingPhone).toBe(true);
        });
      });
    });

    describe('email filter tests', () => {
      it('should filter by email01', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { email: 'solutions@gamma.com' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].email01).toBe('solutions@gamma.com');
      });

      it('should filter by email02', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { email: 'business@gamma.com' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].email02).toBe('business@gamma.com');
      });

      it('should filter by partial email match', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { email: '@delta.com' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].email01).toContain('@delta.com');
      });

      it('should find multiple matches for common email domain', async() => {
      // Arrange - Looking for companies with email domain 'com'
        const queries: FindAllCompanyQueryDto = { email: '.com' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies.length).toBeGreaterThan(1);
        expect(total).toBeGreaterThan(1);
        companies.forEach(company => {
          const hasMatchingEmail =
          company.email01?.includes('.com') ||
          company.email02?.includes('.com');
          expect(hasMatchingEmail).toBe(true);
        });
      });
    });

    describe('address filter tests', () => {
      it('should filter by street', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { address: 'Rua Alpha' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].street).toBe('Rua Alpha');
      });

      it('should filter by city', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { address: 'São Paulo' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies.length).toBe(3); // Alpha, Delta, and Zeta are in São Paulo
        expect(total).toBe(3);
        companies.forEach(company => {
          expect(company.city).toBe('São Paulo');
        });
      });

      it('should filter by state', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { address: 'SP' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies.length).toBe(3); // Alpha, Delta, and Zeta are in SP
        expect(total).toBe(3);
        companies.forEach(company => {
          expect(company.state).toBe('SP');
        });
      });

      it('should filter by neighborhood', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { address: 'Beta Center' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].neighborhood).toBe('Beta Center');
      });

      it('should filter by zipCode', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { address: '05555555' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].zipCode).toBe('05555555');
      });

      it('should filter by number', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { address: '666' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].number).toBe('666');
      });
    });

    describe('active status filter tests', () => {
      it('should filter by active status true', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { active: true };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies.length).toBe(3); // 3 companies are active
        expect(total).toBe(3);
        companies.forEach(company => {
          expect(company.active).toBe(true);
        });
      });

      it('should filter by active status false', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { active: false };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies.length).toBe(3); // 3 companies are inactive
        expect(total).toBe(3);
        companies.forEach(company => {
          expect(company.active).toBe(false);
        });
      });
    });

    describe('combined filters tests', () => {
      it('should combine name and address filters', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = {
          name: 'Alpha',
          address: 'SP',
        };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].name).toContain('Alpha');
        expect(companies[0].state).toBe('SP');
      });

      it('should combine multiple filters with pagination', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = {
          address: 'SP',
          page: 1,
          size: 2,
        };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(2);
        expect(total).toBe(3); // Total SP companies
        companies.forEach(company => {
          expect(company.state).toBe('SP');
        });
      });

      it('should return empty result when combined filters do not match', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = {
          name: 'Alpha',
          address: 'RJ', // Alpha is in SP, not RJ
        };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(0);
        expect(total).toBe(0);
      });

      it('should combine all filter types', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = {
          fantasyName: 'Beta',
          email: '@betacorp.com',
          address: 'RJ',
        };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].fantasyName).toContain('Beta');
        expect(companies[0].email01).toContain('@betacorp.com');
        expect(companies[0].state).toBe('RJ');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string filters', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = {
          name: '',
          fantasyName: '',
          document: '',
        };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(6);
        expect(total).toBe(6);
      });

      it('should handle case sensitivity correctly', async() => {
      // Arrange
        const queries: FindAllCompanyQueryDto = { name: 'ALPHA' };

        // Act
        const [companies, total] = await sut.findAll(queries);

        // Assert
        expect(companies).toHaveLength(1);
        expect(total).toBe(1);
        expect(companies[0].name.toLowerCase()).toContain('alpha');
      });

      it('should maintain data integrity across paginated filtered results', async() => {
      // Arrange & Act
        const page1 = await sut.findAll({ address: 'SP', page: 1, size: 2 });
        const page2 = await sut.findAll({ address: 'SP', page: 2, size: 2 });

        // Assert
        const allIds = [...page1[0].map(c => c.id), ...page2[0].map(c => c.id)];
        expect(new Set(allIds).size).toBe(allIds.length); // No duplicates
        expect(page1[1]).toBe(page2[1]); // Same total count
      });
    });
  });

  describe('findById', () => {
    it('should find company by id', async() => {
      // Act
      const result = await sut.findById(testCompanyIds[0]);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('Alpha Technologies Ltda');
      expect(result?.document).toBe('11111111000111');
    });

    it('should return null for non-existent id', async() => {
      // Act
      const result = await sut.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByDocument', () => {
    it('should find company by document', async() => {
      // Act
      const result = await sut.findByDocument('22222222000222');

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('Beta Innovations Ltda');
      expect(result?.document).toBe('22222222000222');
    });

    it('should return null for non-existent document', async() => {
      // Act
      const result = await sut.findByDocument('99999999000999');

      // Assert
      expect(result).toBeNull();
    });
  });
});
