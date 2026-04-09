import { Test } from '@nestjs/testing';
import { ServiceAttendanceValueNotFoundError } from 'src/app/service/service-attendance-value/domain/errors/service-attendance-value-not-found.error';
import {
    seedServiceCatalogForeignKeys,
    serviceFkScalars,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceAttendanceValueModule } from '../../../service-attendance-value.module';
import { ServiceAttendanceValueDto } from '../../dtos/service-attendance-value.dto';
import { FindServiceAttendanceValueById } from './find-service-attendance-value-by-id.service';

async function seedActiveService(prisma: PrismaService): Promise<{ id: number }> {
  const fk = await seedServiceCatalogForeignKeys(prisma);
  const service = await prisma.service.create({
    data: {
      ...serviceFkScalars(fk),
      companies: { connect: [{ id: fk.companyId }] },
      name: 'Serviço teste find-by-id attendance value',
      unitPriceInCents: 1000,
      description: 'Descrição para teste de integração',
      isCommercial: true,
      active: true,
    },
  });
  return { id: service.id };
}

describe('FindServiceAttendanceValueById - Integration tests', () => {
  let sut: FindServiceAttendanceValueById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceAttendanceValueModule],
    }).compile();

    sut = module.get(FindServiceAttendanceValueById);
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

  it('should return ServiceAttendanceValueDto matching persisted row', async() => {
    const { id: serviceId } = await seedActiveService(prisma);
    const created = await prisma.serviceAttendanceValue.create({
      data: {
        serviceId,
        values: { maoDeObra: 10000, deslocamento: 5000 },
        totalValueInCents: 15000,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual<ServiceAttendanceValueDto>({
      id: created.id,
      serviceId,
      values: { maoDeObra: 10000, deslocamento: 5000 },
      totalValueInCents: 15000,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should throw ServiceAttendanceValueNotFoundError when id does not exist', async() => {
    await seedActiveService(prisma);

    await expect(sut.execute(9_999_999)).rejects.toThrow(ServiceAttendanceValueNotFoundError);
  });
});
