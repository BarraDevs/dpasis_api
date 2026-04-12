import { Test } from '@nestjs/testing';
import { ClientGroupDto } from 'src/app/client/client-group/application/dtos/client-group.dto';
import { CreateClientGroupInputDto } from 'src/app/client/client-group/application/usecases/create-client-group/dtos/create-client-group.dto';
import { EditClientGroupInputDto } from 'src/app/client/client-group/application/usecases/edit-client-group/dtos/edit-client-group.dto';
import { FindAllClientGroupQueryDto } from 'src/app/client/client-group/application/usecases/find-all-client-group/dtos/find-all-client-group.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientGroupDaoAdapterPrisma } from './client-group-prisma.dao';

describe('ClientGroupDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientGroupDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientGroupDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientGroupDaoAdapterPrisma);
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
    it('should return empty array when no client groups exist', async() => {
      // Arrange
      const query: FindAllClientGroupQueryDto = {};

      // Act
      const [clientGroups, total] = await sut.findAll(query);

      // Assert
      expect(clientGroups).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client groups with default pagination', async() => {
      // Arrange
      await prisma.clientGroup.createMany({
        data: [
          { name: 'Grupo 1', active: true },
          { name: 'Grupo 2', active: false },
        ],
      });
      const query: FindAllClientGroupQueryDto = {};

      // Act
      const [clientGroups, total] = await sut.findAll(query);

      // Assert
      expect(clientGroups).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientGroup.createMany({
        data: [
          { name: 'Grupo Ativo', active: true },
          { name: 'Grupo Inativo', active: false },
        ],
      });

      const [activeGroups, activeTotal] = await sut.findAll({ active: true });
      const [inactiveGroups, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeGroups).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeGroups[0].active).toBe(true);
      expect(inactiveGroups).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveGroups[0].active).toBe(false);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientGroup.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Grupo ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientGroups, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientGroups2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(clientGroups).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientGroups2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      // Arrange
      await prisma.clientGroup.createMany({
        data: [
          { name: 'Grupo Premium', active: true },
          { name: 'Grupo Básico', active: true },
        ],
      });
      const query: FindAllClientGroupQueryDto = { search: 'premium' };

      // Act
      const [clientGroups, total] = await sut.findAll(query);

      // Assert
      expect(clientGroups).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientGroups[0].name).toBe('Grupo Premium');
    });

    it('should return results ordered by createdAt desc', async() => {
      // Arrange
      const cg1 = await prisma.clientGroup.create({
        data: { name: 'A', active: true },
      });
      const cg2 = await prisma.clientGroup.create({
        data: { name: 'B', active: true },
      });
      const query: FindAllClientGroupQueryDto = {};

      // Act
      const [clientGroups] = await sut.findAll(query);

      // Assert
      expect(clientGroups).toHaveLength(2);
      expect(clientGroups[0].name).toBe(cg1.name);
      expect(clientGroups[1].name).toBe(cg2.name);
    });

    it('should return all client group fields correctly', async() => {
      // Arrange
      const created = await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: true },
      });
      const query: FindAllClientGroupQueryDto = {};

      // Act
      const [clientGroups] = await sut.findAll(query);

      // Assert
      expect(clientGroups).toHaveLength(1);
      expect(clientGroups[0]).toEqual<ClientGroupDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client group does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client group by id', async() => {
      // Arrange
      const created = await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Grupo Test');
      expect(result?.active).toBe(true);
    });

    it('should return all client group fields correctly', async() => {
      // Arrange
      const created = await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientGroupDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client group does not exist', async() => {
      // Arrange
      await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: true },
      });

      // Act
      const result = await sut.findByName('Grupo Test 2');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client group by name', async() => {
      // Arrange
      const created = await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: true },
      });

      // Act
      const result = await sut.findByName(created.name);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client group by name (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: true },
      });

      // Act
      const result = await sut.findByName('grupo test');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return client group if name is exact match (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.clientGroup.create({
        data: { name: 'Grupo Test', active: true },
      });

      // Act
      const result = await sut.findByName(created.name);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client group name', async() => {
      // Arrange
      await prisma.clientGroup.create({
        data: { name: 'Grupo Test 1', active: true },
      });
      await prisma.clientGroup.create({
        data: { name: 'Grupo Test 2', active: true },
      });

      // Act
      const result = await sut.findByName('Grupo Test');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client group and return id', async() => {
      // Arrange
      const data: CreateClientGroupInputDto = {
        name: 'Grupo Premium',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientGroup.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client group name', async() => {
      // Arrange
      const clientGroup = await prisma.clientGroup.create({
        data: { name: 'Nome original', active: true },
      });
      const data: EditClientGroupInputDto = { name: 'Nome atualizado' };

      // Act
      await sut.edit(clientGroup.id, data);

      // Assert
      const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
      expect(updated?.name).toBe('Nome atualizado');
      expect(updated?.active).toBe(true);
    });

    it('should update client group active', async() => {
      // Arrange
      const clientGroup = await prisma.clientGroup.create({
        data: { name: 'Grupo', active: true },
      });
      const data: EditClientGroupInputDto = { name: 'Nome atualizado' };

      // Act
      await sut.edit(clientGroup.id, data);

      // Assert
      const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
      expect(updated?.name).toBe('Nome atualizado');
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client group from database', async() => {
      // Arrange
      const clientGroup = await prisma.clientGroup.create({
        data: { name: 'Grupo', active: true },
      });

      // Act
      await sut.delete(clientGroup.id);

      // Assert
      const deleted = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client group status', async() => {
      // Arrange
      const clientGroup = await prisma.clientGroup.create({
        data: { name: 'Grupo', active: true },
      });

      // Act
      await sut.updateStatus(clientGroup.id, false);

      // Assert
      const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientGroup.id, true);

      // Assert (again)
      const updated2 = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
      expect(updated2?.active).toBe(true);
    });
  });

  describe('countClientsByGroupId', () => {
    it('should return 0 when no clients exist for the group', async() => {
      // Arrange
      const group = await prisma.clientGroup.create({
        data: { name: 'Grupo Sem Clientes', active: true },
      });
      const owner = await prisma.clientOwner.create({
        data: { name: 'Owner', active: true },
      });
      await prisma.client.create({
        data: {
          id: 1,
          type: 'PJ',
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: 'CONTRACT',
          generateInvoice: true,
          active: true,
        },
      });

      const otherGroup = await prisma.clientGroup.create({
        data: { name: 'Outro Grupo', active: true },
      });

      // Act
      const count = await sut.countClientsByGroupId(otherGroup.id);

      // Assert
      expect(count).toBe(0);
    });

    it('should return correct count of clients for the group', async() => {
      // Arrange
      const group = await prisma.clientGroup.create({
        data: { name: 'Grupo Com Clientes', active: true },
      });
      const owner = await prisma.clientOwner.create({
        data: { name: 'Owner', active: true },
      });
      await prisma.client.createMany({
        data: [
          {
            id: 1,
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
            id: 2,
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
      const count = await sut.countClientsByGroupId(group.id);

      // Assert
      expect(count).toBe(2);
    });
  });
});
