import { Test } from '@nestjs/testing';
import { ClientPersistenceModule } from 'src/app/client/application/persistence/client-persistence.module';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDaoAdapterPrisma } from './client.dao';

describe('ClientDaoAdapterPrisma', () => {
  let sut: ClientDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ClientPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ClientDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ClientDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.client.deleteMany();
  });

  afterAll(async() => {
    await prisma.client.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Seed test data
      await prisma.client.createMany({
        data: [
          {
            id: 'client-1',
            kind: 'PJ',
            cnpj: '11.111.111/0001-11',
            ie: '111.111.111.111',
            group: 'Group A',
            type: 'Premium',
            generateInvoice: true,
            companyName: 'Alpha Tech Solutions',
            fantasyName: 'Alpha Tech',
            owner: 'John Alpha',
            headquarters: 'Main Office Alpha',
            active: true,
            createdAt: new Date('2023-01-01T10:00:00Z'),
          },
          {
            id: 'client-2',
            kind: 'PF',
            cnpj: '22.222.222/0001-22',
            ie: '222.222.222.222',
            group: 'Group B',
            type: 'Basic',
            generateInvoice: false,
            companyName: 'Beta Industries Inc',
            fantasyName: 'Beta Industries',
            owner: 'Jane Beta',
            headquarters: 'Branch Office Beta',
            active: true,
            createdAt: new Date('2023-02-01T10:00:00Z'),
          },
          {
            id: 'client-3',
            kind: 'PJ',
            cnpj: '33.333.333/0001-33',
            ie: '333.333.333.333',
            group: 'Group A',
            type: 'Premium',
            generateInvoice: true,
            companyName: 'Gamma Corporation',
            fantasyName: 'Gamma Corp',
            owner: 'Robert Gamma',
            headquarters: 'Headquarters Gamma',
            active: false,
            createdAt: new Date('2023-03-01T10:00:00Z'),
          },
          {
            id: 'client-4',
            kind: 'PJ',
            cnpj: '44.444.444/0001-44',
            ie: '444.444.444.444',
            group: 'Group C',
            type: 'Standard',
            generateInvoice: true,
            companyName: 'Delta Services Ltd',
            fantasyName: 'Delta Services',
            owner: 'Sarah Delta',
            headquarters: 'Office Delta',
            active: true,
            createdAt: new Date('2023-04-01T10:00:00Z'),
          },
        ],
      });
    });

    it('should return all clients when no filters are provided', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {};

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(4);
      expect(clients).toHaveLength(4);

      // Should be ordered by createdAt desc (most recent first)
      // Since we created them in sequence, the last created should be first
      expect(clients[0].id).toBe('client-4');
      expect(clients[1].id).toBe('client-3');
      expect(clients[2].id).toBe('client-2');
      expect(clients[3].id).toBe('client-1');
    });

    it('should return paginated results', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        page: 2,
        size: 2,
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(4);
      expect(clients).toHaveLength(2);
      // Page 2 with size 2 should return items 3 and 4 (0-indexed: items at index 2 and 3)
      expect(clients[0].id).toBe('client-2');
      expect(clients[1].id).toBe('client-1');
    });

    it('should filter by company name', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        companyName: 'Alpha',
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(1);
      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe('client-1');
      expect(clients[0].companyName).toBe('Alpha Tech Solutions');
    });

    it('should filter by cnpj', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        cnpj: '22.222',
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(1);
      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe('client-2');
      expect(clients[0].cnpj).toBe('22.222.222/0001-22');
    });

    it('should filter by both company name and cnpj (OR condition)', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        companyName: 'Alpha',
        cnpj: '22.222',
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(2);
      expect(clients).toHaveLength(2);

      const clientIds = clients.map(c => c.id).sort();
      expect(clientIds).toEqual(['client-1', 'client-2']);
    });

    it('should return empty result when no matches found', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        companyName: 'NonExistentCompany',
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(0);
      expect(clients).toHaveLength(0);
    });

    it('should handle case insensitive search for company name', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        companyName: 'alpha',
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(1);
      expect(clients).toHaveLength(1);
      expect(clients[0].companyName).toBe('Alpha Tech Solutions');
    });

    it('should handle partial CNPJ search', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        cnpj: '0001',
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(4); // All clients have '0001' in their CNPJ
      expect(clients).toHaveLength(4);
    });

    it('should combine pagination with filtering', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {
        companyName: 'Tech',
        page: 1,
        size: 1,
      };

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(1);
      expect(clients).toHaveLength(1);
      expect(clients[0].companyName).toBe('Alpha Tech Solutions');
    });
  });

  describe('findById', () => {
    it('should return null when client not found', async() => {
      // Act
      const client = await sut.findById('non-existent-id');

      // Assert
      expect(client).toBeNull();
    });

    it('should return the correct client when found', async() => {
      // Arrange
      const clientData = {
        id: 'test-client-id',
        kind: 'PJ',
        cnpj: '12.345.678/0001-90',
        ie: '123.456.789.012',
        group: 'Test Group',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'Test Owner',
        headquarters: 'Test Office',
        active: true,
      };

      await prisma.client.create({ data: clientData });

      // Act
      const client = await sut.findById('test-client-id');

      // Assert
      expect(client).not.toBeNull();
      expect(client?.id).toBe('test-client-id');
      expect(client?.companyName).toBe('Test Company Ltd');
      expect(client?.cnpj).toBe('12.345.678/0001-90');
      expect(client?.ie).toBe('123.456.789.012');
      expect(client?.active).toBe(true);
    });
  });

  describe('findByCnpj', () => {
    it('should return null when client with cnpj not found', async() => {
      // Act
      const client = await sut.findByCnpj('99.999.999/0001-99');

      // Assert
      expect(client).toBeNull();
    });

    it('should return the correct client when found by cnpj', async() => {
      // Arrange
      const clientData = {
        id: 'cnpj-test-client',
        kind: 'PJ',
        cnpj: '55.555.555/0001-55',
        ie: '555.555.555.555',
        group: 'CNPJ Test Group',
        type: 'Basic',
        generateInvoice: false,
        companyName: 'CNPJ Test Company Ltd',
        fantasyName: 'CNPJ Test Company',
        owner: 'CNPJ Test Owner',
        headquarters: 'CNPJ Test Office',
        active: true,
      };

      await prisma.client.create({ data: clientData });

      // Act
      const client = await sut.findByCnpj('55.555.555/0001-55');

      // Assert
      expect(client).not.toBeNull();
      expect(client?.id).toBe('cnpj-test-client');
      expect(client?.cnpj).toBe('55.555.555/0001-55');
      expect(client?.companyName).toBe('CNPJ Test Company Ltd');
    });

    it('should be case insensitive for cnpj search', async() => {
      // Arrange
      const clientData = {
        id: 'case-test-client',
        kind: 'PJ',
        cnpj: '66.666.666/0001-66',
        ie: '666.666.666.666',
        group: 'Case Test Group',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Case Test Company Ltd',
        fantasyName: 'Case Test Company',
        owner: 'Case Test Owner',
        headquarters: 'Case Test Office',
        active: true,
      };

      await prisma.client.create({ data: clientData });

      // Act
      const client = await sut.findByCnpj('66.666.666/0001-66'.toUpperCase());

      // Assert
      expect(client).not.toBeNull();
      expect(client?.cnpj).toBe('66.666.666/0001-66');
    });
  });

  describe('findByIe', () => {
    it('should return null when client with ie not found', async() => {
      // Act
      const client = await sut.findByIe('999.999.999.999');

      // Assert
      expect(client).toBeNull();
    });

    it('should return the correct client when found by ie', async() => {
      // Arrange
      const clientData = {
        id: 'ie-test-client',
        kind: 'PF',
        cnpj: '77.777.777/0001-77',
        ie: '777.777.777.777',
        group: 'IE Test Group',
        type: 'Standard',
        generateInvoice: true,
        companyName: 'IE Test Company Ltd',
        fantasyName: 'IE Test Company',
        owner: 'IE Test Owner',
        headquarters: 'IE Test Office',
        active: false,
      };

      await prisma.client.create({ data: clientData });

      // Act
      const client = await sut.findByIe('777.777.777.777');

      // Assert
      expect(client).not.toBeNull();
      expect(client?.id).toBe('ie-test-client');
      expect(client?.ie).toBe('777.777.777.777');
      expect(client?.companyName).toBe('IE Test Company Ltd');
      expect(client?.active).toBe(false);
    });

    it('should be case insensitive for ie search', async() => {
      // Arrange
      const clientData = {
        id: 'ie-case-test-client',
        kind: 'PJ',
        cnpj: '88.888.888/0001-88',
        ie: '888.888.888.888',
        group: 'IE Case Test Group',
        type: 'Premium',
        generateInvoice: false,
        companyName: 'IE Case Test Company Ltd',
        fantasyName: 'IE Case Test Company',
        owner: 'IE Case Test Owner',
        headquarters: 'IE Case Test Office',
        active: true,
      };

      await prisma.client.create({ data: clientData });

      // Act
      const client = await sut.findByIe('888.888.888.888'.toUpperCase());

      // Assert
      expect(client).not.toBeNull();
      expect(client?.ie).toBe('888.888.888.888');
    });
  });
});
