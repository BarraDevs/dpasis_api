import { Test } from '@nestjs/testing';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ActivateServiceCatalog } from './activate-service-catalog.service';

describe('ActivateServiceCatalog - Integration tests', () => {
  let sut: ActivateServiceCatalog;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(ActivateServiceCatalog);
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

  it('should set active to true in services table when it was false', async() => {
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

    await sut.execute(created.id);

    const updated = await prisma.service.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(true);
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
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Serviço do catálogo ativado com sucesso' });
  });

  it('should preserve other fields when activating', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...fk,
        name: `Manutenção ${Date.now()}`,
        unitPriceInCents: 5000,
        description: 'Descrição completa',
        isCommercial: false,
        active: false,
      },
    });

    await sut.execute(created.id);

    const updated = await prisma.service.findUnique({ where: { id: created.id } });
    expect(updated).toEqual({
      ...created,
      active: true,
      updatedAt: updated!.updatedAt,
    });
  });

  it('should keep active true when already active', async() => {
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

    expect(result.message).toBe('Serviço do catálogo ativado com sucesso');
    const row = await prisma.service.findUnique({ where: { id: created.id } });
    expect(row).toEqual({
      ...created,
      active: true,
      updatedAt: row!.updatedAt,
    });
  });
});
