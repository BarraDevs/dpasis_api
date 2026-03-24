import { Test } from '@nestjs/testing';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeactivateServiceCatalog } from './deactivate-service-catalog.service';

describe('DeactivateServiceCatalog - Integration tests', () => {
  let sut: DeactivateServiceCatalog;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(DeactivateServiceCatalog);
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

  it('should throw ServiceCatalogNotFoundError when service does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceCatalogNotFoundError);
  });

  it('should set active to false in services table when it was true', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...fk,
        name: `Svc ${Date.now()}`,
        unitPriceInCents: 1000,
        description: 'Descrição',
        isCommercial: true,
        active: true,
      },
    });

    await sut.execute(created.id);

    const updated = await prisma.service.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...fk,
        name: `Svc ${Date.now()}`,
        unitPriceInCents: 1000,
        description: 'Descrição',
        isCommercial: true,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Serviço do catálogo desativado com sucesso' });
  });

  it('should preserve other fields when deactivating', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...fk,
        name: `Manutenção ${Date.now()}`,
        unitPriceInCents: 5000,
        description: 'Descrição completa',
        isCommercial: false,
        active: true,
      },
    });

    await sut.execute(created.id);

    const updated = await prisma.service.findUnique({ where: { id: created.id } });
    expect(updated).toEqual({
      ...created,
      active: false,
      updatedAt: updated!.updatedAt,
    });
  });

  it('should keep active false when already inactive', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...fk,
        name: `Svc ${Date.now()}`,
        unitPriceInCents: 1000,
        description: 'Descrição',
        isCommercial: true,
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Serviço do catálogo desativado com sucesso');
    const row = await prisma.service.findUnique({ where: { id: created.id } });
    expect(row).toEqual({
      ...created,
      active: false,
      updatedAt: row!.updatedAt,
    });
  });
});
