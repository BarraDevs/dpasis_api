import { Test } from '@nestjs/testing';
import { ServiceAttendanceValueFactory } from 'src/app/service/service-attendance-value/domain/factories/service-attendance-value.factory';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceAttendanceValueRepositoryAdapterPrisma } from './service-attendance-value-prisma.repository';

describe('ServiceAttendanceValueRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ServiceAttendanceValueRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceAttendanceValueRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceAttendanceValueRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function createService(): Promise<{ id: number }> {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const unique = Date.now();
    return prisma.service.create({
      data: {
        ...fk,
        name: `Svc ${unique}`,
        unitPriceInCents: 1000,
        description: 'Desc',
        isCommercial: true,
        active: true,
      },
    });
  }

  describe('save', () => {
    it('should persist entity and return id', async() => {
      const service = await createService();
      const entity = ServiceAttendanceValueFactory.create({
        serviceId: service.id,
        values: { m: 5, n: 7 },
      });

      const id = await sut.save(entity);

      const row = await prisma.serviceAttendanceValue.findUnique({ where: { id } });
      expect(row).not.toBeNull();
      expect(row!.serviceId).toBe(service.id);
      expect(row!.totalValueInCents).toBe(12);
      expect(row!.values).toEqual({ m: 5, n: 7 });
    });

    it('should return an id that exists in the database', async() => {
      const service = await createService();
      const entity = ServiceAttendanceValueFactory.create({
        serviceId: service.id,
        values: { only: 100 },
      });

      const id = await sut.save(entity);

      const count = await prisma.serviceAttendanceValue.count({ where: { id } });
      expect(count).toBe(1);
    });

    it('should allow multiple rows for the same service (1-n)', async() => {
      const service = await createService();
      const id1 = await sut.save(
        ServiceAttendanceValueFactory.create({
          serviceId: service.id,
          values: { lineA: 10 },
        }),
      );
      const id2 = await sut.save(
        ServiceAttendanceValueFactory.create({
          serviceId: service.id,
          values: { lineB: 20 },
        }),
      );

      expect(id1).not.toBe(id2);

      const rows = await prisma.serviceAttendanceValue.findMany({
        where: { serviceId: service.id },
        orderBy: { id: 'asc' },
      });

      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.id)).toEqual([id1, id2]);
    });
  });

  describe('findById', () => {
    it('should return null when not found', async() => {
      const result = await sut.findById(99999);
      expect(result).toBeNull();
    });

    it('should return entity', async() => {
      const service = await createService();
      const created = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { a: 3 },
          totalValueInCents: 3,
        },
      });

      const entity = await sut.findById(created.id);

      expect(entity).not.toBeNull();
      expect(entity!.props.id).toBe(created.id);
      expect(entity!.props.values).toEqual({ a: 3 });
      expect(entity!.props.totalValueInCents).toBe(3);
    });

    it('should round-trip save then findById with matching props', async() => {
      const service = await createService();
      const created = ServiceAttendanceValueFactory.create({
        serviceId: service.id,
        values: { campoUm: 40, campoDois: 60 },
      });

      const id = await sut.save(created);
      const loaded = await sut.findById(id);

      expect(loaded).not.toBeNull();
      expect(loaded!.props.serviceId).toBe(service.id);
      expect(loaded!.props.values).toEqual({ campoUm: 40, campoDois: 60 });
      expect(loaded!.props.totalValueInCents).toBe(100);
    });
  });

  describe('edit', () => {
    it('should update values and total', async() => {
      const service = await createService();
      const created = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { a: 1 },
          totalValueInCents: 1,
        },
      });

      const loaded = await sut.findById(created.id);
      const edited = ServiceAttendanceValueFactory.edit({
        id: loaded!.props.id!,
        serviceId: loaded!.props.serviceId,
        values: { b: 10, c: 5 },
      });

      await sut.edit(edited);

      const row = await prisma.serviceAttendanceValue.findUnique({ where: { id: created.id } });
      expect(row!.serviceId).toBe(service.id);
      expect(row!.totalValueInCents).toBe(15);
      expect(row!.values).toEqual({ b: 10, c: 5 });
    });

    it('should persist entity from findById then factory.edit', async() => {
      const service = await createService();
      const created = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { x: 2 },
          totalValueInCents: 2,
        },
      });

      const loaded = await sut.findById(created.id);
      const edited = ServiceAttendanceValueFactory.edit({
        id: loaded!.props.id!,
        serviceId: loaded!.props.serviceId,
        values: { novo: 99 },
      });

      await sut.edit(edited);

      const row = await prisma.serviceAttendanceValue.findUnique({ where: { id: created.id } });
      const again = await sut.findById(created.id);

      expect(row!.values).toEqual({ novo: 99 });
      expect(row!.totalValueInCents).toBe(99);
      expect(again!.props.totalValueInCents).toBe(99);
    });
  });

  describe('delete', () => {
    it('should remove row', async() => {
      const service = await createService();
      const created = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { a: 1 },
          totalValueInCents: 1,
        },
      });

      await sut.delete(created.id);

      const row = await prisma.serviceAttendanceValue.findUnique({ where: { id: created.id } });
      expect(row).toBeNull();
    });
  });
});
