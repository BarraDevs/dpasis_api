import { Test } from '@nestjs/testing';
import { ServiceWarrantyDto } from 'src/app/service/service-warranty/application/dtos/service-warranty.dto';
import { CreateServiceWarrantyInputDto } from 'src/app/service/service-warranty/application/usecases/create-service-warranty/dtos/create-service-warranty.dto';
import { EditServiceWarrantyInputDto } from 'src/app/service/service-warranty/application/usecases/edit-service-warranty/dtos/edit-service-warranty.dto';
import { FindAllServiceWarrantyQueryDto } from 'src/app/service/service-warranty/application/usecases/find-all-service-warranty/dtos/find-all-service-warranty.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyDaoAdapterPrisma } from './service-warranty-prisma.dao';

describe('ServiceWarrantyDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceWarrantyDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceWarrantyDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceWarrantyDaoAdapterPrisma);
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
    it('should return empty array when no service warranties exist', async() => {
      const query: FindAllServiceWarrantyQueryDto = {};

      const [serviceWarranties, total] = await sut.findAll(query);

      expect(serviceWarranties).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all service warranties with default pagination', async() => {
      await prisma.serviceWarranty.createMany({
        data: [
          { name: `Warranty ${Date.now()}-1`, active: true },
          { name: `Warranty ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllServiceWarrantyQueryDto = {};
      const [serviceWarranties, total] = await sut.findAll(query);

      expect(serviceWarranties).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.serviceWarranty.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Warranty ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [serviceWarranties, total] = await sut.findAll({ page: 1, size: 10 });
      const [serviceWarranties2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(serviceWarranties).toHaveLength(10);
      expect(total).toBe(25);
      expect(serviceWarranties2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.serviceWarranty.createMany({
        data: [
          { name: `Warranty Ativo ${Date.now()}`, active: true },
          { name: `Warranty Inativo ${Date.now()}`, active: false },
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
      await prisma.serviceWarranty.createMany({
        data: [
          { name: `90 dias ${Date.now()}`, active: true },
          { name: `1 ano ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllServiceWarrantyQueryDto = { search: '90' };
      const [serviceWarranties, total] = await sut.findAll(query);

      expect(serviceWarranties).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceWarranties[0].name).toContain('90');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.serviceWarranty.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.serviceWarranty.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [serviceWarranties] = await sut.findAll({});

      expect(serviceWarranties).toHaveLength(2);
      expect(serviceWarranties[0].name).toBe(ct2.name);
      expect(serviceWarranties[1].name).toBe(ct1.name);
    });

    it('should return all service warranty fields correctly', async() => {
      const created = await prisma.serviceWarranty.create({
        data: { name: `Warranty Test ${Date.now()}`, active: true },
      });

      const [serviceWarranties] = await sut.findAll({});

      expect(serviceWarranties).toHaveLength(1);
      expect(serviceWarranties[0]).toEqual<ServiceWarrantyDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when service warranty does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return service warranty by id', async() => {
      const created = await prisma.serviceWarranty.create({
        data: { name: `Warranty Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when service warranty does not exist', async() => {
      await prisma.serviceWarranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } });

      const result = await sut.findByName('Warranty Inexistente');

      expect(result).toBeNull();
    });

    it('should return service warranty by name (case-insensitive)', async() => {
      const name = `Warranty ${Date.now()}`;
      const created = await prisma.serviceWarranty.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create service warranty and return id', async() => {
      const data: CreateServiceWarrantyInputDto = { name: `90 dias ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.serviceWarranty.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update service warranty name', async() => {
      const serviceWarranty = await prisma.serviceWarranty.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditServiceWarrantyInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(serviceWarranty.id, data);

      const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByWarrantyId', () => {
    it('should return 0 when no services use the warranty', async() => {
      const serviceWarranty = await prisma.serviceWarranty.create({
        data: { name: `Warranty ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByWarrantyId(serviceWarranty.id);

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete service warranty from database', async() => {
      const serviceWarranty = await prisma.serviceWarranty.create({
        data: { name: `Warranty ${Date.now()}`, active: true },
      });

      await sut.delete(serviceWarranty.id);

      const deleted = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update service warranty status', async() => {
      const serviceWarranty = await prisma.serviceWarranty.create({
        data: { name: `Warranty ${Date.now()}`, active: true },
      });

      await sut.updateStatus(serviceWarranty.id, false);
      const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(serviceWarranty.id, true);
      const updated2 = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
