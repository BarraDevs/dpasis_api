import { Test } from '@nestjs/testing';
import { ServiceFreightDto } from 'src/app/service/service-freight/application/dtos/service-freight.dto';
import { CreateServiceFreightInputDto } from 'src/app/service/service-freight/application/usecases/create-service-freight/dtos/create-service-freight.dto';
import { EditServiceFreightInputDto } from 'src/app/service/service-freight/application/usecases/edit-service-freight/dtos/edit-service-freight.dto';
import { FindAllServiceFreightQueryDto } from 'src/app/service/service-freight/application/usecases/find-all-service-freight/dtos/find-all-service-freight.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightDaoAdapterPrisma } from './service-freight-prisma.dao';

describe('ServiceFreightDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceFreightDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceFreightDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceFreightDaoAdapterPrisma);
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
    it('should return empty array when no service freights exist', async() => {
      const query: FindAllServiceFreightQueryDto = {};

      const [serviceFreights, total] = await sut.findAll(query);

      expect(serviceFreights).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all service freights with default pagination', async() => {
      await prisma.serviceFreight.createMany({
        data: [
          { name: `Freight ${Date.now()}-1`, active: true },
          { name: `Freight ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllServiceFreightQueryDto = {};
      const [serviceFreights, total] = await sut.findAll(query);

      expect(serviceFreights).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.serviceFreight.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Freight ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [serviceFreights, total] = await sut.findAll({ page: 1, size: 10 });
      const [serviceFreights2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(serviceFreights).toHaveLength(10);
      expect(total).toBe(25);
      expect(serviceFreights2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.serviceFreight.createMany({
        data: [
          { name: `Freight Ativo ${Date.now()}`, active: true },
          { name: `Freight Inativo ${Date.now()}`, active: false },
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
      await prisma.serviceFreight.createMany({
        data: [
          { name: `CIF ${Date.now()}`, active: true },
          { name: `FOB ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllServiceFreightQueryDto = { search: 'cif' };
      const [serviceFreights, total] = await sut.findAll(query);

      expect(serviceFreights).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceFreights[0].name).toContain('CIF');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.serviceFreight.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.serviceFreight.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [serviceFreights] = await sut.findAll({});

      expect(serviceFreights).toHaveLength(2);
      expect(serviceFreights[0].name).toBe(ct2.name);
      expect(serviceFreights[1].name).toBe(ct1.name);
    });

    it('should return all service freight fields correctly', async() => {
      const created = await prisma.serviceFreight.create({
        data: { name: `Freight Test ${Date.now()}`, active: true },
      });

      const [serviceFreights] = await sut.findAll({});

      expect(serviceFreights).toHaveLength(1);
      expect(serviceFreights[0]).toEqual<ServiceFreightDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when service freight does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return service freight by id', async() => {
      const created = await prisma.serviceFreight.create({
        data: { name: `Freight Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when service freight does not exist', async() => {
      await prisma.serviceFreight.create({ data: { name: `Freight ${Date.now()}`, active: true } });

      const result = await sut.findByName('Freight Inexistente');

      expect(result).toBeNull();
    });

    it('should return service freight by name (case-insensitive)', async() => {
      const name = `Freight ${Date.now()}`;
      const created = await prisma.serviceFreight.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create service freight and return id', async() => {
      const data: CreateServiceFreightInputDto = { name: `CIF ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.serviceFreight.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update service freight name', async() => {
      const serviceFreight = await prisma.serviceFreight.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditServiceFreightInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(serviceFreight.id, data);

      const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete service freight from database', async() => {
      const serviceFreight = await prisma.serviceFreight.create({
        data: { name: `Freight ${Date.now()}`, active: true },
      });

      await sut.delete(serviceFreight.id);

      const deleted = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update service freight status', async() => {
      const serviceFreight = await prisma.serviceFreight.create({
        data: { name: `Freight ${Date.now()}`, active: true },
      });

      await sut.updateStatus(serviceFreight.id, false);
      const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(serviceFreight.id, true);
      const updated2 = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
