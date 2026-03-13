import { Test } from '@nestjs/testing';
import { ClientTypeDto } from 'src/app/client/client-type/client-type/application/dtos/client-type.dto';
import { CreateClientTypeInputDto } from 'src/app/client/client-type/client-type/application/usecases/create-client-type/dtos/create-client-type.dto';
import { EditClientTypeInputDto } from 'src/app/client/client-type/client-type/application/usecases/edit-client-type/dtos/edit-client-type.dto';
import { FindAllClientTypeQueryDto } from 'src/app/client/client-type/client-type/application/usecases/find-all-client-type/dtos/find-all-client-type.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientTypeDaoAdapterPrisma } from './client-type-prisma.dao';

describe('ClientTypeDaoAdapterPrisma', () => {
  let sut: ClientTypeDaoAdapterPrisma;
  let prisma: PrismaService;

  const createAllTypes = async() => {
    const attendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Attendance ${Date.now()}-${Math.random()}`, active: true },
    });
    const maintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Maintenance ${Date.now()}-${Math.random()}`, active: true },
    });
    const systemType = await prisma.clientSystemType.create({
      data: { name: `Sistema ${Date.now()}-${Math.random()}`, active: true },
    });
    const descriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Descrição ${Date.now()}-${Math.random()}`, active: true },
    });
    const driveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}-${Math.random()}`, active: true },
    });
    return { attendanceType, maintenanceTicketType, systemType, descriptionType, driveType };
  };

  const createClient = async() => {
    const group = await prisma.clientGroup.create({
      data: { name: `Grupo ${Date.now()}-${Math.random()}`, active: true },
    });
    const owner = await prisma.clientOwner.create({
      data: { name: `Owner ${Date.now()}-${Math.random()}`, active: true },
    });
    return prisma.client.create({
      data: {
        type: 'PJ',
        document: `12345678${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
  };

  const createClientTypeData = async() => {
    const client = await createClient();
    const types = await createAllTypes();
    const data = {
      clientId: client.id,
      clientAttendanceTypeId: types.attendanceType.id,
      clientMaintenanceTicketTypeId: types.maintenanceTicketType.id,
      clientSystemTypeId: types.systemType.id,
      clientDescriptionTypeId: types.descriptionType.id,
      clientDriveTypeId: types.driveType.id,
      quantity: 5,
    };
    return { client, types, data };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientTypeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientTypeDaoAdapterPrisma);
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
    it('should return empty array when no client types exist for client', async() => {
      const { client } = await createClientTypeData();
      const query: FindAllClientTypeQueryDto = { clientId: client.id };

      const [items, total] = await sut.findAll(query);

      expect(items).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return only client types for the specified clientId', async() => {
      const { client, data } = await createClientTypeData();
      const client2 = await createClient();
      await prisma.clientType.create({
        data: {
          ...data,
          clientId: client.id,
        },
      });
      await prisma.clientType.create({
        data: {
          ...data,
          clientId: client.id,
        },
      });
      const types2 = await createAllTypes();
      await prisma.clientType.create({
        data: {
          clientId: client2.id,
          clientAttendanceTypeId: types2.attendanceType.id,
          clientMaintenanceTicketTypeId: types2.maintenanceTicketType.id,
          clientSystemTypeId: types2.systemType.id,
          clientDescriptionTypeId: types2.descriptionType.id,
          clientDriveTypeId: types2.driveType.id,
          quantity: 1,
        },
      });
      const query: FindAllClientTypeQueryDto = { clientId: client.id };

      const [items, total] = await sut.findAll(query);

      expect(items).toHaveLength(2);
      expect(total).toBe(2);
      expect(items.every(i => i.clientId === client.id)).toBe(true);
    });

    it('should search by clientSystemType name (case-insensitive)', async() => {
      const { client, data } = await createClientTypeData();
      const systemTypeMatch = await prisma.clientSystemType.create({
        data: { name: 'Sistema Especial Busca', active: true },
      });
      const systemTypeNoMatch = await prisma.clientSystemType.create({
        data: { name: 'Outro Sistema', active: true },
      });
      await prisma.clientType.create({
        data: {
          ...data,
          clientSystemTypeId: systemTypeMatch.id,
        },
      });
      await prisma.clientType.create({
        data: {
          ...data,
          clientSystemTypeId: systemTypeNoMatch.id,
        },
      });
      const query: FindAllClientTypeQueryDto = { clientId: client.id, search: 'busca' };

      const [items, total] = await sut.findAll(query);

      expect(items).toHaveLength(1);
      expect(total).toBe(1);
      expect(items[0].clientSystemType.name).toBe('Sistema Especial Busca');
    });

    it('should search by clientDescriptionType name', async() => {
      const { client, data } = await createClientTypeData();
      const descMatch = await prisma.clientDescriptionType.create({
        data: { name: 'Descrição Premium', active: true },
      });
      await prisma.clientType.create({
        data: {
          ...data,
          clientDescriptionTypeId: descMatch.id,
        },
      });
      const query: FindAllClientTypeQueryDto = { clientId: client.id, search: 'premium' };

      const [items, total] = await sut.findAll(query);

      expect(items).toHaveLength(1);
      expect(items[0].clientDescriptionType.name).toBe('Descrição Premium');
      expect(total).toBe(1);
    });

    it('should search by clientDriveType name', async() => {
      const { client, data } = await createClientTypeData();
      const driveMatch = await prisma.clientDriveType.create({
        data: { name: 'Google Drive Especial', active: true },
      });
      await prisma.clientType.create({
        data: {
          ...data,
          clientDriveTypeId: driveMatch.id,
        },
      });
      const query: FindAllClientTypeQueryDto = { clientId: client.id, search: 'google' };

      const [items, total] = await sut.findAll(query);

      expect(items).toHaveLength(1);
      expect(items[0].clientDriveType.name).toBe('Google Drive Especial');
      expect(total).toBe(1);
    });

    it('should paginate results correctly', async() => {
      const { client, data } = await createClientTypeData();
      for (let i = 0; i < 5; i++) {
        await prisma.clientType.create({ data });
      }

      const [items1, total1] = await sut.findAll({ clientId: client.id, page: 1, size: 2 });
      const [items2, total2] = await sut.findAll({ clientId: client.id, page: 2, size: 2 });

      expect(items1).toHaveLength(2);
      expect(total1).toBe(5);
      expect(items2).toHaveLength(2);
      expect(total2).toBe(5);
    });

    it('should return expanded objects in response', async() => {
      const { client, types, data } = await createClientTypeData();
      const created = await prisma.clientType.create({ data });
      const query: FindAllClientTypeQueryDto = { clientId: client.id };

      const [items] = await sut.findAll(query);

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject<Partial<ClientTypeDto>>({
        id: created.id,
        clientId: client.id,
        quantity: 5,
        active: true,
      });
      expect(items[0].clientAttendanceType).toEqual({ id: types.attendanceType.id, name: types.attendanceType.name });
      expect(items[0].clientSystemType).toEqual({ id: types.systemType.id, name: types.systemType.name });
      expect(items[0].clientDriveType).toEqual({ id: types.driveType.id, name: types.driveType.name });
    });
  });

  describe('findById', () => {
    it('should return null when client type does not exist', async() => {
      const result = await sut.findById(0);
      expect(result).toBeNull();
    });

    it('should return client type by id with expanded relations', async() => {
      const { client, types, data } = await createClientTypeData();
      const created = await prisma.clientType.create({ data });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientTypeDto>({
        id: created.id,
        clientId: client.id,
        quantity: 5,
        active: true,
        clientAttendanceType: { id: types.attendanceType.id, name: types.attendanceType.name },
        clientMaintenanceTicketType: { id: types.maintenanceTicketType.id, name: types.maintenanceTicketType.name },
        clientSystemType: { id: types.systemType.id, name: types.systemType.name },
        clientDescriptionType: { id: types.descriptionType.id, name: types.descriptionType.name },
        clientDriveType: { id: types.driveType.id, name: types.driveType.name },
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('save', () => {
    it('should create client type and return id', async() => {
      const { data } = await createClientTypeData();
      const input: CreateClientTypeInputDto = data;

      const id = await sut.save(input);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
      const saved = await prisma.clientType.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.clientId).toBe(data.clientId);
      expect(saved?.quantity).toBe(data.quantity);
    });

    it('should persist in client_types table', async() => {
      const { data } = await createClientTypeData();

      const id = await sut.save(data);

      const row = await prisma.clientType.findFirst({ where: { id } });
      expect(row).not.toBeNull();
      expect(row?.clientId).toBe(data.clientId);
      expect(row?.quantity).toBe(data.quantity);
      expect(row?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update quantity', async() => {
      const { data } = await createClientTypeData();
      const created = await prisma.clientType.create({ data });
      const editData: EditClientTypeInputDto = { quantity: 10 };

      await sut.edit(created.id, editData);

      const updated = await prisma.clientType.findUnique({ where: { id: created.id } });
      expect(updated?.quantity).toBe(10);
    });
  });

  describe('delete', () => {
    it('should delete client type from database', async() => {
      const { data } = await createClientTypeData();
      const created = await prisma.clientType.create({ data });

      await sut.delete(created.id);

      const deleted = await prisma.clientType.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update active from true to false', async() => {
      const { data } = await createClientTypeData();
      const created = await prisma.clientType.create({ data });

      await sut.updateStatus(created.id, false);

      const updated = await prisma.clientType.findUnique({ where: { id: created.id } });
      expect(updated?.active).toBe(false);
    });

    it('should update active from false to true', async() => {
      const { data } = await createClientTypeData();
      const created = await prisma.clientType.create({
        data: { ...data, active: false },
      });

      await sut.updateStatus(created.id, true);

      const updated = await prisma.clientType.findUnique({ where: { id: created.id } });
      expect(updated?.active).toBe(true);
    });
  });
});
