import { Test } from '@nestjs/testing';
import { ServiceDeliveryTermDto } from 'src/app/service/service-delivery-term/application/dtos/service-delivery-term.dto';
import { CreateServiceDeliveryTermInputDto } from 'src/app/service/service-delivery-term/application/usecases/create-service-delivery-term/dtos/create-service-delivery-term.dto';
import { EditServiceDeliveryTermInputDto } from 'src/app/service/service-delivery-term/application/usecases/edit-service-delivery-term/dtos/edit-service-delivery-term.dto';
import { FindAllServiceDeliveryTermQueryDto } from 'src/app/service/service-delivery-term/application/usecases/find-all-service-delivery-term/dtos/find-all-service-delivery-term.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermDaoAdapterPrisma } from './service-delivery-term-prisma.dao';

describe('ServiceDeliveryTermDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceDeliveryTermDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceDeliveryTermDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceDeliveryTermDaoAdapterPrisma);
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
    it('should return empty array when no service delivery terms exist', async() => {
      const query: FindAllServiceDeliveryTermQueryDto = {};

      const [serviceDeliveryTerms, total] = await sut.findAll(query);

      expect(serviceDeliveryTerms).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all service delivery terms with default pagination', async() => {
      await prisma.serviceDeliveryTerm.createMany({
        data: [
          { name: `Term ${Date.now()}-1`, active: true },
          { name: `Term ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllServiceDeliveryTermQueryDto = {};
      const [serviceDeliveryTerms, total] = await sut.findAll(query);

      expect(serviceDeliveryTerms).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.serviceDeliveryTerm.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Term ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [serviceDeliveryTerms, total] = await sut.findAll({ page: 1, size: 10 });
      const [serviceDeliveryTerms2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(serviceDeliveryTerms).toHaveLength(10);
      expect(total).toBe(25);
      expect(serviceDeliveryTerms2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.serviceDeliveryTerm.createMany({
        data: [
          { name: `Term Ativo ${Date.now()}`, active: true },
          { name: `Term Inativo ${Date.now()}`, active: false },
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
      await prisma.serviceDeliveryTerm.createMany({
        data: [
          { name: `Imediato ${Date.now()}`, active: true },
          { name: `30 dias ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllServiceDeliveryTermQueryDto = { search: 'imediato' };
      const [serviceDeliveryTerms, total] = await sut.findAll(query);

      expect(serviceDeliveryTerms).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceDeliveryTerms[0].name).toContain('Imediato');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.serviceDeliveryTerm.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.serviceDeliveryTerm.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [serviceDeliveryTerms] = await sut.findAll({});

      expect(serviceDeliveryTerms).toHaveLength(2);
      expect(serviceDeliveryTerms[0].name).toBe(ct2.name);
      expect(serviceDeliveryTerms[1].name).toBe(ct1.name);
    });

    it('should return all service delivery term fields correctly', async() => {
      const created = await prisma.serviceDeliveryTerm.create({
        data: { name: `Term Test ${Date.now()}`, active: true },
      });

      const [serviceDeliveryTerms] = await sut.findAll({});

      expect(serviceDeliveryTerms).toHaveLength(1);
      expect(serviceDeliveryTerms[0]).toEqual<ServiceDeliveryTermDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when service delivery term does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return service delivery term by id', async() => {
      const created = await prisma.serviceDeliveryTerm.create({
        data: { name: `Term Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when service delivery term does not exist', async() => {
      await prisma.serviceDeliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } });

      const result = await sut.findByName('Term Inexistente');

      expect(result).toBeNull();
    });

    it('should return service delivery term by name (case-insensitive)', async() => {
      const name = `Term ${Date.now()}`;
      const created = await prisma.serviceDeliveryTerm.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create service delivery term and return id', async() => {
      const data: CreateServiceDeliveryTermInputDto = { name: `Imediato ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.serviceDeliveryTerm.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update service delivery term name', async() => {
      const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditServiceDeliveryTermInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(serviceDeliveryTerm.id, data);

      const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete service delivery term from database', async() => {
      const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
        data: { name: `Term ${Date.now()}`, active: true },
      });

      await sut.delete(serviceDeliveryTerm.id);

      const deleted = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update service delivery term status', async() => {
      const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
        data: { name: `Term ${Date.now()}`, active: true },
      });

      await sut.updateStatus(serviceDeliveryTerm.id, false);
      const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(serviceDeliveryTerm.id, true);
      const updated2 = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
