import { Test } from '@nestjs/testing';
import { DeliveryTermDto } from 'src/app/global/delivery-term/application/dtos/delivery-term.dto';
import { CreateDeliveryTermInputDto } from 'src/app/global/delivery-term/application/usecases/create-delivery-term/dtos/create-delivery-term.dto';
import { EditDeliveryTermInputDto } from 'src/app/global/delivery-term/application/usecases/edit-delivery-term/dtos/edit-delivery-term.dto';
import { FindAllDeliveryTermQueryDto } from 'src/app/global/delivery-term/application/usecases/find-all-delivery-term/dtos/find-all-delivery-term.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermDaoAdapterPrisma } from './delivery-term-prisma.dao';

describe('DeliveryTermDaoAdapterPrisma - Integration tests', () => {
  let sut: DeliveryTermDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [DeliveryTermDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(DeliveryTermDaoAdapterPrisma);
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
    it('should return empty array when no delivery term records exist', async() => {
      const query: FindAllDeliveryTermQueryDto = {};

      const [deliveryTerms, total] = await sut.findAll(query);

      expect(deliveryTerms).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all delivery terms with default pagination', async() => {
      await prisma.deliveryTerm.createMany({
        data: [
          { name: `Term ${Date.now()}-1`, active: true },
          { name: `Term ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllDeliveryTermQueryDto = {};
      const [deliveryTerms, total] = await sut.findAll(query);

      expect(deliveryTerms).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.deliveryTerm.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Term ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [deliveryTerms, total] = await sut.findAll({ page: 1, size: 10 });
      const [deliveryTerms2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(deliveryTerms).toHaveLength(10);
      expect(total).toBe(25);
      expect(deliveryTerms2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.deliveryTerm.createMany({
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
      await prisma.deliveryTerm.createMany({
        data: [
          { name: `Imediato ${Date.now()}`, active: true },
          { name: `30 dias ${Date.now()}`, active: true },
        ],
      });

      const query: FindAllDeliveryTermQueryDto = { search: 'imediato' };
      const [deliveryTerms, total] = await sut.findAll(query);

      expect(deliveryTerms).toHaveLength(1);
      expect(total).toBe(1);
      expect(deliveryTerms[0].name).toContain('Imediato');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.deliveryTerm.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.deliveryTerm.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [deliveryTerms] = await sut.findAll({});

      expect(deliveryTerms).toHaveLength(2);
      expect(deliveryTerms[0].name).toBe(ct2.name);
      expect(deliveryTerms[1].name).toBe(ct1.name);
    });

    it('should return all delivery term fields correctly', async() => {
      const created = await prisma.deliveryTerm.create({
        data: { name: `Term Test ${Date.now()}`, active: true },
      });

      const [deliveryTerms] = await sut.findAll({});

      expect(deliveryTerms).toHaveLength(1);
      expect(deliveryTerms[0]).toEqual<DeliveryTermDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when delivery term does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return delivery term by id', async() => {
      const created = await prisma.deliveryTerm.create({
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
    it('should return null when delivery term does not exist', async() => {
      await prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } });

      const result = await sut.findByName('Term Inexistente');

      expect(result).toBeNull();
    });

    it('should return delivery term by name (case-insensitive)', async() => {
      const name = `Term ${Date.now()}`;
      const created = await prisma.deliveryTerm.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create delivery term and return id', async() => {
      const data: CreateDeliveryTermInputDto = { name: `Imediato ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.deliveryTerm.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update delivery term name', async() => {
      const deliveryTermRow = await prisma.deliveryTerm.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditDeliveryTermInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(deliveryTermRow.id, data);

      const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByDeliveryTermId', () => {
    it('should return 0 when no services use the delivery term', async() => {
      const deliveryTermRow = await prisma.deliveryTerm.create({
        data: { name: `Term ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByDeliveryTermId(deliveryTermRow.id);

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete delivery term from database', async() => {
      const deliveryTermRow = await prisma.deliveryTerm.create({
        data: { name: `Term ${Date.now()}`, active: true },
      });

      await sut.delete(deliveryTermRow.id);

      const deleted = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update delivery term status', async() => {
      const deliveryTermRow = await prisma.deliveryTerm.create({
        data: { name: `Term ${Date.now()}`, active: true },
      });

      await sut.updateStatus(deliveryTermRow.id, false);
      const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(deliveryTermRow.id, true);
      const updated2 = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
