import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDto } from '../../dtos/client.dto';
import { CreateClient } from '../create-client/create-client.service';
import { CreateClientInputDto } from '../create-client/dtos/create-client.dto';
import { FindAllClientQueryDto } from './dtos/find-all-client.dto';
import { FindAllClient } from './find-all-client.service';

describe('FindAllClient', () => {
  let sut: FindAllClient;
  let prisma: PrismaService;
  let createClient: CreateClient;
  let baseClientData: CreateClientInputDto;
  let createCompany: CreateCompany;
  let createdClientIds: string[];

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllClient);
    prisma = module.get(PrismaService);
    createClient = module.get(CreateClient);
    createCompany = module.get(CreateCompany);

    await prisma.company.deleteMany();
    await prisma.client.deleteMany();

    const company = await createCompany.execute({
      name: 'name teste',
      fantasyName: 'fantasyName teste',
      document: '98476009000178',
      ie: 'ie teste',
      zipCode: 'zipCode teste',
      street: 'street teste',
      number: 'number teste',
      neighborhood: 'neighborhood teste',
      complement: null,
      reference: null,
      city: 'city teste',
      state: 'state teste',
      cellphone: '9999887766',
      phone01: '1199887766',
      phone02: null,
      email01: 'email01@teste.com',
      email02: null,
    });

    baseClientData = {
      kind: 'individual',
      cnpj: '12345678000199',
      ie: '123456789',
      group: 'default',
      type: 'customer',
      generateInvoice: true,
      companyName: 'John Doe Ltda',
      fantasyName: 'John Doe',
      owner: 'John Doe',
      headquarters: '123 Main St, City, State, ZIP',
      companyIds: [company.id],
    };

    // Create diverse test clients for comprehensive filter testing
    createdClientIds = [];

    // Client 1: PJ, Technology, Premium
    const client1 = await createClient.execute({
      ...baseClientData,
      kind: 'PJ',
      cnpj: '11.111.111/0001-11',
      ie: '111.111.111.111',
      group: 'Technology',
      type: 'Premium',
      companyName: 'Alpha Tech Solutions',
      fantasyName: 'Alpha Tech',
      owner: 'John Alpha Smith',
      headquarters: 'Main Office Alpha São Paulo',
    });
    createdClientIds.push(client1.id);

    // Client 2: PF, Industrial, Basic
    const client2 = await createClient.execute({
      ...baseClientData,
      kind: 'PF',
      cnpj: '22.222.222/0001-22',
      ie: '222.222.222.222',
      group: 'Industrial',
      type: 'Basic',
      companyName: 'Beta Industrial Services',
      fantasyName: 'Beta Industrial',
      owner: 'Jane Beta Santos',
      headquarters: 'Branch Office Beta Rio de Janeiro',
    });
    createdClientIds.push(client2.id);

    // Client 3: PJ, Technology, Premium
    const client3 = await createClient.execute({
      ...baseClientData,
      kind: 'PJ',
      cnpj: '33.333.333/0001-33',
      ie: '333.333.333.333',
      group: 'Technology',
      type: 'Premium',
      companyName: 'Gamma Corporation Ltd',
      fantasyName: 'Gamma Corp',
      owner: 'Robert Gamma Wilson',
      headquarters: 'Central Office Gamma Brasília',
    });
    createdClientIds.push(client3.id);

    // Client 4: PJ, Retail, Standard
    const client4 = await createClient.execute({
      ...baseClientData,
      kind: 'PJ',
      cnpj: '44.444.444/0001-44',
      ie: '444.444.444.444',
      group: 'Retail',
      type: 'Standard',
      companyName: 'Delta Commerce Solutions',
      fantasyName: 'Delta Commerce',
      owner: 'Maria Delta Costa',
      headquarters: 'Office Delta Belo Horizonte',
    });
    createdClientIds.push(client4.id);

    // Client 5: PF, Services, Basic
    const client5 = await createClient.execute({
      ...baseClientData,
      kind: 'PF',
      cnpj: '55.555.555/0001-55',
      ie: '555.555.555.555',
      group: 'Services',
      type: 'Basic',
      companyName: 'Epsilon Consulting Group',
      fantasyName: 'Epsilon Consulting',
      owner: 'Carlos Epsilon Lima',
      headquarters: 'Consulting Office Epsilon Porto Alegre',
    });
    createdClientIds.push(client5.id);

    // Client 6: PJ, Industrial, Premium
    const client6 = await createClient.execute({
      ...baseClientData,
      kind: 'PJ',
      cnpj: '66.666.666/0001-66',
      ie: '666.666.666.666',
      group: 'Industrial',
      type: 'Premium',
      companyName: 'Foxtrot Manufacturing Corp',
      fantasyName: 'Foxtrot Manufacturing',
      owner: 'Ana Foxtrot Silva',
      headquarters: 'Manufacturing Plant Foxtrot Salvador',
    });
    createdClientIds.push(client6.id);
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.client.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call clientDao with correct parameters', async() => {
      // Arrange
      const findAllSpy = jest.spyOn(sut['clientDao'], 'findAll').mockResolvedValue([[], 0]);
      const queries = createMock<FindAllClientQueryDto>({ page: 1, size: 10 });

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return a Pagination object with correct structure', async() => {
      // Arrange
      const mockData: ClientDto[] = [{ id: 'test-id' } as ClientDto];
      jest.spyOn(sut['clientDao'], 'findAll').mockResolvedValue([mockData, 1]);

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
    it('should return an empty result when no clients exist', async() => {
      // Arrange
      await prisma.client.deleteMany(); // Ensure database is clean

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result).toEqual<IPagination<ClientDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all clients when no filters are provided', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.itemsPerPage).toBe(6);

      // Verify all created clients are returned
      const returnedIds = result.data.map(client => client.id).sort();
      const expectedIds = [...createdClientIds].sort();
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
  });

  describe('Integration tests - Individual filter tests', () => {
    it('should filter by kind - PJ', async() => {
      // Act
      const result = await sut.execute({ kind: 'PJ' });

      // Assert
      expect(result.totalItems).toBe(4); // clients 1, 3, 4, 6
      expect(result.data).toHaveLength(4);
      result.data.forEach(client => {
        expect(client.kind).toBe('PJ');
      });
    });

    it('should filter by kind - PF', async() => {
      // Act
      const result = await sut.execute({ kind: 'PF' });

      // Assert
      expect(result.totalItems).toBe(2); // clients 2, 5
      expect(result.data).toHaveLength(2);
      result.data.forEach(client => {
        expect(client.kind).toBe('PF');
      });
    });

    it('should filter by cnpj - exact match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '11.111.111/0001-11' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('11.111.111/0001-11');
      expect(result.data[0].id).toBe(createdClientIds[0]);
    });

    it('should filter by cnpj - partial match', async() => {
      // Act
      const result = await sut.execute({ cnpj: '22.222' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('22.222.222/0001-22');
    });

    it('should filter by ie - exact match', async() => {
      // Act
      const result = await sut.execute({ ie: '333.333.333.333' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ie).toBe('333.333.333.333');
      expect(result.data[0].id).toBe(createdClientIds[2]);
    });

    it('should filter by group - Technology', async() => {
      // Act
      const result = await sut.execute({ group: 'Technology' });

      // Assert
      expect(result.totalItems).toBe(2); // clients 1, 3
      expect(result.data).toHaveLength(2);
      result.data.forEach(client => {
        expect(client.group).toContain('Technology');
      });
    });

    it('should filter by group - Industrial', async() => {
      // Act
      const result = await sut.execute({ group: 'Industrial' });

      // Assert
      expect(result.totalItems).toBe(2); // clients 2, 6
      expect(result.data).toHaveLength(2);
      result.data.forEach(client => {
        expect(client.group).toContain('Industrial');
      });
    });

    it('should filter by type - Premium', async() => {
      // Act
      const result = await sut.execute({ type: 'Premium' });

      // Assert
      expect(result.totalItems).toBe(3); // clients 1, 3, 6
      expect(result.data).toHaveLength(3);
      result.data.forEach(client => {
        expect(client.type).toBe('Premium');
      });
    });

    it('should filter by type - Basic', async() => {
      // Act
      const result = await sut.execute({ type: 'Basic' });

      // Assert
      expect(result.totalItems).toBe(2); // clients 2, 5
      expect(result.data).toHaveLength(2);
      result.data.forEach(client => {
        expect(client.type).toBe('Basic');
      });
    });

    it('should filter by companyName - partial match', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Alpha' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toBe('Alpha Tech Solutions');
    });

    it('should filter by companyName - multiple matches', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Corp' });

      // Assert
      expect(result.totalItems).toBe(2); // Gamma Corporation, Foxtrot Manufacturing Corp
      expect(result.data).toHaveLength(2);
    });

    it('should filter by fantasyName', async() => {
      // Act
      const result = await sut.execute({ fantasyName: 'Tech' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fantasyName).toBe('Alpha Tech');
    });

    it('should filter by owner', async() => {
      // Act
      const result = await sut.execute({ owner: 'Smith' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].owner).toBe('John Alpha Smith');
    });

    it('should filter by headquarters', async() => {
      // Act
      const result = await sut.execute({ headquarters: 'São Paulo' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].headquarters).toBe('Main Office Alpha São Paulo');
    });

    it('should filter by companyIds', async() => {
      // Arrange
      const company = await createCompany.execute({
        name: 'Unique Company',
        fantasyName: 'Unique Co',
        document: '30833317000170',
        ie: 'unique-ie',
        zipCode: 'unique-zip',
        street: 'unique-street',
        number: 'unique-number',
        neighborhood: 'unique-neighborhood',
        complement: null,
        reference: null,
        city: 'unique-city',
        state: 'unique-state',
        cellphone: '8888887766',
        phone01: '77799887766',
        phone02: null,
        email01: 'unique-email01@teste.com',
        email02: null,
      });

      await createClient.execute({
        ...baseClientData,
        companyIds: [company.id],
        companyName: 'Unique Client Corp',
      });

      // Act
      const result = await sut.execute({ companyIds: [company.id] });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companies[0].id).toBe(company.id);
    });

    it('should filter by active status', async() => {
      // Arrange
      // Deactivate one client
      const clientToDeactivateId = createdClientIds[0];
      await prisma.client.update({
        where: { id: clientToDeactivateId },
        data: { active: false },
      });

      // Act
      const activeResult = await sut.execute({ active: true });
      const inactiveResult = await sut.execute({ active: false });

      // Assert
      expect(activeResult.totalItems).toBe(5);
      expect(activeResult.data.find(c => c.id === clientToDeactivateId)).toBeUndefined();

      expect(inactiveResult.totalItems).toBe(1);
      expect(inactiveResult.data[0].id).toBe(clientToDeactivateId);
    });
  });

  describe('Integration tests - Case insensitive filters', () => {
    it('should handle case insensitive search for kind', async() => {
      // Act
      const result = await sut.execute({ kind: 'pj' });

      // Assert
      expect(result.totalItems).toBe(4);
      result.data.forEach(client => {
        expect(client.kind).toBe('PJ');
      });
    });

    it('should handle case insensitive search for group', async() => {
      // Act
      const result = await sut.execute({ group: 'technology' });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(client => {
        expect(client.group).toContain('Technology');
      });
    });

    it('should handle case insensitive search for companyName', async() => {
      // Act
      const result = await sut.execute({ companyName: 'ALPHA' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].companyName).toBe('Alpha Tech Solutions');
    });

    it('should handle case insensitive search for owner', async() => {
      // Act
      const result = await sut.execute({ owner: 'JANE' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].owner).toBe('Jane Beta Santos');
    });
  });

  describe('Integration tests - Combined filters', () => {
    it('should filter by kind AND type', async() => {
      // Act
      const result = await sut.execute({ kind: 'PJ', type: 'Premium' });

      // Assert
      expect(result.totalItems).toBe(3); // clients 1, 3, 6 (all PJ and Premium)
      expect(result.data).toHaveLength(3);
      result.data.forEach(client => {
        expect(client.kind).toBe('PJ');
        expect(client.type).toBe('Premium');
      });
    });

    it('should filter by group AND type', async() => {
      // Act
      const result = await sut.execute({ group: 'Technology', type: 'Premium' });

      // Assert
      expect(result.totalItems).toBe(2); // clients 1, 3
      expect(result.data).toHaveLength(2);
      result.data.forEach(client => {
        expect(client.group).toContain('Technology');
        expect(client.type).toBe('Premium');
      });
    });

    it('should filter by companyName AND owner', async() => {
      // Act
      const result = await sut.execute({ companyName: 'Beta', owner: 'Santos' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Beta');
      expect(result.data[0].owner).toContain('Santos');
    });

    it('should filter by multiple string fields', async() => {
      // Act
      const result = await sut.execute({
        companyName: 'Manufacturing',
        fantasyName: 'Foxtrot',
        headquarters: 'Salvador',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toContain('Manufacturing');
      expect(result.data[0].fantasyName).toContain('Foxtrot');
      expect(result.data[0].headquarters).toContain('Salvador');
    });

    it('should return empty when filters do not match any client', async() => {
      // Act
      const result = await sut.execute({ kind: 'PJ', type: 'Basic' }); // No PJ clients have Basic type

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should filter by exact CNPJ AND IE', async() => {
      // Act
      const result = await sut.execute({
        cnpj: '44.444.444/0001-44',
        ie: '444.444.444.444',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cnpj).toBe('44.444.444/0001-44');
      expect(result.data[0].ie).toBe('444.444.444.444');
    });
  });

  describe('Integration tests - Pagination with filters', () => {
    it('should combine pagination with kind filter', async() => {
      // Act
      const result = await sut.execute({ kind: 'PJ', page: 1, size: 2 });

      // Assert
      expect(result.totalItems).toBe(4); // Total PJ clients
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should combine pagination with multiple filters', async() => {
      // Act
      const result = await sut.execute({ type: 'Premium', page: 1, size: 2 });

      // Assert
      expect(result.totalItems).toBe(3); // Total Premium clients
      expect(result.data).toHaveLength(2); // Page size
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should handle pagination beyond available results', async() => {
      // Act
      const result = await sut.execute({ kind: 'PF', page: 3, size: 2 });

      // Assert
      expect(result.totalItems).toBe(2); // Total PF clients
      expect(result.data).toHaveLength(0); // No results on page 3
      expect(result.currentPage).toBe(3);
    });
  });

  describe('Integration tests - Edge cases', () => {
    it('should return empty result when filtering by non-existent value', async() => {
      // Act
      const result = await sut.execute({ companyName: 'NonExistentCompany' });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty string filters', async() => {
      // Act
      const result = await sut.execute({ companyName: '', fantasyName: '' });

      // Assert
      expect(result.totalItems).toBe(6); // Should return all clients
      expect(result.data).toHaveLength(6);
    });

    it('should handle undefined filters mixed with valid ones', async() => {
      // Act
      const result = await sut.execute({
        kind: 'PJ',
        companyName: undefined,
        type: 'Premium',
      });

      // Assert
      expect(result.totalItems).toBe(3); // PJ AND Premium clients
      expect(result.data).toHaveLength(3);
    });

    it('should handle partial matches correctly', async() => {
      // Act
      const result = await sut.execute({ headquarters: 'Office' });

      // Assert
      expect(result.totalItems).toBeGreaterThan(0);
      result.data.forEach(client => {
        expect(client.headquarters).toContain('Office');
      });
    });
  });

  describe('Integration tests - Correct dto', () => {
    it('should ensure each returned client matches the ClientDto structure', async() => {
      // Act
      const result = await sut.execute({});

      // Assert
      result.data.forEach(client => {
        expect(client).toMatchObject<ClientDto>({
          id: expect.any(String),
          kind: expect.any(String),
          cnpj: expect.any(String),
          ie: expect.any(String),
          group: expect.any(String),
          type: expect.any(String),
          generateInvoice: expect.any(Boolean),
          companyName: expect.any(String),
          fantasyName: expect.any(String),
          owner: expect.any(String),
          headquarters: expect.any(String),
          active: expect.any(Boolean),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          companies: expect.any(Array),
        });
      });
    });
  });
});
