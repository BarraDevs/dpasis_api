import { Test } from '@nestjs/testing';
import { ClientMaintenanceTicketTypeDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/dtos/client-maintenance-ticket-type.dto';
import { CreateClientMaintenanceTicketTypeInputDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/create-client-maintenance-ticket-type/dtos/create-client-maintenance-ticket-type.dto';
import { EditClientMaintenanceTicketTypeInputDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/edit-client-maintenance-ticket-type/dtos/edit-client-maintenance-ticket-type.dto';
import { FindAllClientMaintenanceTicketTypeQueryDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-all-client-maintenance-ticket-type/dtos/find-all-client-maintenance-ticket-type.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeDaoAdapterPrisma } from './client-maintenance-ticket-type-prisma.dao';

describe('ClientMaintenanceTicketTypeDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientMaintenanceTicketTypeDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientMaintenanceTicketTypeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientMaintenanceTicketTypeDaoAdapterPrisma);
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
    it('should return empty array when no client maintenance ticket types exist', async() => {
      // Arrange
      const query: FindAllClientMaintenanceTicketTypeQueryDto = {};

      // Act
      const [clientMaintenanceTicketTypes, total] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTicketTypes).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client maintenance ticket types with default pagination', async() => {
      // Arrange
      await prisma.clientMaintenanceTicketType.createMany({
        data: [
          { name: `Tipo ${Date.now()}-1`, active: true },
          { name: `Tipo ${Date.now()}-2`, active: false },
        ],
      });
      const query: FindAllClientMaintenanceTicketTypeQueryDto = {};

      // Act
      const [clientMaintenanceTicketTypes, total] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTicketTypes).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientMaintenanceTicketType.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Tipo ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientMaintenanceTicketTypes, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientMaintenanceTicketTypes2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(clientMaintenanceTicketTypes).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientMaintenanceTicketTypes2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientMaintenanceTicketType.createMany({
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
      await prisma.clientMaintenanceTicketType.createMany({
        data: [
          { name: `Manutenção Preventiva ${Date.now()}`, active: true },
          { name: `Manutenção Corretiva ${Date.now()}`, active: true },
        ],
      });
      const query: FindAllClientMaintenanceTicketTypeQueryDto = { search: 'PREVENTIVA' };

      // Act
      const [clientMaintenanceTicketTypes, total] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTicketTypes).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientMaintenanceTicketTypes[0].name).toContain('Preventiva');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const ct1 = await prisma.clientMaintenanceTicketType.create({
        data: { name: `A-${Date.now()}`, active: true },
      });
      const ct2 = await prisma.clientMaintenanceTicketType.create({
        data: { name: `B-${Date.now()}`, active: true },
      });
      const query: FindAllClientMaintenanceTicketTypeQueryDto = {};

      // Act
      const [clientMaintenanceTicketTypes] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTicketTypes).toHaveLength(2);
      expect(clientMaintenanceTicketTypes[0].name).toBe(ct1.name);
      expect(clientMaintenanceTicketTypes[1].name).toBe(ct2.name);
    });

    it('should return all client maintenance ticket type fields correctly', async() => {
      // Arrange
      const created = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });
      const query: FindAllClientMaintenanceTicketTypeQueryDto = {};

      // Act
      const [clientMaintenanceTicketTypes] = await sut.findAll(query);

      // Assert
      expect(clientMaintenanceTicketTypes).toHaveLength(1);
      expect(clientMaintenanceTicketTypes[0]).toEqual<ClientMaintenanceTicketTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client maintenance ticket type does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client maintenance ticket type by id', async() => {
      // Arrange
      const created = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });

    it('should return all client maintenance ticket type fields correctly', async() => {
      // Arrange
      const created = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientMaintenanceTicketTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client maintenance ticket type does not exist', async() => {
      // Arrange
      await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Tipo Inexistente');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client maintenance ticket type by name', async() => {
      // Arrange
      const name = `Manutenção ${Date.now()}`;
      const created = await prisma.clientMaintenanceTicketType.create({
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

    it('should find client maintenance ticket type by name (case-insensitive)', async() => {
      // Arrange
      const name = `Manutenção ${Date.now()}`;
      const created = await prisma.clientMaintenanceTicketType.create({
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

    it('should return null if name is contained in another client maintenance ticket type name', async() => {
      // Arrange
      await prisma.clientMaintenanceTicketType.create({
        data: { name: `Manutenção 1 ${Date.now()}`, active: true },
      });
      await prisma.clientMaintenanceTicketType.create({
        data: { name: `Manutenção 2 ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Manutenção');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client maintenance ticket type and return id', async() => {
      // Arrange
      const data: CreateClientMaintenanceTicketTypeInputDto = {
        name: `Manutenção Preventiva ${Date.now()}`,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientMaintenanceTicketType.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client maintenance ticket type name', async() => {
      // Arrange
      const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });
      const data: EditClientMaintenanceTicketTypeInputDto = { name: `Nome atualizado ${Date.now()}` };

      // Act
      await sut.edit(clientMaintenanceTicketType.id, data);

      // Assert
      const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countClientTypesByMaintenanceTicketTypeId', () => {
    it('should return 0 when no client types use the maintenance ticket type', async() => {
      const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      const count = await sut.countClientTypesByMaintenanceTicketTypeId(clientMaintenanceTicketType.id);

      expect(count).toBe(0);
    });

    it('should return count when client types use the maintenance ticket type', async() => {
      const [attendanceType, maintenanceType, systemType, descriptionType, driveType] = await Promise.all([
        prisma.clientAttendanceType.create({ data: { name: `Atendimento ${Date.now()}`, active: true } }),
        prisma.clientMaintenanceTicketType.create({ data: { name: `Manutenção ${Date.now()}`, active: true } }),
        prisma.clientSystemType.create({ data: { name: `Sistema ${Date.now()}`, active: true } }),
        prisma.clientDescriptionType.create({ data: { name: `Descrição ${Date.now()}`, active: true } }),
        prisma.clientDriveType.create({ data: { name: `Drive ${Date.now()}`, active: true } }),
      ]);

      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const client = await prisma.client.create({
        data: {
          type: 'PJ',
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Test',
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: 'CONTRACT',
          generateInvoice: false,
          active: true,
        },
      });

      await prisma.clientType.create({
        data: {
          clientId: client.id,
          clientAttendanceTypeId: attendanceType.id,
          clientMaintenanceTicketTypeId: maintenanceType.id,
          clientSystemTypeId: systemType.id,
          clientDescriptionTypeId: descriptionType.id,
          clientDriveTypeId: driveType.id,
          quantity: 1,
        },
      });

      const count = await sut.countClientTypesByMaintenanceTicketTypeId(maintenanceType.id);

      expect(count).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete client maintenance ticket type from database', async() => {
      // Arrange
      const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      // Act
      await sut.delete(clientMaintenanceTicketType.id);

      // Assert
      const deleted = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client maintenance ticket type status', async() => {
      // Arrange
      const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      // Act
      await sut.updateStatus(clientMaintenanceTicketType.id, false);

      // Assert
      const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientMaintenanceTicketType.id, true);

      // Assert (again)
      const updated2 = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
