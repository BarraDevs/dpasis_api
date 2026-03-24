import { Test } from '@nestjs/testing';
import { FindAllServiceCatalogQueryDto } from 'src/app/service/service-catalog/application/usecases/find-all-service-catalog/dtos/find-all-service-catalog.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedServiceCatalogForeignKeys, serviceFkScalars } from './service-catalog-prisma-test.helpers';
import { ServiceCatalogDaoAdapterPrisma, ServiceCatalogSelect } from './service-catalog-prisma.dao';

describe('ServiceCatalogDaoAdapterPrisma - Integration tests', () => {
  let sut: ServiceCatalogDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ServiceCatalogDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ServiceCatalogDaoAdapterPrisma);
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
    it('should return empty array when no services exist in services table', async() => {
      const query: FindAllServiceCatalogQueryDto = {};

      const [rows, total] = await sut.findAll(query);

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return rows from prisma.service (tabela services)', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const created = await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: `Svc ${Date.now()}`,
          unitPriceInCents: 5000,
          description: 'Descrição',
          isCommercial: true,
          active: true,
        },
      });

      const [rows, total] = await sut.findAll({});

      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(created.id);

      const fromDb = await prisma.service.findUnique({ where: { id: created.id } });
      expect(fromDb?.name).toBe(created.name);
    });

    it('should paginate results correctly', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const base = Date.now();
      await prisma.service.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          ...serviceFkScalars(fk),
          name: `Svc ${base}-${i}`,
          unitPriceInCents: 1000 + i,
          description: `Desc ${i}`,
          isCommercial: true,
          active: true,
        })),
      });

      const [page1, total] = await sut.findAll({ page: 1, size: 10 });
      const [page3, total3] = await sut.findAll({ page: 3, size: 10 });

      expect(page1).toHaveLength(10);
      expect(total).toBe(25);
      expect(page3).toHaveLength(5);
      expect(total3).toBe(25);
    });

    it('should filter by cnaeNbsIndopId', async() => {
      const fkA = await seedServiceCatalogForeignKeys(prisma);
      const fkB = await seedServiceCatalogForeignKeys(prisma);
      await prisma.service.create({
        data: {
          ...serviceFkScalars(fkA),
          name: `Svc A ${Date.now()}`,
          unitPriceInCents: 1000,
          description: 'A',
          isCommercial: true,
          active: true,
        },
      });
      await prisma.service.create({
        data: {
          ...serviceFkScalars(fkB),
          name: `Svc B ${Date.now()}`,
          unitPriceInCents: 2000,
          description: 'B',
          isCommercial: false,
          active: true,
        },
      });

      const [filtered, total] = await sut.findAll({ cnaeNbsIndopId: fkA.cnaeNbsIndopId });

      expect(total).toBe(1);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].cnaeNbsIndop.id).toBe(fkA.cnaeNbsIndopId);
    });

    it('should filter by active when provided', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: `Ativo ${Date.now()}`,
          unitPriceInCents: 1000,
          description: 'A',
          isCommercial: true,
          active: true,
        },
      });
      await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: `Inativo ${Date.now()}`,
          unitPriceInCents: 2000,
          description: 'B',
          isCommercial: false,
          active: false,
        },
      });

      const [activeRows, activeTotal] = await sut.findAll({ active: true });
      const [inactiveRows, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeTotal).toBe(1);
      expect(activeRows[0].active).toBe(true);
      expect(inactiveTotal).toBe(1);
      expect(inactiveRows[0].active).toBe(false);
    });

    it('should search in name and description (case-insensitive)', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: `Instalação ${Date.now()}`,
          unitPriceInCents: 1000,
          description: 'X',
          isCommercial: true,
          active: true,
        },
      });
      await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: `Outro ${Date.now()}`,
          unitPriceInCents: 2000,
          description: 'Manutenção preventiva',
          isCommercial: true,
          active: true,
        },
      });

      const [byName] = await sut.findAll({ search: 'instalação' });
      const [byDesc] = await sut.findAll({ search: 'manutenção' });

      expect(byName).toHaveLength(1);
      expect(byName[0].name).toContain('Instalação');
      expect(byDesc).toHaveLength(1);
      expect(byDesc[0].description).toContain('Manutenção');
    });

    it('should return results ordered by id asc', async() => {
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

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(2);
      expect(rows[0].id).toBe(first.id);
      expect(rows[1].id).toBe(second.id);
    });

    it('should return all ServiceCatalogDto fields matching services row', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const created = await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: `Completo ${Date.now()}`,
          unitPriceInCents: 9999,
          description: 'Texto longo',
          isCommercial: false,
          active: true,
        },
      });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      const expected = await sut.findById(created.id);
      expect(rows[0]).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should return null when service does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return dto from services table by id', async() => {
      const fk = await seedServiceCatalogForeignKeys(prisma);
      const created = await prisma.service.create({
        data: {
          ...serviceFkScalars(fk),
          name: 'Find by id',
          unitPriceInCents: 3000,
          description: 'D',
          isCommercial: true,
          active: false,
        },
      });

      const result = await sut.findById(created.id);

      const expected = await prisma.service.findUnique({
        where: { id: created.id },
        select: ServiceCatalogSelect,
      });
      expect(result).toEqual(expected);
    });
  });
});
