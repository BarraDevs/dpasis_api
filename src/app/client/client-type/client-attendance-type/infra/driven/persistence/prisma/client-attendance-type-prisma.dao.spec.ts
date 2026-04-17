import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAttendanceTypeDto } from 'src/app/client/client-type/client-attendance-type/application/dtos/client-attendance-type.dto';
import { CreateClientAttendanceTypeInputDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/create-client-attendance-type/dtos/create-client-attendance-type.dto';
import { EditClientAttendanceTypeInputDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/edit-client-attendance-type/dtos/edit-client-attendance-type.dto';
import { FindAllClientAttendanceTypeQueryDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-all-client-attendance-type/dtos/find-all-client-attendance-type.dto';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceTypeDaoAdapterPrisma } from './client-attendance-type-prisma.dao';

describe('ClientAttendanceTypeDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientAttendanceTypeDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientAttendanceTypeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientAttendanceTypeDaoAdapterPrisma);
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
    it('should return empty array when no client attendance types exist', async() => {
      // Arrange
      const query: FindAllClientAttendanceTypeQueryDto = {};

      // Act
      const [clientAttendanceTypes, total] = await sut.findAll(query);

      // Assert
      expect(clientAttendanceTypes).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client attendance types with default pagination', async() => {
      // Arrange
      await prisma.clientAttendanceType.createMany({
        data: [
          { name: `Tipo ${Date.now()}-1`, active: true },
          { name: `Tipo ${Date.now()}-2`, active: false },
        ],
      });
      const query: FindAllClientAttendanceTypeQueryDto = {};

      // Act
      const [clientAttendanceTypes, total] = await sut.findAll(query);

      // Assert
      expect(clientAttendanceTypes).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientAttendanceType.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Tipo ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientAttendanceTypes, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientAttendanceTypes2, total2] = await sut.findAll({ page: 3, size: 10 });
      const [clientAttendanceTypes3, total3] = await sut.findAll({ page: 4, size: 10 });

      // Assert
      expect(clientAttendanceTypes).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientAttendanceTypes2).toHaveLength(5);
      expect(total2).toBe(25);
      expect(clientAttendanceTypes3).toHaveLength(0);
      expect(total3).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientAttendanceType.createMany({
        data: [
          { name: `Attendance Ativo ${Date.now()}`, active: true },
          { name: `Attendance Inativo ${Date.now()}`, active: false },
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
      await prisma.clientAttendanceType.createMany({
        data: [
          { name: `Suporte Técnico ${Date.now()}`, active: true },
          { name: `Suporte Comercial ${Date.now()}`, active: true },
        ],
      });
      const query: FindAllClientAttendanceTypeQueryDto = { search: 'TÉCNICO' };

      // Act
      const [clientAttendanceTypes, total] = await sut.findAll(query);

      // Assert
      expect(clientAttendanceTypes).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientAttendanceTypes[0].name).toContain('Técnico');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const ct1 = await prisma.clientAttendanceType.create({
        data: { name: `A-${Date.now()}`, active: true },
      });
      const ct2 = await prisma.clientAttendanceType.create({
        data: { name: `B-${Date.now()}`, active: true },
      });
      const query: FindAllClientAttendanceTypeQueryDto = {};

      // Act
      const [clientAttendanceTypes] = await sut.findAll(query);

      // Assert
      expect(clientAttendanceTypes).toHaveLength(2);
      expect(clientAttendanceTypes[0].name).toBe(ct1.name);
      expect(clientAttendanceTypes[1].name).toBe(ct2.name);
    });

    it('should return all client attendance type fields correctly', async() => {
      // Arrange
      const created = await prisma.clientAttendanceType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });
      const query: FindAllClientAttendanceTypeQueryDto = {};

      // Act
      const [clientAttendanceTypes] = await sut.findAll(query);

      // Assert
      expect(clientAttendanceTypes).toHaveLength(1);
      expect(clientAttendanceTypes[0]).toEqual<ClientAttendanceTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client attendance type does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client attendance type by id', async() => {
      // Arrange
      const created = await prisma.clientAttendanceType.create({
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

    it('should return all client attendance type fields correctly', async() => {
      // Arrange
      const created = await prisma.clientAttendanceType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientAttendanceTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client attendance type does not exist', async() => {
      // Arrange
      await prisma.clientAttendanceType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Tipo Inexistente');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client attendance type by name', async() => {
      // Arrange
      const name = `Suporte ${Date.now()}`;
      const created = await prisma.clientAttendanceType.create({
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

    it('should find client attendance type by name (case-insensitive)', async() => {
      // Arrange
      const name = `Suporte ${Date.now()}`;
      const created = await prisma.clientAttendanceType.create({
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

    it('should return null if name is contained in another client attendance type name', async() => {
      // Arrange
      await prisma.clientAttendanceType.create({
        data: { name: `Suporte 1 ${Date.now()}`, active: true },
      });
      await prisma.clientAttendanceType.create({
        data: { name: `Suporte 2 ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Suporte');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client attendance type and return id', async() => {
      // Arrange
      const data: CreateClientAttendanceTypeInputDto = {
        name: `Suporte Técnico ${Date.now()}`,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientAttendanceType.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client attendance type name', async() => {
      // Arrange
      const clientAttendanceType = await prisma.clientAttendanceType.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });
      const data: EditClientAttendanceTypeInputDto = { name: `Nome atualizado ${Date.now()}` };

      // Act
      await sut.edit(clientAttendanceType.id, data);

      // Assert
      const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countClientTypesByAttendanceTypeId', () => {
    it('should return 0 when no client types use the attendance type', async() => {
      const clientAttendanceType = await prisma.clientAttendanceType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      const count = await sut.countClientTypesByAttendanceTypeId(clientAttendanceType.id);

      expect(count).toBe(0);
    });

    it('should return count when client types use the attendance type', async() => {
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
          id: 1,
          type: ClientType.PJ,
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Test',
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: false,
          active: true,
        },
      });

      const clientAddress = await prisma.clientAddress.create({
        data: {
          clientId: client.id,
          type: ClientAddressType.MAIN,
          zipCode: '01310-100',
          street: 'Av. Teste',
          number: '100',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
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
          clientAddressId: clientAddress.id,
          quantity: 1,
        },
      });

      const count = await sut.countClientTypesByAttendanceTypeId(attendanceType.id);

      expect(count).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete client attendance type from database', async() => {
      // Arrange
      const clientAttendanceType = await prisma.clientAttendanceType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      // Act
      await sut.delete(clientAttendanceType.id);

      // Assert
      const deleted = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client attendance type status', async() => {
      // Arrange
      const clientAttendanceType = await prisma.clientAttendanceType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      // Act
      await sut.updateStatus(clientAttendanceType.id, false);

      // Assert
      const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientAttendanceType.id, true);

      // Assert (again)
      const updated2 = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
