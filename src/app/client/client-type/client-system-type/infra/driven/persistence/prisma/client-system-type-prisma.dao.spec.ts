import { Test } from '@nestjs/testing';
import { ClientSystemTypeDto } from 'src/app/client/client-type/client-system-type/application/dtos/client-system-type.dto';
import { CreateClientSystemTypeInputDto } from 'src/app/client/client-type/client-system-type/application/usecases/create-client-system-type/dtos/create-client-system-type.dto';
import { EditClientSystemTypeInputDto } from 'src/app/client/client-type/client-system-type/application/usecases/edit-client-system-type/dtos/edit-client-system-type.dto';
import { FindAllClientSystemTypeQueryDto } from 'src/app/client/client-type/client-system-type/application/usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeDaoAdapterPrisma } from './client-system-type-prisma.dao';

describe('ClientSystemTypeDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientSystemTypeDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientSystemTypeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientSystemTypeDaoAdapterPrisma);
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
    it('should return empty array when no client system types exist', async() => {
      const query: FindAllClientSystemTypeQueryDto = {};

      const [clientSystemTypes, total] = await sut.findAll(query);

      expect(clientSystemTypes).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client system types with default pagination', async() => {
      await prisma.clientSystemType.createMany({
        data: [
          { name: `Tipo ${Date.now()}-1`, active: true },
          { name: `Tipo ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllClientSystemTypeQueryDto = {};
      const [clientSystemTypes, total] = await sut.findAll(query);

      expect(clientSystemTypes).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.clientSystemType.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Tipo ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [clientSystemTypes, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientSystemTypes2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(clientSystemTypes).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientSystemTypes2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      await prisma.clientSystemType.createMany({
        data: [
          { name: `Sistema ERP ${Date.now()}`, active: true },
          { name: `Sistema CRM ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllClientSystemTypeQueryDto = { search: 'erp' };
      const [clientSystemTypes, total] = await sut.findAll(query);

      expect(clientSystemTypes).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientSystemTypes[0].name).toContain('ERP');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.clientSystemType.create({
        data: { name: `A-${Date.now()}`, active: true },
      });
      const ct2 = await prisma.clientSystemType.create({
        data: { name: `B-${Date.now()}`, active: true },
      });

      const query: FindAllClientSystemTypeQueryDto = {};
      const [clientSystemTypes] = await sut.findAll(query);

      expect(clientSystemTypes).toHaveLength(2);
      expect(clientSystemTypes[0].name).toBe(ct1.name);
      expect(clientSystemTypes[1].name).toBe(ct2.name);
    });

    it('should return all client system type fields correctly', async() => {
      const created = await prisma.clientSystemType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      const query: FindAllClientSystemTypeQueryDto = {};
      const [clientSystemTypes] = await sut.findAll(query);

      expect(clientSystemTypes).toHaveLength(1);
      expect(clientSystemTypes[0]).toEqual<ClientSystemTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client system type does not exist', async() => {
      const result = await sut.findById(0);
      expect(result).toBeNull();
    });

    it('should return client system type by id', async() => {
      const created = await prisma.clientSystemType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });

    it('should return all client system type fields correctly', async() => {
      const created = await prisma.clientSystemType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: false },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientSystemTypeDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client system type does not exist', async() => {
      await prisma.clientSystemType.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      const result = await sut.findByName('Tipo Inexistente');

      expect(result).toBeNull();
    });

    it('should return client system type by name', async() => {
      const name = `Sistema ${Date.now()}`;
      const created = await prisma.clientSystemType.create({
        data: { name, active: true },
      });

      const result = await sut.findByName(created.name);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client system type by name (case-insensitive)', async() => {
      const name = `Sistema ${Date.now()}`;
      const created = await prisma.clientSystemType.create({
        data: { name, active: true },
      });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client system type name', async() => {
      await prisma.clientSystemType.create({
        data: { name: `Sistema 1 ${Date.now()}`, active: true },
      });
      await prisma.clientSystemType.create({
        data: { name: `Sistema 2 ${Date.now()}`, active: true },
      });

      const result = await sut.findByName('Sistema');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client system type and return id', async() => {
      const data: CreateClientSystemTypeInputDto = {
        name: `Sistema ERP ${Date.now()}`,
      };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientSystemType.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client system type name', async() => {
      const clientSystemType = await prisma.clientSystemType.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditClientSystemTypeInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(clientSystemType.id, data);

      const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client system type from database', async() => {
      const clientSystemType = await prisma.clientSystemType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      await sut.delete(clientSystemType.id);

      const deleted = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client system type status', async() => {
      const clientSystemType = await prisma.clientSystemType.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      await sut.updateStatus(clientSystemType.id, false);
      const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(clientSystemType.id, true);
      const updated2 = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
