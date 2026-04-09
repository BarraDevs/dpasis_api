import { Test } from '@nestjs/testing';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import {
    seedServiceCatalogForeignKeys,
    serviceFkScalars,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteServiceCatalog } from './delete-service-catalog.service';

describe('DeleteServiceCatalog - Integration tests', () => {
  let sut: DeleteServiceCatalog;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCatalogModule],
    }).compile();

    sut = module.get(DeleteServiceCatalog);
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

  it('should throw ServiceCatalogNotFoundError when service catalog does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceCatalogNotFoundError);
  });

  it('should remove service from services table', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Delete ${Date.now()}`,
        unitPriceInCents: 1000,
        description: 'Descrição',
        isCommercial: true,
        active: true,
      },
    });

    await sut.execute(created.id);

    const deleted = await prisma.service.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const fk = await seedServiceCatalogForeignKeys(prisma);
    const created = await prisma.service.create({
      data: {
        ...serviceFkScalars(fk),
        name: `Msg ${Date.now()}`,
        unitPriceInCents: 500,
        description: 'Descrição',
        isCommercial: false,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
