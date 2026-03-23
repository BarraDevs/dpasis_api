import { Test } from '@nestjs/testing';
import { ClientDescriptionTypeDto } from 'src/app/client/client-type/client-description-type/application/dtos/client-description-type.dto';
import { CreateClientDescriptionTypeInputDto } from 'src/app/client/client-type/client-description-type/application/usecases/create-client-description-type/dtos/create-client-description-type.dto';
import { EditClientDescriptionTypeInputDto } from 'src/app/client/client-type/client-description-type/application/usecases/edit-client-description-type/dtos/edit-client-description-type.dto';
import { FindAllClientDescriptionTypeQueryDto } from 'src/app/client/client-type/client-description-type/application/usecases/find-all-client-description-type/dtos/find-all-client-description-type.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeDaoAdapterPrisma } from './client-description-type-prisma.dao';

describe('ClientDescriptionTypeDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientDescriptionTypeDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDescriptionTypeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientDescriptionTypeDaoAdapterPrisma);
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
    it('should return empty array when no client description types exist', async() => {
      const query: FindAllClientDescriptionTypeQueryDto = {};

      const [clientDescriptionTypes, total] = await sut.findAll(query);

      expect(clientDescriptionTypes).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client description types with default pagination', async() => {
      await prisma.clientDescriptionType.createMany({
        data: [
          { name: `Tipo ${Date.now()}-1`, active: true },
          { name: `Tipo ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllClientDescriptionTypeQueryDto = {};
      const [clientDescriptionTypes, total] = await sut.findAll(query);

      expect(clientDescriptionTypes).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.clientDescriptionType.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Tipo ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [clientDescriptionTypes, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientDescriptionTypes2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(clientDescriptionTypes).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientDescriptionTypes2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientDescriptionType.createMany({
        data: [
          { name: `Desc Ativo ${Date.now()}`, active: true },
          { name: `Desc Inativo ${Date.now()}`, active: false },
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
      await prisma.clientDescriptionType.createMany({
        data: [
          { name: `Descrição ERP ${Date.now()}`, active: true },
          { name: `Descrição CRM ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllClientDescriptionTypeQueryDto = { search: 'erp' };
      const [clientDescriptionTypes, total] = await sut.findAll(query);

      expect(clientDescriptionTypes).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientDescriptionTypes[0].name).toContain('ERP');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.clientDescriptionType.create({
        data: { name: `A-${Date.now()}`, active: true },
      });
      const ct2 = await prisma.clientDescriptionType.create({
        data: { name: `B-${Date.now()}`, active: true },
      });

      const query: FindAllClientDescriptionTypeQueryDto = {};
      const [clientDescriptionTypes] = await sut.findAll(query);

      expect(clientDescriptionTypes).toHaveLength(2);
      expect(clientDescriptionTypes[0].name).toBe(ct1.name);
      expect(clientDescriptionTypes[1].name).toBe(ct2.name);
    });

    it('should return all client description type fields correctly', async() => {
      const created = await prisma.clientDescriptionType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      const query: FindAllClientDescriptionTypeQueryDto = {};
      const [clientDescriptionTypes] = await sut.findAll(query);

      expect(clientDescriptionTypes).toHaveLength(1);
      expect(clientDescriptionTypes[0]).toEqual<ClientDescriptionTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client description type does not exist', async() => {
      const result = await sut.findById(0);
      expect(result).toBeNull();
    });

    it('should return client description type by id', async() => {
      const created = await prisma.clientDescriptionType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });

    it('should return all client description type fields correctly', async() => {
      const created = await prisma.clientDescriptionType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: false },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientDescriptionTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client description type does not exist', async() => {
      await prisma.clientDescriptionType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      const result = await sut.findByName('Tipo Inexistente');

      expect(result).toBeNull();
    });

    it('should return client description type by name', async() => {
      const name = `Descrição ${Date.now()}`;
      const created = await prisma.clientDescriptionType.create({
        data: { name, active: true },
      });

      const result = await sut.findByName(created.name);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client description type by name (case-insensitive)', async() => {
      const name = `Descrição ${Date.now()}`;
      const created = await prisma.clientDescriptionType.create({
        data: { name, active: true },
      });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client description type name', async() => {
      await prisma.clientDescriptionType.create({
        data: { name: `Descrição 1 ${Date.now()}`, active: true },
      });
      await prisma.clientDescriptionType.create({
        data: { name: `Descrição 2 ${Date.now()}`, active: true },
      });

      const result = await sut.findByName('Descrição');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client description type and return id', async() => {
      const data: CreateClientDescriptionTypeInputDto = {
        name: `Descrição ERP ${Date.now()}`,
      };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientDescriptionType.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client description type name', async() => {
      const clientDescriptionType = await prisma.clientDescriptionType.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditClientDescriptionTypeInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(clientDescriptionType.id, data);

      const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countClientTypesByDescriptionTypeId', () => {
    it('should return 0 when no client types use the description type', async() => {
      const clientDescriptionType = await prisma.clientDescriptionType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      const count = await sut.countClientTypesByDescriptionTypeId(clientDescriptionType.id);

      expect(count).toBe(0);
    });

    it('should return count when client types use the description type', async() => {
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

      const count = await sut.countClientTypesByDescriptionTypeId(descriptionType.id);

      expect(count).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete client description type from database', async() => {
      const clientDescriptionType = await prisma.clientDescriptionType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      await sut.delete(clientDescriptionType.id);

      const deleted = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client description type status', async() => {
      const clientDescriptionType = await prisma.clientDescriptionType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      await sut.updateStatus(clientDescriptionType.id, false);
      const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(clientDescriptionType.id, true);
      const updated2 = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
