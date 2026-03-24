import { Test } from '@nestjs/testing';
import { FindAllServiceAttendanceValueQueryDto } from 'src/app/service/service-attendance-value/application/usecases/find-all-service-attendance-value/dtos/find-all-service-attendance-value.dto';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceAttendanceValueDaoAdapterPrisma } from './service-attendance-value-prisma.dao';

describe('ServiceAttendanceValueDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceAttendanceValueDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceAttendanceValueDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceAttendanceValueDaoAdapterPrisma);
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

  describe('findAll', () => {
    it('should return empty when no rows for serviceId', async() => {
      const service = await createService();
      const query: FindAllServiceAttendanceValueQueryDto = {
        serviceId: service.id,
        page: 1,
        size: 10,
      };

      const [rows, total] = await sut.findAll(query);

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should filter by serviceId', async() => {
      const s1 = await createService();
      const s2 = await createService();

      await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: s1.id,
          values: { a: 10 },
          totalValueInCents: 10,
        },
      });
      await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: s2.id,
          values: { b: 20 },
          totalValueInCents: 20,
        },
      });

      const [rows, total] = await sut.findAll({
        serviceId: s1.id,
        page: 1,
        size: 10,
      });

      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].serviceId).toBe(s1.id);
    });

    it('should return all rows when serviceId is omitted', async() => {
      const s1 = await createService();
      const s2 = await createService();

      await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: s1.id,
          values: { a: 1 },
          totalValueInCents: 1,
        },
      });
      await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: s2.id,
          values: { b: 2 },
          totalValueInCents: 2,
        },
      });

      const [rows, total] = await sut.findAll({
        page: 1,
        size: 10,
      });

      expect(total).toBe(2);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.serviceId).sort((a, b) => a - b)).toEqual([s1.id, s2.id].sort((a, b) => a - b));
    });

    it('should paginate results correctly', async() => {
      const service = await createService();
      await prisma.serviceAttendanceValue.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          serviceId: service.id,
          values: { item: i + 1 },
          totalValueInCents: i + 1,
        })),
      });

      const [page1, total] = await sut.findAll({
        serviceId: service.id,
        page: 1,
        size: 10,
      });
      const [page3, total3] = await sut.findAll({
        serviceId: service.id,
        page: 3,
        size: 10,
      });

      expect(page1).toHaveLength(10);
      expect(total).toBe(25);
      expect(page3).toHaveLength(5);
      expect(total3).toBe(25);
    });

    it('should order rows by id ascending', async() => {
      const service = await createService();
      const first = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { primeiro: 1 },
          totalValueInCents: 1,
        },
      });
      const second = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { segundo: 1 },
          totalValueInCents: 1,
        },
      });

      const [rows] = await sut.findAll({
        serviceId: service.id,
        page: 1,
        size: 10,
      });

      expect(rows.map((r) => r.id)).toEqual([first.id, second.id]);
    });

    it('should return all rows for the service when total fits in one page', async() => {
      const service = await createService();
      await prisma.serviceAttendanceValue.createMany({
        data: [
          { serviceId: service.id, values: { a: 1 }, totalValueInCents: 1 },
          { serviceId: service.id, values: { b: 2 }, totalValueInCents: 2 },
          { serviceId: service.id, values: { c: 3 }, totalValueInCents: 3 },
        ],
      });

      const [rows, total] = await sut.findAll({
        serviceId: service.id,
        page: 1,
        size: 50,
      });

      expect(total).toBe(3);
      expect(rows).toHaveLength(3);
      const sumTotals = rows.reduce((acc, r) => acc + r.totalValueInCents, 0);
      expect(sumTotals).toBe(6);
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return dto with values and total', async() => {
      const service = await createService();
      const created = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId: service.id,
          values: { x: 100, y: 50 },
          totalValueInCents: 150,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        serviceId: service.id,
        values: { x: 100, y: 50 },
        totalValueInCents: 150,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
