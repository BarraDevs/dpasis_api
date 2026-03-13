import { Test } from '@nestjs/testing';
import { ClientDriveTypeDto } from 'src/app/client/client-drive-type/application/dtos/client-drive-type.dto';
import { CreateClientDriveTypeInputDto } from 'src/app/client/client-drive-type/application/usecases/create-client-drive-type/dtos/create-client-drive-type.dto';
import { EditClientDriveTypeInputDto } from 'src/app/client/client-drive-type/application/usecases/edit-client-drive-type/dtos/edit-client-drive-type.dto';
import { FindAllClientDriveTypeQueryDto } from 'src/app/client/client-drive-type/application/usecases/find-all-client-drive-type/dtos/find-all-client-drive-type.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeDaoAdapterPrisma } from './client-drive-type-prisma.dao';

describe('ClientDriveTypeDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientDriveTypeDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDriveTypeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientDriveTypeDaoAdapterPrisma);
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
    it('should return empty array when no client drive types exist', async() => {
      const query: FindAllClientDriveTypeQueryDto = {};

      const [clientDriveTypes, total] = await sut.findAll(query);

      expect(clientDriveTypes).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client drive types with default pagination', async() => {
      await prisma.clientDriveType.createMany({
        data: [
          { name: `Drive ${Date.now()}-1`, active: true },
          { name: `Drive ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllClientDriveTypeQueryDto = {};
      const [clientDriveTypes, total] = await sut.findAll(query);

      expect(clientDriveTypes).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.clientDriveType.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Drive ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [clientDriveTypes, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientDriveTypes2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(clientDriveTypes).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientDriveTypes2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      await prisma.clientDriveType.createMany({
        data: [
          { name: `Google Drive ${Date.now()}`, active: true },
          { name: `OneDrive ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllClientDriveTypeQueryDto = { search: 'google' };
      const [clientDriveTypes, total] = await sut.findAll(query);

      expect(clientDriveTypes).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientDriveTypes[0].name).toContain('Google');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.clientDriveType.create({ data: { name: `A-${Date.now()}`, active: true } });
      const ct2 = await prisma.clientDriveType.create({ data: { name: `B-${Date.now()}`, active: true } });

      const [clientDriveTypes] = await sut.findAll({});

      expect(clientDriveTypes).toHaveLength(2);
      expect(clientDriveTypes[0].name).toBe(ct1.name);
      expect(clientDriveTypes[1].name).toBe(ct2.name);
    });

    it('should return all client drive type fields correctly', async() => {
      const created = await prisma.clientDriveType.create({
        data: { name: `Drive Test ${Date.now()}`, active: true },
      });

      const [clientDriveTypes] = await sut.findAll({});

      expect(clientDriveTypes).toHaveLength(1);
      expect(clientDriveTypes[0]).toEqual<ClientDriveTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client drive type does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return client drive type by id', async() => {
      const created = await prisma.clientDriveType.create({
        data: { name: `Drive Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when client drive type does not exist', async() => {
      await prisma.clientDriveType.create({ data: { name: `Drive ${Date.now()}`, active: true } });

      const result = await sut.findByName('Drive Inexistente');

      expect(result).toBeNull();
    });

    it('should return client drive type by name (case-insensitive)', async() => {
      const name = `Drive ${Date.now()}`;
      const created = await prisma.clientDriveType.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create client drive type and return id', async() => {
      const data: CreateClientDriveTypeInputDto = { name: `Google Drive ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientDriveType.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client drive type name', async() => {
      const clientDriveType = await prisma.clientDriveType.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditClientDriveTypeInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(clientDriveType.id, data);

      const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client drive type from database', async() => {
      const clientDriveType = await prisma.clientDriveType.create({
        data: { name: `Drive ${Date.now()}`, active: true },
      });

      await sut.delete(clientDriveType.id);

      const deleted = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client drive type status', async() => {
      const clientDriveType = await prisma.clientDriveType.create({
        data: { name: `Drive ${Date.now()}`, active: true },
      });

      await sut.updateStatus(clientDriveType.id, false);
      const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(clientDriveType.id, true);
      const updated2 = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
