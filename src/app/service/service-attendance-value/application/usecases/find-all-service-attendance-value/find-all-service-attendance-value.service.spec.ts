import { Test } from '@nestjs/testing';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceAttendanceValueModule } from '../../../service-attendance-value.module';
import { ServiceAttendanceValueDto } from '../../dtos/service-attendance-value.dto';
import { FindAllServiceAttendanceValueQueryDto } from './dtos/find-all-service-attendance-value.dto';
import { FindAllServiceAttendanceValue } from './find-all-service-attendance-value.service';

async function seedActiveService(prisma: PrismaService, nameLabel: string): Promise<{ id: number }> {
  const fk = await seedServiceCatalogForeignKeys(prisma);
  const service = await prisma.service.create({
    data: {
      ...fk,
      name: `Serviço listagem ${nameLabel}`,
      unitPriceInCents: 1000,
      description: 'Descrição teste find-all',
      isCommercial: true,
      active: true,
    },
  });
  return { id: service.id };
}

describe('FindAllServiceAttendanceValue - Integration tests', () => {
  let sut: FindAllServiceAttendanceValue;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceAttendanceValueModule],
    }).compile();

    sut = module.get(FindAllServiceAttendanceValue);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when no rows exist for serviceId', async() => {
    const { id: serviceId } = await seedActiveService(prisma, 'empty');

    const result = await sut.execute({ serviceId } as FindAllServiceAttendanceValueQueryDto);

    expect(result).toEqual<IPagination<ServiceAttendanceValueDto>>({
      currentPage: 1,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
      data: [],
    });
  });

  it('should return rows from all services when serviceId is omitted', async() => {
    const { id: serviceIdA } = await seedActiveService(prisma, 'all-A');
    const { id: serviceIdB } = await seedActiveService(prisma, 'all-B');

    await prisma.serviceAttendanceValue.create({
      data: {
        serviceId: serviceIdA,
        values: { a: 1 },
        totalValueInCents: 1,
      },
    });
    await prisma.serviceAttendanceValue.create({
      data: {
        serviceId: serviceIdB,
        values: { b: 2 },
        totalValueInCents: 2,
      },
    });

    const result = await sut.execute({ page: 1, size: 10 } as FindAllServiceAttendanceValueQueryDto);

    expect(result.totalItems).toBe(2);
    expect(result.data).toHaveLength(2);
    const serviceIds = result.data.map((r) => r.serviceId).sort((a, b) => a - b);
    expect(serviceIds).toEqual([serviceIdA, serviceIdB].sort((a, b) => a - b));
  });

  it('should filter by serviceId and exclude rows from other services', async() => {
    const { id: serviceIdA } = await seedActiveService(prisma, 'A');
    const { id: serviceIdB } = await seedActiveService(prisma, 'B');

    await prisma.serviceAttendanceValue.create({
      data: {
        serviceId: serviceIdA,
        values: { a: 1 },
        totalValueInCents: 1,
      },
    });
    await prisma.serviceAttendanceValue.create({
      data: {
        serviceId: serviceIdA,
        values: { b: 2 },
        totalValueInCents: 2,
      },
    });
    await prisma.serviceAttendanceValue.create({
      data: {
        serviceId: serviceIdB,
        values: { other: 99 },
        totalValueInCents: 99,
      },
    });

    const result = await sut.execute({ serviceId: serviceIdA } as FindAllServiceAttendanceValueQueryDto);

    expect(result.totalItems).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data.every((row) => row.serviceId === serviceIdA)).toBe(true);
    expect(result.data.map((r) => r.totalValueInCents).sort((x, y) => x - y)).toEqual([1, 2]);
  });

  it('should return each item with ServiceAttendanceValueDto format', async() => {
    const { id: serviceId } = await seedActiveService(prisma, 'dto');
    const created = await prisma.serviceAttendanceValue.create({
      data: {
        serviceId,
        values: { maoDeObra: 100, deslocamento: 50 },
        totalValueInCents: 150,
      },
    });

    const result = await sut.execute({ serviceId } as FindAllServiceAttendanceValueQueryDto);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual<ServiceAttendanceValueDto>({
      id: created.id,
      serviceId,
      values: { maoDeObra: 100, deslocamento: 50 },
      totalValueInCents: 150,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should paginate with page and size (ordered by id asc)', async() => {
    const { id: serviceId } = await seedActiveService(prisma, 'page');
    const rows: { id: number }[] = [];
    for (let i = 1; i <= 5; i++) {
      const row = await prisma.serviceAttendanceValue.create({
        data: {
          serviceId,
          values: { slot: i },
          totalValueInCents: i * 100,
        },
      });
      rows.push({ id: row.id });
    }

    const page1 = await sut.execute({
      serviceId,
      page: 1,
      size: 2,
    } as FindAllServiceAttendanceValueQueryDto);

    expect(page1.currentPage).toBe(1);
    expect(page1.itemsPerPage).toBe(2);
    expect(page1.totalItems).toBe(5);
    expect(page1.totalPages).toBe(3);
    expect(page1.data.map((r) => r.id)).toEqual([rows[0].id, rows[1].id]);

    const page2 = await sut.execute({
      serviceId,
      page: 2,
      size: 2,
    } as FindAllServiceAttendanceValueQueryDto);

    expect(page2.currentPage).toBe(2);
    expect(page2.data.map((r) => r.id)).toEqual([rows[2].id, rows[3].id]);

    const page3 = await sut.execute({
      serviceId,
      page: 3,
      size: 2,
    } as FindAllServiceAttendanceValueQueryDto);

    expect(page3.currentPage).toBe(3);
    expect(page3.data.map((r) => r.id)).toEqual([rows[4].id]);
    expect(page3.data).toHaveLength(1);
  });

  it('should return all rows on first page when page and size are omitted', async() => {
    const { id: serviceId } = await seedActiveService(prisma, 'no-page');
    await prisma.serviceAttendanceValue.createMany({
      data: [
        { serviceId, values: { x: 1 }, totalValueInCents: 1 },
        { serviceId, values: { y: 2 }, totalValueInCents: 2 },
      ],
    });

    const result = await sut.execute({ serviceId } as FindAllServiceAttendanceValueQueryDto);

    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBe(2);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(2);
  });
});
