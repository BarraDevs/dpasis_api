import { Test } from '@nestjs/testing';
import { ClientOwnerDto } from 'src/app/client/client-owner/application/dtos/client-owner.dto';
import { CreateClientOwnerInputDto } from 'src/app/client/client-owner/application/usecases/create-client-owner/dtos/create-client-owner.dto';
import { EditClientOwnerInputDto } from 'src/app/client/client-owner/application/usecases/edit-client-owner/dtos/edit-client-owner.dto';
import { FindAllClientOwnerQueryDto } from 'src/app/client/client-owner/application/usecases/find-all-client-owner/dtos/find-all-client-owner.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientOwnerDaoAdapterPrisma } from './client-owner-prisma.dao';

describe('ClientOwnerDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientOwnerDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientOwnerDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientOwnerDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no client owners exist', async() => {
      // Arrange
      const query: FindAllClientOwnerQueryDto = {};

      // Act
      const [clientOwners, total] = await sut.findAll(query);

      // Assert
      expect(clientOwners).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client owners with default pagination', async() => {
      // Arrange
      await prisma.clientOwner.createMany({
        data: [
          { name: 'Proprietário 1', active: true },
          { name: 'Proprietário 2', active: false },
        ],
      });
      const query: FindAllClientOwnerQueryDto = {};

      // Act
      const [clientOwners, total] = await sut.findAll(query);

      // Assert
      expect(clientOwners).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientOwner.createMany({
        data: [
          { name: 'Owner Ativo', active: true },
          { name: 'Owner Inativo', active: false },
        ],
      });

      const [activeOwners, activeTotal] = await sut.findAll({ active: true });
      const [inactiveOwners, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeOwners).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeOwners[0].active).toBe(true);
      expect(inactiveOwners).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveOwners[0].active).toBe(false);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientOwner.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Proprietário ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientOwners, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientOwners2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(clientOwners).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientOwners2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      // Arrange
      await prisma.clientOwner.createMany({
        data: [
          { name: 'Proprietário Premium', active: true },
          { name: 'Proprietário Básico', active: true },
        ],
      });
      const query: FindAllClientOwnerQueryDto = { search: 'premium' };

      // Act
      const [clientOwners, total] = await sut.findAll(query);

      // Assert
      expect(clientOwners).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientOwners[0].name).toBe('Proprietário Premium');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const co1 = await prisma.clientOwner.create({
        data: { name: 'A', active: true },
      });
      const co2 = await prisma.clientOwner.create({
        data: { name: 'B', active: true },
      });
      const query: FindAllClientOwnerQueryDto = {};

      // Act
      const [clientOwners] = await sut.findAll(query);

      // Assert
      expect(clientOwners).toHaveLength(2);
      expect(clientOwners[0].name).toBe(co1.name);
      expect(clientOwners[1].name).toBe(co2.name);
    });

    it('should return all client owner fields correctly', async() => {
      // Arrange
      const created = await prisma.clientOwner.create({
        data: { name: 'Proprietário Test', active: true },
      });
      const query: FindAllClientOwnerQueryDto = {};

      // Act
      const [clientOwners] = await sut.findAll(query);

      // Assert
      expect(clientOwners).toHaveLength(1);
      expect(clientOwners[0]).toEqual<ClientOwnerDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client owner does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client owner by id', async() => {
      // Arrange
      const created = await prisma.clientOwner.create({
        data: { name: 'Proprietário Test', active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Proprietário Test');
      expect(result?.active).toBe(true);
    });

    it('should return all client owner fields correctly', async() => {
      // Arrange
      const created = await prisma.clientOwner.create({
        data: { name: 'Proprietário Test', active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientOwnerDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client owner does not exist', async() => {
      // Arrange
      await prisma.clientOwner.create({
        data: { name: 'Proprietário Test', active: true },
      });

      // Act
      const result = await sut.findByName('Proprietário Test 2');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client owner by name', async() => {
      // Arrange
      const created = await prisma.clientOwner.create({
        data: { name: 'Proprietário Test', active: true },
      });

      // Act
      const result = await sut.findByName(created.name);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client owner by name (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.clientOwner.create({
        data: { name: 'Proprietário Test', active: true },
      });

      // Act
      const result = await sut.findByName('proprietário test');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client owner name', async() => {
      // Arrange
      await prisma.clientOwner.create({
        data: { name: 'Proprietário Test 1', active: true },
      });
      await prisma.clientOwner.create({
        data: { name: 'Proprietário Test 2', active: true },
      });

      // Act
      const result = await sut.findByName('Proprietário Test');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client owner and return id', async() => {
      // Arrange
      const data: CreateClientOwnerInputDto = {
        name: 'Proprietário Premium',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientOwner.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client owner name', async() => {
      // Arrange
      const clientOwner = await prisma.clientOwner.create({
        data: { name: 'Nome original', active: true },
      });
      const data: EditClientOwnerInputDto = { name: 'Nome atualizado' };

      // Act
      await sut.edit(clientOwner.id, data);

      // Assert
      const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
      expect(updated?.name).toBe('Nome atualizado');
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client owner from database', async() => {
      // Arrange
      const clientOwner = await prisma.clientOwner.create({
        data: { name: 'Proprietário', active: true },
      });

      // Act
      await sut.delete(clientOwner.id);

      // Assert
      const deleted = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client owner status', async() => {
      // Arrange
      const clientOwner = await prisma.clientOwner.create({
        data: { name: 'Proprietário', active: true },
      });

      // Act
      await sut.updateStatus(clientOwner.id, false);

      // Assert
      const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientOwner.id, true);

      // Assert (again)
      const updated2 = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
      expect(updated2?.active).toBe(true);
    });
  });

  describe('countClientsByOwnerId', () => {
    it('should return 0 when no clients exist for the owner', async() => {
      // Arrange
      const group = await prisma.clientGroup.create({
        data: { name: 'Grupo', active: true },
      });
      const ownerWithClients = await prisma.clientOwner.create({
        data: { name: 'Owner Com Clientes', active: true },
      });
      const ownerWithoutClients = await prisma.clientOwner.create({
        data: { name: 'Owner Sem Clientes', active: true },
      });
      await prisma.client.create({
        data: {
          type: 'PJ',
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          ownerId: ownerWithClients.id,
          companyName: 'Empresa',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: 'CONTRACT',
          generateInvoice: true,
          active: true,
        },
      });

      // Act
      const count = await sut.countClientsByOwnerId(ownerWithoutClients.id);

      // Assert
      expect(count).toBe(0);
    });

    it('should return correct count of clients for the owner', async() => {
      // Arrange
      const group = await prisma.clientGroup.create({
        data: { name: 'Grupo', active: true },
      });
      const owner = await prisma.clientOwner.create({
        data: { name: 'Owner Com Clientes', active: true },
      });
      await prisma.client.createMany({
        data: [
          {
            type: 'PJ',
            document: '09748165000110',
            ie: null,
            groupId: group.id,
            ownerId: owner.id,
            companyName: 'Empresa 1',
            fantasyName: null,
            headquarters: 'SP',
            invoiceType: 'CONTRACT',
            generateInvoice: true,
            active: true,
          },
          {
            type: 'PJ',
            document: '11111111000111',
            ie: null,
            groupId: group.id,
            ownerId: owner.id,
            companyName: 'Empresa 2',
            fantasyName: null,
            headquarters: 'RJ',
            invoiceType: 'CONTRACT',
            generateInvoice: true,
            active: true,
          },
        ],
      });

      // Act
      const count = await sut.countClientsByOwnerId(owner.id);

      // Assert
      expect(count).toBe(2);
    });
  });
});
