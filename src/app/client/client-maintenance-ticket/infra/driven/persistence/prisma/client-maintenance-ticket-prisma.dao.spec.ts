import { Test } from '@nestjs/testing';
import { ClientMaintenanceTicketDto } from 'src/app/client/client-maintenance-ticket/application/dtos/client-maintenance-ticket.dto';
import { CreateClientMaintenanceTicketInputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/create-client-maintenance-ticket/dtos/create-client-maintenance-ticket.dto';
import { EditClientMaintenanceTicketInputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/edit-client-maintenance-ticket/dtos/edit-client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicketQueryDto } from 'src/app/client/client-maintenance-ticket/application/usecases/find-all-client-maintenance-ticket/dtos/find-all-client-maintenance-ticket.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketDaoAdapterPrisma } from './client-maintenance-ticket-prisma.dao';

describe('ClientMaintenanceTicketDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientMaintenanceTicketDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientMaintenanceTicketDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientMaintenanceTicketDaoAdapterPrisma);
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
    it('should return empty array when no client maintenance tickets exist', async() => {
      // Arrange
      const query: FindAllClientMaintenanceTicketQueryDto = {};

      // Act
      const [clientMaintenanceTickets, total] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTickets).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client maintenance tickets with default pagination', async() => {
      // Arrange
      await prisma.clientMaintenanceTicket.createMany({
        data: [
          { name: `Nome ${Date.now()}-1`, active: true },
          { name: `Nome ${Date.now()}-2`, active: false },
        ],
      });
      const query: FindAllClientMaintenanceTicketQueryDto = {};

      // Act
      const [clientMaintenanceTickets, total] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTickets).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientMaintenanceTicket.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Nome ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientMaintenanceTickets, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientMaintenanceTickets2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(clientMaintenanceTickets).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientMaintenanceTickets2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientMaintenanceTicket.createMany({
        data: [
          { name: `Ticket Ativo ${Date.now()}`, active: true },
          { name: `Ticket Inativo ${Date.now()}`, active: false },
        ],
      });

      const [activeTypes, activeTotal] = await sut.findAll({ active: true });
      const [inactiveTypes, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeTypes).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeTypes[0].active).toBe(true);
      expect(inactiveTypes).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveTypes[0].active).toBe(false);
    });

    it('should search in name field (case-insensitive)', async() => {
      // Arrange
      await prisma.clientMaintenanceTicket.createMany({
        data: [
          { name: `Manutenção Preventiva ${Date.now()}`, active: true },
          { name: `Manutenção Corretiva ${Date.now()}`, active: true },
        ],
      });
      const query: FindAllClientMaintenanceTicketQueryDto = { search: 'PREVENTIVA' };

      // Act
      const [clientMaintenanceTickets, total] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTickets).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientMaintenanceTickets[0].name).toContain('Preventiva');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const ct1 = await prisma.clientMaintenanceTicket.create({
        data: { name: `A-${Date.now()}`, active: true },
      });
      const ct2 = await prisma.clientMaintenanceTicket.create({
        data: { name: `B-${Date.now()}`, active: true },
      });
      const query: FindAllClientMaintenanceTicketQueryDto = {};

      // Act
      const [clientMaintenanceTickets] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTickets).toHaveLength(2);
      expect(clientMaintenanceTickets[0].name).toBe(ct1.name);
      expect(clientMaintenanceTickets[1].name).toBe(ct2.name);
    });

    it('should return all client maintenance ticket fields correctly', async() => {
      // Arrange
      const created = await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome Test ${Date.now()}`, active: true },
      });
      const query: FindAllClientMaintenanceTicketQueryDto = {};

      // Act
      const [clientMaintenanceTickets] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTickets).toHaveLength(1);
      expect(clientMaintenanceTickets[0]).toEqual<ClientMaintenanceTicketDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client maintenance ticket does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client maintenance ticket by id', async() => {
      // Arrange
      const created = await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });

    it('should return all client maintenance ticket fields correctly', async() => {
      // Arrange
      const created = await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome Test ${Date.now()}`, active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientMaintenanceTicketDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client maintenance ticket does not exist', async() => {
      // Arrange
      await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Nome inexistente');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client maintenance ticket by name', async() => {
      // Arrange
      const name = `Manutenção ${Date.now()}`;
      const created = await prisma.clientMaintenanceTicket.create({
        data: { name, active: true },
      });

      // Act
      const result = await sut.findByName(created.name);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client maintenance ticket by name (case-insensitive)', async() => {
      // Arrange
      const name = `Manutenção ${Date.now()}`;
      const created = await prisma.clientMaintenanceTicket.create({
        data: { name, active: true },
      });

      // Act
      const result = await sut.findByName(name.toLowerCase());

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client maintenance ticket name', async() => {
      // Arrange
      await prisma.clientMaintenanceTicket.create({
        data: { name: `Manutenção 1 ${Date.now()}`, active: true },
      });
      await prisma.clientMaintenanceTicket.create({
        data: { name: `Manutenção 2 ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Manutenção');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client maintenance ticket and return id', async() => {
      // Arrange
      const data: CreateClientMaintenanceTicketInputDto = {
        name: `Manutenção Preventiva ${Date.now()}`,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientMaintenanceTicket.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client maintenance ticket name', async() => {
      // Arrange
      const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });
      const data: EditClientMaintenanceTicketInputDto = { name: `Nome atualizado ${Date.now()}` };

      // Act
      await sut.edit(clientMaintenanceTicket.id, data);

      // Assert
      const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client maintenance ticket from database', async() => {
      // Arrange
      const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome ${Date.now()}`, active: true },
      });

      // Act
      await sut.delete(clientMaintenanceTicket.id);

      // Assert
      const deleted = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client maintenance ticket status', async() => {
      // Arrange
      const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
        data: { name: `Nome ${Date.now()}`, active: true },
      });

      // Act
      await sut.updateStatus(clientMaintenanceTicket.id, false);

      // Assert
      const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientMaintenanceTicket.id, true);

      // Assert (again)
      const updated2 = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
