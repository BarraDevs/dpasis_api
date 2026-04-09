import { Test } from '@nestjs/testing';
import type { IServiceCatalogDao } from 'src/app/service/service-catalog/application/persistence/dao/service-catalog-dao.interface';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import {
    seedServiceCatalogForeignKeys,
    serviceFkScalars,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCatalogDto } from '../../dtos/service-catalog.dto';
import { FindServiceCatalogById } from './find-service-catalog-by-id.service';

describe('FindServiceCatalogById - Integration tests', () => {
  let sut: FindServiceCatalogById;
  let prisma: PrismaService;
  let serviceCatalogDao: IServiceCatalogDao;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(FindServiceCatalogById);
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

  it('should throw ServiceCatalogNotFoundError when service does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceCatalogNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Serviço não encontrado na base de dados.');
  });

  it('should throw ServiceCatalogNotFoundError when service is inactive and onlyActive is true', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Inativo ${Date.now()}`,
        unitPriceInCents: 1000,
        description: 'D',
        isCommercial: true,
        active: false,
      },
    });

    await expect(sut.execute(created.id, { onlyActive: true })).rejects.toThrow(ServiceCatalogNotFoundError);
    await expect(sut.execute(created.id, { onlyActive: true })).rejects.toThrow(
      'Serviço não encontrado na base de dados.',
    );
  });

  it('should return service catalog by id', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Nome ${Date.now()}`,
        unitPriceInCents: 5000,
        description: 'Descrição',
        isCommercial: true,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.id).toBe(created.id);
    expect(result.name).toBe(created.name);
    expect(result.active).toBe(true);
  });

  it('should return all ServiceCatalogDto fields correctly', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `VIP ${Date.now()}`,
        unitPriceInCents: 100,
        description: 'Texto',
        isCommercial: false,
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    const expected = await serviceCatalogDao.findById(created.id);
    expect(result).toEqual<ServiceCatalogDto>(expected!);
  });

  it('should return inactive service when onlyActive is not set', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Off ${Date.now()}`,
        unitPriceInCents: 1,
        description: 'D',
        isCommercial: true,
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.active).toBe(false);
  });
});
