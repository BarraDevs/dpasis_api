import { Test } from '@nestjs/testing';
import { ServiceProposalValidityDto } from 'src/app/service/service-proposal-validity/application/dtos/service-proposal-validity.dto';
import { CreateServiceProposalValidityInputDto } from 'src/app/service/service-proposal-validity/application/usecases/create-service-proposal-validity/dtos/create-service-proposal-validity.dto';
import { EditServiceProposalValidityInputDto } from 'src/app/service/service-proposal-validity/application/usecases/edit-service-proposal-validity/dtos/edit-service-proposal-validity.dto';
import { FindAllServiceProposalValidityQueryDto } from 'src/app/service/service-proposal-validity/application/usecases/find-all-service-proposal-validity/dtos/find-all-service-proposal-validity.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityDaoAdapterPrisma } from './service-proposal-validity-prisma.dao';

describe('ServiceProposalValidityDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceProposalValidityDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceProposalValidityDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceProposalValidityDaoAdapterPrisma);
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
    it('should return empty array when no service proposal validities exist', async() => {
      const query: FindAllServiceProposalValidityQueryDto = {};

      const [serviceProposalValidities, total] = await sut.findAll(query);

      expect(serviceProposalValidities).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all service proposal validities with default pagination', async() => {
      await prisma.serviceProposalValidity.createMany({
        data: [
          { name: `Validity ${Date.now()}-1`, active: true },
          { name: `Validity ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllServiceProposalValidityQueryDto = {};
      const [serviceProposalValidities, total] = await sut.findAll(query);

      expect(serviceProposalValidities).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.serviceProposalValidity.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Validity ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [serviceProposalValidities, total] = await sut.findAll({ page: 1, size: 10 });
      const [serviceProposalValidities2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(serviceProposalValidities).toHaveLength(10);
      expect(total).toBe(25);
      expect(serviceProposalValidities2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.serviceProposalValidity.createMany({
        data: [
          { name: `Validity Ativo ${Date.now()}`, active: true },
          { name: `Validity Inativo ${Date.now()}`, active: false },
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
      await prisma.serviceProposalValidity.createMany({
        data: [
          { name: `30 dias ${Date.now()}`, active: true },
          { name: `90 dias ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllServiceProposalValidityQueryDto = { search: '30' };
      const [serviceProposalValidities, total] = await sut.findAll(query);

      expect(serviceProposalValidities).toHaveLength(1);
      expect(total).toBe(1);
      expect(serviceProposalValidities[0].name).toContain('30');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.serviceProposalValidity.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.serviceProposalValidity.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [serviceProposalValidities] = await sut.findAll({});

      expect(serviceProposalValidities).toHaveLength(2);
      expect(serviceProposalValidities[0].name).toBe(ct2.name);
      expect(serviceProposalValidities[1].name).toBe(ct1.name);
    });

    it('should return all service proposal validity fields correctly', async() => {
      const created = await prisma.serviceProposalValidity.create({
        data: { name: `Validity Test ${Date.now()}`, active: true },
      });

      const [serviceProposalValidities] = await sut.findAll({});

      expect(serviceProposalValidities).toHaveLength(1);
      expect(serviceProposalValidities[0]).toEqual<ServiceProposalValidityDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when service proposal validity does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return service proposal validity by id', async() => {
      const created = await prisma.serviceProposalValidity.create({
        data: { name: `Validity Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when service proposal validity does not exist', async() => {
      await prisma.serviceProposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } });

      const result = await sut.findByName('Validity Inexistente');

      expect(result).toBeNull();
    });

    it('should return service proposal validity by name (case-insensitive)', async() => {
      const name = `Validity ${Date.now()}`;
      const created = await prisma.serviceProposalValidity.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create service proposal validity and return id', async() => {
      const data: CreateServiceProposalValidityInputDto = { name: `30 dias ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.serviceProposalValidity.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update service proposal validity name', async() => {
      const serviceProposalValidity = await prisma.serviceProposalValidity.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditServiceProposalValidityInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(serviceProposalValidity.id, data);

      const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByProposalValidityId', () => {
    it('should return 0 when no services use the proposal validity', async() => {
      const serviceProposalValidity = await prisma.serviceProposalValidity.create({
        data: { name: `Validity ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByProposalValidityId(serviceProposalValidity.id);

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete service proposal validity from database', async() => {
      const serviceProposalValidity = await prisma.serviceProposalValidity.create({
        data: { name: `Validity ${Date.now()}`, active: true },
      });

      await sut.delete(serviceProposalValidity.id);

      const deleted = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update service proposal validity status', async() => {
      const serviceProposalValidity = await prisma.serviceProposalValidity.create({
        data: { name: `Validity ${Date.now()}`, active: true },
      });

      await sut.updateStatus(serviceProposalValidity.id, false);
      const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(serviceProposalValidity.id, true);
      const updated2 = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
