import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProviderType } from '../../../domain/enums/provider-type.enum';
import { ProviderModule } from '../../../provider.module';
import { ProviderDto } from '../../dtos/provider.dto';
import { CreateProvider } from '../create-provider/create-provider.service';
import { CreateProviderInputDto } from '../create-provider/dtos/create-provider.dto';
import { FindAllProviderQueryDto } from './dtos/find-all-provider.dto';
import { FindAllProvider } from './find-all-provider.service';

describe('FindAllProvider', () => {
  let sut: FindAllProvider;
  let prisma: PrismaService;
  let createProvider: CreateProvider;
  let baseProviderData: CreateProviderInputDto;
  let createdProviderIds: string[];
  let companyId1: string;
  let companyId2: string;
  let companyId3: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProviderModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllProvider);
    prisma = module.get(PrismaService);
    createProvider = module.get(CreateProvider);

    await prisma.provider.deleteMany();
    await prisma.company.deleteMany();

    // Create test companies
    const company1 = await prisma.company.create({
      data: {
        name: 'Test Company 1',
        fantasyName: 'Company 1',
        document: '51456427000130',
        ie: '111111111',
        zipCode: '12345678',
        street: 'Test Street 1',
        number: '100',
        neighborhood: 'District 1',
        city: 'City 1',
        state: 'C1',
        phone01: '1111111111',
        email01: 'company1@test.com',
        active: true,
      },
    });
    companyId1 = company1.id;

    const company2 = await prisma.company.create({
      data: {
        name: 'Test Company 2',
        fantasyName: 'Company 2',
        document: '23211777000109',
        ie: '222222222',
        zipCode: '87654321',
        street: 'Test Street 2',
        number: '200',
        neighborhood: 'District 2',
        city: 'City 2',
        state: 'C2',
        phone01: '2222222222',
        email01: 'company2@test.com',
        active: true,
      },
    });
    companyId2 = company2.id;

    const company3 = await prisma.company.create({
      data: {
        name: 'Test Company 3',
        fantasyName: 'Company 3',
        document: '12345678909',
        ie: '333333333',
        zipCode: '11223344',
        street: 'Test Street 3',
        number: '300',
        neighborhood: 'District 3',
        city: 'City 3',
        state: 'C3',
        phone01: '3333333333',
        email01: 'company3@test.com',
        active: true,
      },
    });
    companyId3 = company3.id;

    baseProviderData = {
      name: 'Base Provider',
      type: ProviderType.RECURRING,
      valueInCents: 100000,
      cnpj: '54629031000135',
      ie: '123456789',
      paymentDay: 10,
      paymentExpirationDate: null,
      companyName: 'Provider Base Company',
      zipCode: '01234-567',
      street: 'Provider Street',
      number: '100',
      complement: null,
      reference: null,
      neighborhood: 'Provider District',
      city: 'São Paulo',
      state: 'SP',
      email: 'provider@test.com',
      website: null,
      companyIds: [],
    };

    // Create diverse test providers for comprehensive filter testing
    createdProviderIds = [];

    // Provider 1: Alpha Services - RECURRING - No companies
    const provider1 = await createProvider.execute({
      ...baseProviderData,
      name: 'Alpha Tech Services',
      type: ProviderType.RECURRING,
      valueInCents: 150000,
      cnpj: '32488585000127',
      ie: '111111111',
      paymentDay: 5,
      paymentExpirationDate: null,
      companyName: 'Alpha Corporation Ltd',
      zipCode: '01111-111',
      street: 'Alpha Street',
      number: '111',
      neighborhood: 'Alpha District',
      city: 'São Paulo',
      state: 'SP',
      email: 'contact@alpha.com',
      website: 'www.alpha.com',
      companyIds: [],
    });
    createdProviderIds.push(provider1.id);

    // Provider 2: Beta Solutions - ONE_TIME - Company 1
    const provider2 = await createProvider.execute({
      ...baseProviderData,
      name: 'Beta Cloud Solutions',
      type: ProviderType.ONE_TIME,
      valueInCents: 250000,
      cnpj: '50099406000141',
      ie: '222222222',
      paymentDay: null,
      paymentExpirationDate: new Date('2025-12-31'),
      companyName: 'Beta Technologies Inc',
      zipCode: '02222-222',
      street: 'Beta Avenue',
      number: '222',
      complement: 'Suite 10',
      reference: 'Near mall',
      neighborhood: 'Beta District',
      city: 'Rio de Janeiro',
      state: 'RJ',
      email: 'info@beta.com',
      website: null,
      companyIds: [companyId1],
    });
    createdProviderIds.push(provider2.id);

    // Provider 3: Gamma Systems - RECURRING - Companies 1 and 2
    const provider3 = await createProvider.execute({
      ...baseProviderData,
      name: 'Gamma Enterprise Systems',
      type: ProviderType.RECURRING,
      valueInCents: 350000,
      cnpj: '14046756000186',
      ie: '333333333',
      paymentDay: 15,
      paymentExpirationDate: null,
      companyName: 'Gamma Global Corp',
      zipCode: '03333-333',
      street: 'Gamma Road',
      number: '333',
      neighborhood: 'Gamma District',
      city: 'Belo Horizonte',
      state: 'MG',
      email: 'contact@gamma.com',
      website: 'www.gamma.com.br',
      companyIds: [companyId1, companyId2],
    });
    createdProviderIds.push(provider3.id);

    // Provider 4: Delta Network - ONE_TIME - Company 2
    const provider4 = await createProvider.execute({
      ...baseProviderData,
      name: 'Delta Network Services',
      type: ProviderType.ONE_TIME,
      valueInCents: 450000,
      cnpj: '05171187000100',
      ie: '444444444',
      paymentDay: null,
      paymentExpirationDate: new Date('2026-06-30'),
      companyName: 'Delta Networks Ltd',
      zipCode: '04444-444',
      street: 'Delta Boulevard',
      number: '444',
      neighborhood: 'Delta District',
      city: 'Curitiba',
      state: 'PR',
      email: 'sales@delta.com',
      website: 'www.deltanetwork.com',
      companyIds: [companyId2],
    });
    createdProviderIds.push(provider4.id);

    // Provider 5: Epsilon Consulting - RECURRING - Company 3
    const provider5 = await createProvider.execute({
      ...baseProviderData,
      name: 'Epsilon Business Consulting',
      type: ProviderType.RECURRING,
      valueInCents: 550000,
      cnpj: '03250356000171',
      ie: '555555555',
      paymentDay: 20,
      paymentExpirationDate: null,
      companyName: 'Epsilon Advisors Inc',
      zipCode: '05555-555',
      street: 'Epsilon Street',
      number: '555',
      neighborhood: 'Epsilon District',
      city: 'Porto Alegre',
      state: 'RS',
      email: 'info@epsilon.com',
      website: null,
      companyIds: [companyId3],
    });
    createdProviderIds.push(provider5.id);

    // Provider 6: Foxtrot Digital - RECURRING - All companies
    const provider6 = await createProvider.execute({
      ...baseProviderData,
      name: 'Foxtrot Digital Marketing',
      type: ProviderType.RECURRING,
      valueInCents: 650000,
      cnpj: '02675959000152',
      ie: '666666666',
      paymentDay: 25,
      paymentExpirationDate: null,
      companyName: 'Foxtrot Media Group',
      zipCode: '06666-666',
      street: 'Foxtrot Avenue',
      number: '666',
      complement: 'Building A',
      neighborhood: 'Foxtrot District',
      city: 'Brasília',
      state: 'DF',
      email: 'contact@foxtrot.com',
      website: 'www.foxtrotdigital.com',
      companyIds: [companyId1, companyId2, companyId3],
    });
    createdProviderIds.push(provider6.id);
  });

  afterEach(async() => {
    await prisma.provider.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call providerDao with correct parameters', async() => {
      // Arrange
      const findAllSpy = jest.spyOn(sut['providerDao'], 'findAll').mockResolvedValue([[], 0]);
      const queries: FindAllProviderQueryDto = { page: 1, size: 10 };

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return a Pagination object with correct structure', async() => {
      // Arrange
      const mockData: ProviderDto[] = [{ id: 'test-id' } as ProviderDto];
      jest.spyOn(sut['providerDao'], 'findAll').mockResolvedValue([mockData, 1]);

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('itemsPerPage');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalPages');
    });
  });

  describe('Integration tests - Basic functionality', () => {
    it('should return an empty result when no providers exist', async() => {
      // Arrange
      await prisma.provider.deleteMany(); // Ensure database is clean

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toEqual<IPagination<ProviderDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all providers when no filters are provided', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.itemsPerPage).toBe(6);

      // Verify all created providers are returned
      const returnedIds = result.data.map(provider => provider.id).sort();
      const expectedIds = [...createdProviderIds].sort();
      expect(returnedIds).toEqual(expectedIds);
    });

    it('should handle pagination correctly', async() => {
      // Act
      const result = await sut.execute({ page: 2, size: 2 });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(2);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should return correct dto structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const provider = result.data.filter(p => p.companies.length > 0)[0];
      expect(provider).toEqual<ProviderDto>({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        valueInCents: expect.any(Number),
        cnpj: expect.any(String),
        ie: expect.any(String),
        paymentDay: provider.paymentDay ? expect.any(Number) : null,
        paymentExpirationDate: provider.paymentExpirationDate ? expect.any(Date) : null,
        companyName: expect.any(String),
        zipCode: expect.any(String),
        street: expect.any(String),
        number: expect.any(String),
        complement: provider.complement ? expect.any(String) : null,
        reference: provider.reference ? expect.any(String) : null,
        neighborhood: expect.any(String),
        city: expect.any(String),
        state: expect.any(String),
        email: expect.any(String),
        website: provider.website ? expect.any(String) : null,
        active: expect.any(Boolean),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('Integration tests - Individual filter tests', () => {
    it('should filter by name - exact match', async() => {
      // Act
      const result = await sut.execute({ name: 'Alpha Tech Services' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alpha Tech Services');
      expect(result.data[0].id).toBe(createdProviderIds[0]);
    });

    it('should filter by name - partial match', async() => {
      // Act
      const result = await sut.execute({ name: 'Tech' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Tech');
    });

    it('should filter by type - RECURRING', async() => {
      // Act
      const result = await sut.execute({ type: ProviderType.RECURRING });

      // Assert
      expect(result.totalItems).toBe(4); // providers 1, 3, 5, 6
      expect(result.data).toHaveLength(4);
      result.data.forEach(provider => {
        expect(provider.type).toBe(ProviderType.RECURRING);
      });
    });

    it('should filter by type - ONE_TIME', async() => {
      // Act
      const result = await sut.execute({ type: ProviderType.ONE_TIME });

      // Assert
      expect(result.totalItems).toBe(2); // providers 2, 4
      expect(result.data).toHaveLength(2);
      result.data.forEach(provider => {
        expect(provider.type).toBe(ProviderType.ONE_TIME);
      });
    });

    it('should filter by cnpj - exact match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '05171187000100' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('05171187000100');
    });

    it('should filter by cnpj - partial match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '0517118' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('05171187000100');
    });

    it('should filter by ie', async() => {
      // Act
      const result = await sut.execute({ ie: '333333333' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ie).toBe('333333333');
    });

    it('should filter by companyName - partial match', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Alpha' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toBe('Alpha Corporation Ltd');
    });

    it('should filter by companyName - multiple matches', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Ltd' });

      // Assert
      expect(result.totalItems).toBeGreaterThan(1);
      result.data.forEach(provider => {
        expect(provider.companyName).toContain('Ltd');
      });
    });

    it('should filter by address - street', async() => {
      // Act
      const result = await sut.execute({ address: 'Alpha Street' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].street).toBe('Alpha Street');
    });

    it('should filter by address - city', async() => {
      // Act
      const result = await sut.execute({ address: 'São Paulo' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].city).toBe('São Paulo');
    });

    it('should filter by address - neighborhood', async() => {
      // Act
      const result = await sut.execute({ address: 'Beta District' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].neighborhood).toBe('Beta District');
    });

    it('should filter by active status - true', async() => {
      // Act
      const result = await sut.execute({ active: true });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      result.data.forEach(provider => {
        expect(provider.active).toBe(true);
      });
    });

    it('should filter by active status - false', async() => {
      // Act
      const result = await sut.execute({ active: false });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Integration tests - Case insensitive filters', () => {
    it('should handle case insensitive search for name', async() => {
      // Act
      const result = await sut.execute({ name: 'ALPHA' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].name).toBe('Alpha Tech Services');
    });

    it('should handle case insensitive search for companyName', async() => {
      // Act
      const result = await sut.execute({ companyName: 'BETA' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companyName).toBe('Beta Technologies Inc');
    });

    it('should handle case insensitive search for address', async() => {
      // Act
      const result = await sut.execute({ address: 'GAMMA ROAD' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].street).toBe('Gamma Road');
    });
  });

  describe('Integration tests - Combined filters', () => {
    it('should filter by name AND type', async() => {
      // Act
      const result = await sut.execute({ name: 'Gamma', type: ProviderType.RECURRING });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Gamma');
      expect(result.data[0].type).toBe(ProviderType.RECURRING);
    });

    it('should filter by companyName AND address', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Delta', address: 'Curitiba' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Delta');
      expect(result.data[0].city).toBe('Curitiba');
    });

    it('should filter by multiple string fields', async() => {
      // Act
      const result = await sut.execute({
        name: 'Foxtrot',
        companyName: 'Media',
        address: 'Brasília',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Foxtrot');
      expect(result.data[0].companyName).toContain('Media');
      expect(result.data[0].city).toBe('Brasília');
    });

    it('should return empty when filters do not match any provider', async() => {
      // Act
      const result = await sut.execute({ name: 'NonExistent', type: ProviderType.ONE_TIME });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should filter by exact CNPJ AND IE', async() => {
      // Act
      const result = await sut.execute({
        cnpj: '05171187000100',
        ie: '444444444',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('05171187000100');
      expect(result.data[0].ie).toBe('444444444');
    });
  });

  describe('Integration tests - Pagination with filters', () => {
    it('should combine pagination with type filter', async() => {
      // Act
      const result = await sut.execute({ type: ProviderType.RECURRING, page: 1, size: 2 });

      // Assert
      expect(result.totalItems).toBe(4); // Total RECURRING providers
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should combine pagination with multiple filters', async() => {
      // Act
      const result = await sut.execute({ type: ProviderType.RECURRING, page: 1, size: 1 });

      // Assert
      expect(result.totalItems).toBe(4); // Total RECURRING providers
      expect(result.data).toHaveLength(1); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(4);
    });

    it('should handle pagination beyond available results', async() => {
      // Act
      const result = await sut.execute({ type: ProviderType.ONE_TIME, page: 3, size: 2 });

      // Assert
      expect(result.totalItems).toBe(2); // Total ONE_TIME providers
      expect(result.data).toHaveLength(0); // No results on page 3
      expect(result.currentPage).toBe(3);
    });
  });

  describe('Integration tests - Edge cases', () => {
    it('should return empty result when filtering by non-existent value', async() => {
      // Act
      const result = await sut.execute({ name: 'NonExistentProvider' });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty string filters', async() => {
      // Act
      const result = await sut.execute({ name: '', companyName: '' });

      // Assert
      expect(result.totalItems).toBe(6); // Should return all providers
      expect(result.data).toHaveLength(6);
    });

    it('should handle undefined filters mixed with valid ones', async() => {
      // Act
      const result = await sut.execute({
        name: 'Beta',
        companyName: undefined,
        type: undefined,
      });

      // Assert
      expect(result.totalItems).toBe(1); // Beta providers
      expect(result.data).toHaveLength(1);
    });

    it('should handle partial matches correctly', async() => {
      // Act
      const result = await sut.execute({ name: 'Services' });

      // Assert
      expect(result.totalItems).toBeGreaterThan(0);
      result.data.forEach(provider => {
        expect(provider.name).toContain('Services');
      });
    });
  });

  describe('Integration tests - Filter by companyIds', () => {
    it('should filter by single companyId - Company 1', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId1] });

      // Assert
      expect(result.totalItems).toBe(3); // providers 2, 3, 6 (have Company 1)
      expect(result.data).toHaveLength(3);

      const providerIds = result.data.map(p => p.id).sort();
      const expectedIds = [createdProviderIds[1], createdProviderIds[2], createdProviderIds[5]].sort();
      expect(providerIds).toEqual(expectedIds);

      // Verify each provider has Company 1
      result.data.forEach(provider => {
        const companyIds = provider.companies.map(c => c.id);
        expect(companyIds).toContain(companyId1);
      });
    });

    it('should filter by single companyId - Company 2', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId2] });

      // Assert
      expect(result.totalItems).toBe(3); // providers 3, 4, 6 (have Company 2)
      expect(result.data).toHaveLength(3);

      const providerIds = result.data.map(p => p.id).sort();
      const expectedIds = [createdProviderIds[2], createdProviderIds[3], createdProviderIds[5]].sort();
      expect(providerIds).toEqual(expectedIds);

      // Verify each provider has Company 2
      result.data.forEach(provider => {
        const companyIds = provider.companies.map(c => c.id);
        expect(companyIds).toContain(companyId2);
      });
    });

    it('should filter by single companyId - Company 3', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId3] });

      // Assert
      expect(result.totalItems).toBe(2); // providers 5, 6 (have Company 3)
      expect(result.data).toHaveLength(2);

      const providerIds = result.data.map(p => p.id).sort();
      const expectedIds = [createdProviderIds[4], createdProviderIds[5]].sort();
      expect(providerIds).toEqual(expectedIds);

      // Verify each provider has Company 3
      result.data.forEach(provider => {
        const companyIds = provider.companies.map(c => c.id);
        expect(companyIds).toContain(companyId3);
      });
    });

    it('should filter by multiple companyIds - Companies 1 and 2', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId1, companyId2] });

      // Assert
      expect(result.totalItems).toBe(4); // providers 2, 3, 4, 6 (have Company 1 OR 2)
      expect(result.data).toHaveLength(4);

      const providerIds = result.data.map(p => p.id).sort();
      const expectedIds = [
        createdProviderIds[1],
        createdProviderIds[2],
        createdProviderIds[3],
        createdProviderIds[5],
      ].sort();
      expect(providerIds).toEqual(expectedIds);
    });

    it('should filter by multiple companyIds - Companies 2 and 3', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId2, companyId3] });

      // Assert
      expect(result.totalItems).toBe(4); // providers 3, 4, 5, 6 (have Company 2 OR 3)
      expect(result.data).toHaveLength(4);

      const providerIds = result.data.map(p => p.id).sort();
      const expectedIds = [
        createdProviderIds[2],
        createdProviderIds[3],
        createdProviderIds[4],
        createdProviderIds[5],
      ].sort();
      expect(providerIds).toEqual(expectedIds);
    });

    it('should filter by all companyIds', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId1, companyId2, companyId3] });

      // Assert
      expect(result.totalItems).toBe(5); // All providers except provider 1 (which has no companies)
      expect(result.data).toHaveLength(5);

      const providerIds = result.data.map(p => p.id).sort();
      const expectedIds = [
        createdProviderIds[1],
        createdProviderIds[2],
        createdProviderIds[3],
        createdProviderIds[4],
        createdProviderIds[5],
      ].sort();
      expect(providerIds).toEqual(expectedIds);
    });

    it('should return empty when filtering by non-existent companyId', async() => {
      // Act
      const result = await sut.execute({ companyIds: ['non-existent-company-id'] });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should return all providers when companyIds is empty array', async() => {
      // Act
      const result = await sut.execute({ companyIds: [] });

      // Assert
      expect(result.totalItems).toBe(6); // Should return all providers (empty array is ignored)
      expect(result.data).toHaveLength(6);
    });

    it('should combine companyIds filter with type filter', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId1],
        type: ProviderType.RECURRING,
      });

      // Assert
      expect(result.totalItems).toBe(2); // providers 3, 6 (have Company 1 AND RECURRING)
      expect(result.data).toHaveLength(2);
      result.data.forEach(provider => {
        expect(provider.type).toBe(ProviderType.RECURRING);
      });
    });

    it('should combine companyIds filter with name filter', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId2],
        name: 'Gamma',
      });

      // Assert
      expect(result.totalItems).toBe(1); // Only provider 3 (has Company 2 AND Gamma in name)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(createdProviderIds[2]);
      expect(result.data[0].name).toContain('Gamma');
    });

    it('should combine companyIds filter with active filter', async() => {
      // Arrange - First, deactivate one provider
      const providerToDeactivate = await prisma.provider.findUnique({
        where: { id: createdProviderIds[1] },
      });
      await prisma.provider.update({
        where: { id: createdProviderIds[1] },
        data: { active: !providerToDeactivate!.active },
      });

      // Act
      const result = await sut.execute({
        companyIds: [companyId1],
        active: true,
      });

      // Assert
      expect(result.totalItems).toBe(2); // providers 3, 6 (have Company 1 AND active)
      expect(result.data).toHaveLength(2);

      result.data.forEach(provider => {
        expect(provider.active).toBe(true);
        const companyIds = provider.companies.map(c => c.id);
        expect(companyIds).toContain(companyId1);
      });

      // Cleanup - restore original state
      await prisma.provider.update({
        where: { id: createdProviderIds[1] },
        data: { active: !providerToDeactivate!.active },
      });
    });

    it('should combine companyIds with multiple string filters', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId1, companyId2],
        name: 'Gamma',
        type: ProviderType.RECURRING,
      });

      // Assert
      expect(result.totalItems).toBe(1); // Only provider 3 (has Company 1/2, Gamma, and RECURRING)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(createdProviderIds[2]);
    });

    it('should return empty when companyIds filter does not match with other filters', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId3],
        name: 'Alpha',
      });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should combine pagination with companyIds filter', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId1],
        page: 1,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(3); // Total providers with Company 1
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should combine pagination with multiple companyIds', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId2, companyId3],
        page: 2,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(4); // providers 3, 4, 5, 6 (have Company 2 or 3)
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should verify correct companies are returned when filtering by companyIds', async() => {
      // Act
      const result = await sut.execute({ companyIds: [companyId2] });

      // Assert
      expect(result.totalItems).toBe(3); // providers 3, 4, 6

      // Verify each provider has Company 2 in their companies array
      result.data.forEach(provider => {
        const companyIds = provider.companies.map(c => c.id);
        expect(companyIds).toContain(companyId2);
        expect(provider.companies.some(c => c.id === companyId2)).toBe(true);
      });
    });

    it('should handle companyIds filter with pagination beyond results', async() => {
      // Act
      const result = await sut.execute({
        companyIds: [companyId3],
        page: 5,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(2); // Total providers with Company 3
      expect(result.data).toHaveLength(0); // No results on page 5
      expect(result.currentPage).toBe(5);
    });
  });

  describe('Integration tests - Company associations', () => {
    it('should return providers with empty companies array', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const providersWithNoCompanies = result.data.filter(p => p.companies.length === 0);
      expect(providersWithNoCompanies).toHaveLength(1); // Only provider 1 has no companies
      expect(providersWithNoCompanies[0].id).toBe(createdProviderIds[0]);
    });

    it('should return providers with companies array populated', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      const providersWithCompanies = result.data.filter(p => p.companies.length > 0);
      expect(providersWithCompanies).toHaveLength(5); // Providers 2, 3, 4, 5, 6 have companies
    });

    it('should return provider with single company association', async() => {
      // Act
      const result = await sut.execute({ name: 'Beta Cloud' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(1);
      expect(result.data[0].companies[0].id).toBe(companyId1);
      expect(result.data[0].companies[0].name).toBe('Test Company 1');
    });

    it('should return provider with multiple company associations', async() => {
      // Act
      const result = await sut.execute({ name: 'Gamma Enterprise' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(2);
      const companyIds = result.data[0].companies.map(c => c.id);
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);
    });

    it('should return provider with all companies associated', async() => {
      // Act
      const result = await sut.execute({ name: 'Foxtrot Digital' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(3);
      const companyIds = result.data[0].companies.map(c => c.id);
      expect(companyIds).toContain(companyId1);
      expect(companyIds).toContain(companyId2);
      expect(companyIds).toContain(companyId3);
    });

    it('should return correct company names and ids in companies array', async() => {
      // Act
      const result = await sut.execute({ name: 'Delta Network' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companies).toHaveLength(1);
      expect(result.data[0].companies[0]).toEqual({
        id: companyId2,
        name: 'Test Company 2',
      });
    });

    it('should return all providers and verify companies array structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);

      // Verify each provider has companies array
      result.data.forEach(provider => {
        expect(provider).toHaveProperty('companies');
        expect(Array.isArray(provider.companies)).toBe(true);

        // Verify each company in the array has correct structure
        provider.companies.forEach(company => {
          expect(company).toHaveProperty('id');
          expect(company).toHaveProperty('name');
          expect(typeof company.id).toBe('string');
          expect(typeof company.name).toBe('string');
        });
      });
    });

    it('should verify specific provider company associations', async() => {
      // Act
      const result = await sut.execute({});

      // Assert - Verify specific providers have correct number of companies
      const provider1 = result.data.find(p => p.id === createdProviderIds[0]);
      const provider2 = result.data.find(p => p.id === createdProviderIds[1]);
      const provider3 = result.data.find(p => p.id === createdProviderIds[2]);
      const provider4 = result.data.find(p => p.id === createdProviderIds[3]);
      const provider5 = result.data.find(p => p.id === createdProviderIds[4]);
      const provider6 = result.data.find(p => p.id === createdProviderIds[5]);

      expect(provider1?.companies).toHaveLength(0); // No companies
      expect(provider2?.companies).toHaveLength(1); // Company 1
      expect(provider3?.companies).toHaveLength(2); // Companies 1, 2
      expect(provider4?.companies).toHaveLength(1); // Company 2
      expect(provider5?.companies).toHaveLength(1); // Company 3
      expect(provider6?.companies).toHaveLength(3); // Companies 1, 2, 3
    });

    it('should handle pagination with companies array', async() => {
      // Act
      const result = await sut.execute({ page: 1, size: 3 });

      // Assert
      expect(result.data).toHaveLength(3);
      result.data.forEach(provider => {
        expect(provider).toHaveProperty('companies');
        expect(Array.isArray(provider.companies)).toBe(true);
      });
    });
  });
});
