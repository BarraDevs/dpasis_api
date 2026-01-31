import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { ClientPersistenceModule } from 'src/app/client/application/persistence/client-persistence.module';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDaoAdapterPrisma } from './client.dao';

describe('ClientDaoAdapterPrisma', () => {
  let sut: ClientDaoAdapterPrisma;
  let prisma: PrismaService;
  let company01: Company;
  let company02: Company;
  let company03: Company;

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

    await prisma.truncate();

    company01 = await prisma.company.create({
      data: {
        name: 'name teste',
        fantasyName: 'fantasyName teste',
        document: 'document teste',
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
        name: 'name teste 02',
        fantasyName: 'fantasyName teste 02',
        document: 'document teste 02',
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

    company03 = await prisma.company.create({
      data: {
        name: 'name teste 03',
        fantasyName: 'fantasyName teste 03',
        document: 'document teste 03',
        ie: 'ie teste 03',
        zipCode: 'zipCode teste 03',
        street: 'street teste 03',
        number: 'number teste 03',
        neighborhood: 'neighborhood teste 03',
        city: 'city teste 03',
        state: 'state teste 03',
        phone01: 'phone01 teste 03',
        email01: 'email01 teste 03',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Seed test data with diverse values for comprehensive testing
      await prisma.client.create({
        data: {
          id: 'client-1',
          kind: 'PJ',
          cnpj: '11.111.111/0001-11',
          ie: '111.111.111.111',
          group: 'Group Technology',
          type: 'Premium',
          generateInvoice: true,
          companyName: 'Alpha Tech Solutions',
          fantasyName: 'Alpha Tech',
          owner: 'John Alpha Smith',
          headquarters: 'Main Office Alpha São Paulo',
          active: true,
          createdAt: new Date('2023-01-01T10:00:00Z'),
          companies: {
            connect: { id: company01.id },
          },
        },
      });
      await prisma.client.create({
        data: {
          id: 'client-2',
          kind: 'PF',
          cnpj: '22.222.222/0001-22',
          ie: '222.222.222.222',
          group: 'Group Industrial',
          type: 'Basic',
          generateInvoice: false,
          companyName: 'Beta Industries Inc',
          fantasyName: 'Beta Industries',
          owner: 'Jane Beta Santos',
          headquarters: 'Branch Office Beta Rio de Janeiro',
          active: true,
          createdAt: new Date('2023-02-01T10:00:00Z'),
          companies: {
            connect: { id: company01.id },
          },
        },
      });
      await prisma.client.create({
        data: {
          id: 'client-3',
          kind: 'PJ',
          cnpj: '33.333.333/0001-33',
          ie: '333.333.333.333',
          group: 'Group Technology',
          type: 'Premium',
          generateInvoice: true,
          companyName: 'Gamma Corporation Ltd',
          fantasyName: 'Gamma Corp',
          owner: 'Robert Gamma Johnson',
          headquarters: 'Headquarters Gamma Belo Horizonte',
          active: false,
          createdAt: new Date('2023-03-01T10:00:00Z'),
          companies: {
            connect: { id: company01.id },
          },
        },
      });
      await prisma.client.create({
        data: {
          id: 'client-4',
          kind: 'PJ',
          cnpj: '44.444.444/0001-44',
          ie: '444.444.444.444',
          group: 'Group Services',
          type: 'Standard',
          generateInvoice: true,
          companyName: 'Delta Services Ltd',
          fantasyName: 'Delta Services',
          owner: 'Sarah Delta Williams',
          headquarters: 'Office Delta Porto Alegre',
          active: true,
          createdAt: new Date('2023-04-01T10:00:00Z'),
          companies: {
            connect: { id: company02.id },
          },
        },
      });
      await prisma.client.create({
        data: {
          id: 'client-5',
          kind: 'PF',
          cnpj: '55.555.555/0001-55',
          ie: '555.555.555.555',
          group: 'Group Consulting',
          type: 'Basic',
          generateInvoice: false,
          companyName: 'Echo Consulting Solutions',
          fantasyName: 'Echo Consulting',
          owner: 'Mike Echo Brown',
          headquarters: 'Echo Office Recife',
          active: true,
          createdAt: new Date('2023-05-01T10:00:00Z'),
          companies: {
            connect: { id: company02.id },
          },
        },
      });
      await prisma.client.create({
        data: {
          id: 'client-6',
          kind: 'PJ',
          cnpj: '66.666.666/0001-66',
          ie: '666.666.666.666',
          group: 'Group Industrial',
          type: 'Premium',
          generateInvoice: true,
          companyName: 'Foxtrot Manufacturing Corp',
          fantasyName: 'Foxtrot Manufacturing',
          owner: 'Lisa Foxtrot Davis',
          headquarters: 'Manufacturing Plant Foxtrot Salvador',
          active: false,
          createdAt: new Date('2023-06-01T10:00:00Z'),
          companies: {
            connect: [
              { id: company01.id },
              { id: company03.id },
            ],
          },
        },
      });
    });

    it('should return all clients when no filters are provided', async() => {
      // Arrange
      const query: FindAllClientQueryDto = {};

      // Act
      const [clients, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(6);
      expect(clients).toHaveLength(6);

      // Should be ordered by createdAt desc (most recent first)
      expect(clients[0].id).toBe('client-6');
      expect(clients[1].id).toBe('client-5');
      expect(clients[2].id).toBe('client-4');
      expect(clients[3].id).toBe('client-3');
      expect(clients[4].id).toBe('client-2');
      expect(clients[5].id).toBe('client-1');
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
      expect(total).toBe(6);
      expect(clients).toHaveLength(2);
      expect(clients[0].id).toBe('client-4');
      expect(clients[1].id).toBe('client-3');
    });

    describe('Individual filter tests', () => {
      describe('by kind', () => {
        it('should filter by kind - PJ', async() => {
        // Arrange
          const query: FindAllClientQueryDto = {
            kind: 'PJ',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(4); // clients 1, 3, 4, 6
          expect(clients).toHaveLength(4);
          clients.forEach(client => {
            expect(client.kind).toBe('PJ');
          });
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-1', 'client-3', 'client-4', 'client-6']);
        });

        it('should filter by kind - PF', async() => {
        // Arrange
          const query: FindAllClientQueryDto = {
            kind: 'PF',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(2); // clients 2, 5
          expect(clients).toHaveLength(2);
          clients.forEach(client => {
            expect(client.kind).toBe('PF');
          });
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-2', 'client-5']);
        });
      });

      describe('by cnpj', () => {
        it('should filter by cnpj - exact match', async() => {
        // Arrange
          const query: FindAllClientQueryDto = {
            cnpj: '11.111.111/0001-11',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1);
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-1');
          expect(clients[0].cnpj).toBe('11.111.111/0001-11');
        });

        it('should filter by cnpj - partial match', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            cnpj: '11.111.111',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1);
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-1');
          expect(clients[0].cnpj).toBe('11.111.111/0001-11');
        });
      });

      describe('by ie', () => {
        it('should filter by ie - exact match', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            ie: '333.333.333.333',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1);
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-3');
          expect(clients[0].ie).toBe('333.333.333.333');
        });

        it('should filter by ie - partial match', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            ie: '333.333',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1);
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-3');
          expect(clients[0].ie).toBe('333.333.333.333');
        });
      });

      describe('by group', () => {
        it('should filter by group - Technology', async() => {
        // Arrange
          const query: FindAllClientQueryDto = {
            group: 'Technology',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(2); // clients 1, 3
          expect(clients).toHaveLength(2);
          clients.forEach(client => {
            expect(client.group).toContain('Technology');
          });
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-1', 'client-3']);
        });

        it('should filter by group - Industrial', async() => {
        // Arrange
          const query: FindAllClientQueryDto = {
            group: 'Industrial',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(2); // clients 2, 6
          expect(clients).toHaveLength(2);
          clients.forEach(client => {
            expect(client.group).toContain('Industrial');
          });
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-2', 'client-6']);
        });
      });

      describe('by type', () => {
        it('should filter by type - Premium', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            type: 'Premium',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(3); // clients 1, 3, 6
          expect(clients).toHaveLength(3);
          clients.forEach(client => {
            expect(client.type).toBe('Premium');
          });
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-1', 'client-3', 'client-6']);
        });

        it('should filter by type - Basic', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            type: 'Basic',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(2); // clients 2, 5
          expect(clients).toHaveLength(2);
          clients.forEach(client => {
            expect(client.type).toBe('Basic');
          });
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-2', 'client-5']);
        });
      });

      describe('by companyName', () => {
        it('should filter by companyName - Ltd', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            companyName: 'Ltd',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(2); // clients 3, 4
          expect(clients).toHaveLength(2);
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-3', 'client-4']);
        });
      });

      describe('by fantasyName', () => {
        it('should filter by fantasyName - Tech', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            fantasyName: 'Tech',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1); // Alpha Tech
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-1');
          expect(clients[0].fantasyName).toBe('Alpha Tech');
        });
      });

      describe('by owner', () => {
        it('should filter by owner - Smith', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            owner: 'Smith',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1); // John Alpha Smith
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-1');
          expect(clients[0].owner).toBe('John Alpha Smith');
        });
      });

      describe('by headquarters', () => {
        it('should filter by headquarters - São Paulo', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            headquarters: 'São Paulo',
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(1); // Main Office Alpha São Paulo
          expect(clients).toHaveLength(1);
          expect(clients[0].id).toBe('client-1');
          expect(clients[0].headquarters).toBe('Main Office Alpha São Paulo');
        });
      });

      describe('by companyIds', () => {
        it('should filter by companyIds', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            companyIds: [company01.id],
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(4); // clients 1, 2, 3, 6
          expect(clients).toHaveLength(4);
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-1', 'client-2', 'client-3', 'client-6']);
        });

        it('should filter by multiple companyIds', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            companyIds: [company01.id, company02.id],
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(6); // clients 1, 2, 3, 4, 5, 6
          expect(clients).toHaveLength(6);
          const clientIds = clients.map(c => c.id).sort();
          expect(clientIds).toEqual(['client-1', 'client-2', 'client-3', 'client-4', 'client-5', 'client-6']);
        });

        it('should return empty when no clients match the companyIds', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            companyIds: ['non-existent-company-id'],
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(0);
          expect(clients).toHaveLength(0);
        });
      });

      describe('by active status', () => {
        it('should filter by active = true', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            active: true,
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(4); // clients 1, 2, 4, 5
          expect(clients).toHaveLength(4);
          clients.forEach(client => {
            expect(client.active).toBe(true);
          });
        });

        it('should filter by active = false', async() => {
          // Arrange
          const query: FindAllClientQueryDto = {
            active: false,
          };

          // Act
          const [clients, total] = await sut.findAll(query);

          // Assert
          expect(total).toBe(2); // clients 3, 6
          expect(clients).toHaveLength(2);
          clients.forEach(client => {
            expect(client.active).toBe(false);
          });
        });
      });
    });

    describe('Case insensitive filter tests', () => {
      it('should handle case insensitive search for kind', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          kind: 'pj',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(4);
        clients.forEach(client => {
          expect(client.kind).toBe('PJ');
        });
      });

      it('should handle case insensitive search for group', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          group: 'technology',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        const clientIds = clients.map(c => c.id).sort();
        expect(clientIds).toEqual(['client-1', 'client-3']);
      });

      it('should handle case insensitive search for companyName', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          companyName: 'ALPHA',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(clients[0].companyName).toBe('Alpha Tech Solutions');
      });

      it('should handle case insensitive search for owner', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          owner: 'JANE',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(clients[0].owner).toBe('Jane Beta Santos');
      });
    });

    describe('Combined filter tests', () => {
      it('should filter by kind AND type', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          kind: 'PJ',
          type: 'Premium',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3); // clients 1, 3, 6 (all PJ and Premium)
        expect(clients).toHaveLength(3);
        clients.forEach(client => {
          expect(client.kind).toBe('PJ');
          expect(client.type).toBe('Premium');
        });
      });

      it('should filter by group AND type', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          group: 'Technology',
          type: 'Premium',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2); // clients 1, 3
        expect(clients).toHaveLength(2);
        const clientIds = clients.map(c => c.id).sort();
        expect(clientIds).toEqual(['client-1', 'client-3']);
      });

      it('should filter by companyName AND owner', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          companyName: 'Beta',
          owner: 'Santos',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1); // client-2
        expect(clients).toHaveLength(1);
        expect(clients[0].id).toBe('client-2');
      });

      it('should filter by multiple string fields', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          companyName: 'Manufacturing',
          fantasyName: 'Foxtrot',
          headquarters: 'Salvador',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1); // client-6
        expect(clients).toHaveLength(1);
        expect(clients[0].id).toBe('client-6');
      });

      it('should return empty when filters do not match any client', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          kind: 'PJ',
          type: 'Basic', // No PJ clients have Basic type
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(clients).toHaveLength(0);
      });

      it('should filter by exact CNPJ AND IE', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          cnpj: '44.444.444/0001-44',
          ie: '444.444.444.444',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1); // client-4
        expect(clients).toHaveLength(1);
        expect(clients[0].id).toBe('client-4');
      });
    });

    describe('Pagination with filters', () => {
      it('should combine pagination with kind filter', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          kind: 'PJ',
          page: 1,
          size: 2,
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(4); // Total PJ clients
        expect(clients).toHaveLength(2); // Page size
        // Should return first 2 PJ clients (ordered by createdAt desc)
        expect(clients[0].id).toBe('client-6');
        expect(clients[1].id).toBe('client-4');
      });

      it('should combine pagination with multiple filters', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          type: 'Premium',
          page: 1,
          size: 2,
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3); // Total Premium clients
        expect(clients).toHaveLength(2); // Page size
        // Should return first 2 Premium clients (ordered by createdAt desc)
        expect(clients[0].id).toBe('client-6');
        expect(clients[1].id).toBe('client-3');
      });

      it('should handle pagination beyond available results', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          kind: 'PF',
          page: 3,
          size: 2,
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2); // Total PF clients
        expect(clients).toHaveLength(0); // No results on page 3
      });
    });

    describe('Edge cases and special scenarios', () => {
      it('should return empty result when filtering by non-existent value', async() => {
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

      it('should handle empty string filters', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          companyName: '',
          fantasyName: '',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(6); // Should return all clients (empty strings are ignored)
        expect(clients).toHaveLength(6);
      });

      it('should handle undefined filters mixed with valid ones', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          kind: 'PJ',
          companyName: undefined,
          type: 'Premium',
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3); // PJ AND Premium clients
        expect(clients).toHaveLength(3);
      });

      it('should handle partial matches correctly', async() => {
        // Arrange
        const query: FindAllClientQueryDto = {
          headquarters: 'Office', // Should match multiple headquarters
        };

        // Act
        const [clients, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(4); // Main Office Alpha, Branch Office Beta, Office Delta, Echo Office
        expect(clients).toHaveLength(4);
        const clientIds = clients.map(c => c.id).sort();
        expect(clientIds).toEqual(['client-1', 'client-2', 'client-4', 'client-5']);
      });
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

      await prisma.client.create({ data: { ...clientData, companies: { connect: { id: company01.id } } } });

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

      await prisma.client.create({ data: { ...clientData, companies: { connect: { id: company01.id } } } });

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

      await prisma.client.create({ data: { ...clientData, companies: { connect: { id: company01.id } } } });

      // Act
      const client = await sut.findByCnpj('66.666.666/0001-66'.toUpperCase());

      // Assert
      expect(client).not.toBeNull();
      expect(client?.cnpj).toBe('66.666.666/0001-66');
    });
  });
});
