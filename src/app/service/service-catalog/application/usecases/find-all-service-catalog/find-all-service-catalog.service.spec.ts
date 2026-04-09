import { Test } from '@nestjs/testing';
import type { IServiceCatalogDao } from 'src/app/service/service-catalog/application/persistence/dao/service-catalog-dao.interface';
import {
    seedServiceCatalogForeignKeys,
    serviceFkScalars,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCatalogDto } from '../../dtos/service-catalog.dto';
import { FindAllServiceCatalogQueryDto } from './dtos/find-all-service-catalog.dto';
import { FindAllServiceCatalog } from './find-all-service-catalog.service';

describe('FindAllServiceCatalog - Integration tests', () => {
  let sut: FindAllServiceCatalog;
  let prisma: PrismaService;
  let serviceCatalogDao: IServiceCatalogDao;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(FindAllServiceCatalog);
    prisma = module.get(PrismaService);
    serviceCatalogDao = module.get(TOKENS.ServiceCatalogDao);
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

  it('should return empty results when no services exist', async() => {
    const query: FindAllServiceCatalogQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all services with pagination', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const base = Date.now();
    await prisma.service.createMany({
      data: [
        {
          ...serviceFkScalars(fk),
          name: `Svc ${base}-1`,
          unitPriceInCents: 1000,
          description: 'A',
          isCommercial: true,
          active: true,
        },
        {
          ...serviceFkScalars(fk),
          name: `Svc ${base}-2`,
          unitPriceInCents: 2000,
          description: 'B',
          isCommercial: false,
          active: false,
        },
        {
          ...serviceFkScalars(fk),
          name: `Svc ${base}-3`,
          unitPriceInCents: 3000,
          description: 'C',
          isCommercial: true,
          active: true,
        },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const base = Date.now();
    await prisma.service.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        ...serviceFkScalars(fk),
        name: `Svc ${base}-${i}`,
        unitPriceInCents: 1000 + i,
        description: `D${i}`,
        isCommercial: true,
        active: true,
      })),
    });

    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by id asc', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const first = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Z ${Date.now()}`,
        unitPriceInCents: 1,
        description: '1',
        isCommercial: true,
        active: true,
      },
    });
    const second = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `A ${Date.now()}`,
        unitPriceInCents: 2,
        description: '2',
        isCommercial: true,
        active: true,
      },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe(first.id);
    expect(result.data[1].id).toBe(second.id);
  });

  it('should filter by active when active is true', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const base = Date.now();
    await prisma.service.createMany({
      data: [
        {
          ...serviceFkScalars(fk),
          name: `Ativo ${base}`,
          unitPriceInCents: 1,
          description: 'A',
          isCommercial: true,
          active: true,
        },
        {
          ...serviceFkScalars(fk),
          name: `Inativo ${base}`,
          unitPriceInCents: 2,
          description: 'B',
          isCommercial: true,
          active: false,
        },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].active).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const base = Date.now();
    await prisma.service.createMany({
      data: [
        {
          ...serviceFkScalars(fk),
          name: `Ativo ${base}`,
          unitPriceInCents: 1,
          description: 'A',
          isCommercial: true,
          active: true,
        },
        {
          ...serviceFkScalars(fk),
          name: `Inativo ${base}`,
          unitPriceInCents: 2,
          description: 'B',
          isCommercial: true,
          active: false,
        },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].active).toBe(false);
  });

  it('should filter by search in name and description', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const base = Date.now();
    await prisma.service.createMany({
      data: [
        {
          ...serviceFkScalars(fk),
          name: `Instalação ${base}`,
          unitPriceInCents: 1,
          description: 'X',
          isCommercial: true,
          active: true,
        },
        {
          ...serviceFkScalars(fk),
          name: `Outro ${base}`,
          unitPriceInCents: 2,
          description: 'Manutenção preventiva',
          isCommercial: true,
          active: true,
        },
      ],
    });

    const byName = await sut.execute({ page: 1, size: 10, search: 'instalação' });
    const byDesc = await sut.execute({ page: 1, size: 10, search: 'manutenção' });

    expect(byName.data).toHaveLength(1);
    expect(byName.data[0].name).toContain('Instalação');
    expect(byDesc.data).toHaveLength(1);
    expect(byDesc.data[0].description).toContain('Manutenção');
  });

  it('should filter by cnaeNbsIndopId', async() => {
    const fkA = await seedServiceCatalogForeignKeys(prisma);
    const fkB = await seedServiceCatalogForeignKeys(prisma);
    await prisma.service.create({
      data: {
        ...serviceFkScalars(fkA),
        name: `A ${Date.now()}`,
        unitPriceInCents: 1,
        description: 'A',
        isCommercial: true,
        active: true,
      },
    });
    await prisma.service.create({
      data: {
        ...serviceFkScalars(fkB),
        name: `B ${Date.now()}`,
        unitPriceInCents: 2,
        description: 'B',
        isCommercial: true,
        active: true,
      },
    });

    const result = await sut.execute({ page: 1, size: 10, cnaeNbsIndopId: fkA.cnaeNbsIndopId });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].cnaeNbsIndop.id).toBe(fkA.cnaeNbsIndopId);
  });

  it('should return correct ServiceCatalogDto structure', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Completo ${Date.now()}`,
        unitPriceInCents: 9999,
        description: 'Texto',
        isCommercial: false,
        active: true,
      },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    const expected = await serviceCatalogDao.findById(created.id);
    expect(result.data[0]).toEqual<ServiceCatalogDto>(expected!);
  });
});
