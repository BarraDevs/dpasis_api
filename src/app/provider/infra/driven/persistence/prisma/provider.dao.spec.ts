import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { ProviderPersistenceModule } from 'src/app/provider/application/persistence/provider-persistence.module';
import { FindAllProviderQueryDto } from 'src/app/provider/application/usecases/find-all-provider/dtos/find-all-provider.dto';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderDaoAdapterPrisma } from './provider.dao';

describe('ProviderDaoAdapterPrisma', () => {
  let sut: ProviderDaoAdapterPrisma;
  let prisma: PrismaService;
  let company01: Company;
  let company02: Company;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProviderPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ProviderDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ProviderDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.provider.deleteMany();
    await prisma.company.deleteMany();

    company01 = await prisma.company.create({
      data: {
        name: 'Company 01',
        fantasyName: 'Company 01 Fantasy',
        document: '11222333000181',
        ie: 'ie teste',
        zipCode: 'zipCode teste',
        street: 'street teste',
        number: 'number teste',
        neighborhood: 'neighborhood teste',
        city: 'city teste',
        state: 'state teste',
        phone01: 'phone01 teste',
        email01: 'email01 teste',
        active: true,
      },
    });

    company02 = await prisma.company.create({
      data: {
        name: 'Company 02',
        fantasyName: 'Company 02 Fantasy',
        document: '22333444000105',
        ie: 'ie teste 02',
        zipCode: 'zipCode teste 02',
        street: 'street teste 02',
        number: 'number teste 02',
        neighborhood: 'neighborhood teste 02',
        city: 'city teste 02',
        state: 'state teste 02',
        phone01: 'phone01 teste 02',
        email01: 'email01 teste 02',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.provider.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      await prisma.provider.create({
        data: {
          id: 'provider-1',
          name: 'Provider Alpha',
          type: ProviderType.RECURRING,
          valueInCents: 10000,
          cnpj: '33444555000172',
          ie: '111222333',
          paymentDay: 15,
          paymentExpirationDate: null,
          companyName: 'Alpha Company',
          zipCode: '12345678',
          street: 'Alpha Street',
          number: '100',
          complement: null,
          reference: null,
          neighborhood: 'Alpha Neighborhood',
          city: 'São Paulo',
          state: 'SP',
          email: 'alpha@email.com',
          website: 'https://alpha.com',
          active: true,
          companies: { connect: { id: company01.id } },
        },
      });

      await prisma.provider.create({
        data: {
          id: 'provider-2',
          name: 'Provider Beta',
          type: ProviderType.ONE_TIME,
          valueInCents: 20000,
          cnpj: '44555666000163',
          ie: '222333444',
          paymentDay: null,
          paymentExpirationDate: new Date('2025-12-31'),
          companyName: 'Beta Company',
          zipCode: '87654321',
          street: 'Beta Street',
          number: '200',
          complement: 'Suite 100',
          reference: 'Near the park',
          neighborhood: 'Beta Neighborhood',
          city: 'Rio de Janeiro',
          state: 'RJ',
          email: 'beta@email.com',
          website: null,
          active: true,
          companies: { connect: { id: company02.id } },
        },
      });

      await prisma.provider.create({
        data: {
          id: 'provider-3',
          name: 'Provider Gamma',
          type: ProviderType.RECURRING,
          valueInCents: 30000,
          cnpj: '55666777000154',
          ie: '333444555',
          paymentDay: 20,
          paymentExpirationDate: null,
          companyName: 'Gamma Company',
          zipCode: '11223344',
          street: 'Gamma Street',
          number: '300',
          complement: null,
          reference: null,
          neighborhood: 'Gamma Neighborhood',
          city: 'Belo Horizonte',
          state: 'MG',
          email: 'gamma@email.com',
          website: 'https://gamma.com',
          active: false,
          companies: { connect: [{ id: company01.id }, { id: company02.id }] },
        },
      });
    });

    it('should return all providers when no filters are provided', async() => {
      // Arrange
      const query: FindAllProviderQueryDto = {};

      // Act
      const [providers, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(3);
      expect(providers).toHaveLength(3);
    });

    it('should order results by createdAt desc', async() => {
      // Arrange
      const query: FindAllProviderQueryDto = {};

      // Act
      const [providers] = await sut.findAll(query);

      // Assert
      expect(providers[0].id).toBe('provider-3');
      expect(providers[1].id).toBe('provider-2');
      expect(providers[2].id).toBe('provider-1');
    });

    describe('filter by name', () => {
      it('should filter by name - exact match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { name: 'Provider Alpha' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].name).toBe('Provider Alpha');
      });

      it('should filter by name - partial match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { name: 'Provider' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });

      it('should filter by name - case insensitive', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { name: 'ALPHA' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].name).toBe('Provider Alpha');
      });

      it('should return empty when name does not match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { name: 'NonExistent' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(providers).toHaveLength(0);
      });
    });

    describe('filter by type', () => {
      it('should filter by type - RECURRING', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { type: ProviderType.RECURRING };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(providers).toHaveLength(2);
        providers.forEach(provider => {
          expect(provider.type).toBe(ProviderType.RECURRING);
        });
      });

      it('should filter by type - ONE_TIME', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { type: ProviderType.ONE_TIME };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].type).toBe(ProviderType.ONE_TIME);
        expect(providers[0].id).toBe('provider-2');
      });
    });

    describe('filter by cnpj', () => {
      it('should filter by cnpj - exact match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { cnpj: '33444555000172' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].cnpj).toBe('33444555000172');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by cnpj - partial match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { cnpj: '33444' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-1');
      });

      it('should return empty when cnpj does not match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { cnpj: '99999999999999' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(providers).toHaveLength(0);
      });
    });

    describe('filter by ie', () => {
      it('should filter by ie - exact match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { ie: '111222333' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].ie).toBe('111222333');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by ie - partial match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { ie: '222333' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2); // provider-1 (111222333) and provider-2 (222333444)
        const providerIds = providers.map(p => p.id).sort();
        expect(providerIds).toEqual(['provider-1', 'provider-2']);
      });

      it('should return empty when ie does not match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { ie: '999999999' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(providers).toHaveLength(0);
      });
    });

    describe('filter by companyName', () => {
      it('should filter by companyName - exact match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { companyName: 'Alpha Company' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].companyName).toBe('Alpha Company');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by companyName - partial match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { companyName: 'Company' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });

      it('should filter by companyName - case insensitive', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { companyName: 'ALPHA' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].companyName).toBe('Alpha Company');
      });
    });

    describe('filter by address', () => {
      it('should filter by address - match city', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'São Paulo' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].city).toBe('São Paulo');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by address - match state', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'SP' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].state).toBe('SP');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by address - match street', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'Alpha Street' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].street).toBe('Alpha Street');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by address - match neighborhood', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'Beta Neighborhood' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].neighborhood).toBe('Beta Neighborhood');
        expect(providers[0].id).toBe('provider-2');
      });

      it('should filter by address - match zipCode', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: '12345678' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].zipCode).toBe('12345678');
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by address - case insensitive', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'SÃO PAULO' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].city).toBe('São Paulo');
      });

      it('should filter by address - partial match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'Street' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3); // All providers have "Street" in their street field
        expect(providers).toHaveLength(3);
      });

      it('should return empty when address does not match', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { address: 'NonExistent Address' };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(providers).toHaveLength(0);
      });
    });

    describe('filter by companyIds', () => {
      it('should filter by single companyId', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { companyIds: [company01.id] };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        const providerIds = providers.map(p => p.id).sort();
        expect(providerIds).toEqual(['provider-1', 'provider-3']);
      });

      it('should filter by multiple companyIds', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { companyIds: [company01.id, company02.id] };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });

      it('should return empty when companyIds has non-existent id', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { companyIds: ['non-existent-company-id'] };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(providers).toHaveLength(0);
      });
    });

    describe('filter by active', () => {
      it('should filter by active = true', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { active: true };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        providers.forEach(provider => {
          expect(provider.active).toBe(true);
        });
      });

      it('should filter by active = false', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { active: false };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-3');
        expect(providers[0].active).toBe(false);
      });
    });

    describe('pagination', () => {
      it('should paginate results - first page', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { page: 1, size: 2 };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(2);
      });

      it('should paginate results - second page', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { page: 2, size: 2 };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(1);
      });

      it('should return empty when page exceeds available results', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = { page: 10, size: 10 };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(0);
      });

      it('should return all results when no pagination provided', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {};

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });
    });

    describe('combined filters', () => {
      it('should filter by type AND active', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          type: ProviderType.RECURRING,
          active: true,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-1');
        expect(providers[0].type).toBe(ProviderType.RECURRING);
        expect(providers[0].active).toBe(true);
      });

      it('should filter by address AND active', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          address: 'São Paulo',
          active: true,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by name AND type AND companyIds', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          name: 'Provider',
          type: ProviderType.RECURRING,
          companyIds: [company01.id],
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        const providerIds = providers.map(p => p.id).sort();
        expect(providerIds).toEqual(['provider-1', 'provider-3']);
      });

      it('should filter by companyName AND address AND active', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          companyName: 'Alpha',
          address: 'São Paulo',
          active: true,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-1');
      });

      it('should filter by cnpj AND ie', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          cnpj: '33444555000172',
          ie: '111222333',
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-1');
      });

      it('should return empty when combined filters match no providers', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          type: ProviderType.ONE_TIME,
          address: 'São Paulo',
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(providers).toHaveLength(0);
      });

      it('should combine all filter types', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          name: 'Alpha',
          type: ProviderType.RECURRING,
          cnpj: '33444555000172',
          ie: '111222333',
          companyName: 'Alpha Company',
          address: 'São Paulo',
          companyIds: [company01.id],
          active: true,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers[0].id).toBe('provider-1');
      });
    });

    describe('pagination with filters', () => {
      it('should paginate filtered results by type', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          type: ProviderType.RECURRING,
          page: 1,
          size: 1,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(providers).toHaveLength(1);
      });

      it('should paginate filtered results by companyIds', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          companyIds: [company01.id],
          page: 1,
          size: 1,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(providers).toHaveLength(1);
      });

      it('should return second page of filtered results', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          companyIds: [company01.id],
          page: 2,
          size: 1,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(providers).toHaveLength(1);
      });

      it('should return empty when page exceeds filtered results', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          type: ProviderType.ONE_TIME,
          page: 2,
          size: 10,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(providers).toHaveLength(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string filters (return all)', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          name: '',
          companyName: '',
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });

      it('should handle undefined filters', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          name: undefined,
          type: undefined,
          active: undefined,
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });

      it('should handle empty companyIds array', async() => {
        // Arrange
        const query: FindAllProviderQueryDto = {
          companyIds: [],
        };

        // Act
        const [providers, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(providers).toHaveLength(3);
      });
    });
  });

  describe('findById', () => {
    it('should return null when provider not found', async() => {
      // Act
      const provider = await sut.findById('non-existent-id');

      // Assert
      expect(provider).toBeNull();
    });

    it('should return the correct provider when found', async() => {
      // Arrange
      await prisma.provider.create({
        data: {
          id: 'test-provider-id',
          name: 'Test Provider',
          type: ProviderType.RECURRING,
          valueInCents: 10000,
          cnpj: '33444555000172',
          ie: '123456789',
          paymentDay: 15,
          paymentExpirationDate: null,
          companyName: 'Test Company',
          zipCode: '12345678',
          street: 'Test Street',
          number: '100',
          complement: null,
          reference: null,
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'TC',
          email: 'test@email.com',
          website: null,
          active: true,
          companies: { connect: { id: company01.id } },
        },
      });

      // Act
      const provider = await sut.findById('test-provider-id');

      // Assert
      expect(provider).not.toBeNull();
      expect(provider?.id).toBe('test-provider-id');
      expect(provider?.name).toBe('Test Provider');
    });
  });

  describe('findByCnpj', () => {
    it('should return null when provider with cnpj not found', async() => {
      // Act
      const provider = await sut.findByCnpj('99999999999999');

      // Assert
      expect(provider).toBeNull();
    });

    it('should return the correct provider when found by cnpj', async() => {
      // Arrange
      await prisma.provider.create({
        data: {
          id: 'cnpj-test-provider',
          name: 'CNPJ Test Provider',
          type: ProviderType.RECURRING,
          valueInCents: 10000,
          cnpj: '33444555000172',
          ie: '123456789',
          paymentDay: 15,
          paymentExpirationDate: null,
          companyName: 'CNPJ Test Company',
          zipCode: '12345678',
          street: 'CNPJ Test Street',
          number: '100',
          complement: null,
          reference: null,
          neighborhood: 'CNPJ Test Neighborhood',
          city: 'CNPJ Test City',
          state: 'TC',
          email: 'cnpjtest@email.com',
          website: null,
          active: true,
          companies: { connect: { id: company01.id } },
        },
      });

      // Act
      const provider = await sut.findByCnpj('33444555000172');

      // Assert
      expect(provider).not.toBeNull();
      expect(provider?.id).toBe('cnpj-test-provider');
      expect(provider?.cnpj).toBe('33444555000172');
    });
  });
});
