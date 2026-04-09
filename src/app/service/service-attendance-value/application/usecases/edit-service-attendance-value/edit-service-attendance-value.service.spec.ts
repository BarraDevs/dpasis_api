import { Test } from '@nestjs/testing';
import { ServiceAttendanceValueNotFoundError } from 'src/app/service/service-attendance-value/domain/errors/service-attendance-value-not-found.error';
import {
    seedServiceCatalogForeignKeys,
    serviceFkScalars,
} from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceAttendanceValueModule } from '../../../service-attendance-value.module';
import { EditServiceAttendanceValueInputDto } from './dtos/edit-service-attendance-value.dto';
import { EditServiceAttendanceValue } from './edit-service-attendance-value.service';

async function seedActiveService(prisma: PrismaService): Promise<{ id: number }> {
  const fk = await seedServiceCatalogForeignKeys(prisma);
  const service = await prisma.service.create({
    data: {
      ...serviceFkScalars(fk),
      companies: { connect: [{ id: fk.companyId }] },
      name: 'Serviço teste edit attendance value',
      unitPriceInCents: 1000,
      description: 'Descrição para teste de integração',
      isCommercial: true,
      active: true,
    },
  });
  return { id: service.id };
}

describe('EditServiceAttendanceValue - Integration tests', () => {
  let sut: EditServiceAttendanceValue;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceAttendanceValueModule],
    }).compile();

    sut = module.get(EditServiceAttendanceValue);
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

  it('should update values and totalValueInCents when row exists', async() => {
    const { id: serviceId } = await seedActiveService(prisma);
    const created = await prisma.serviceAttendanceValue.create({
      data: {
        serviceId,
        values: { maoDeObra: 100, deslocamento: 50 },
        totalValueInCents: 150,
      },
    });

    const data: EditServiceAttendanceValueInputDto = {
      values: { maoDeObra: 200, deslocamento: 100 },
    };

    const result = await sut.execute(created.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const row = await prisma.serviceAttendanceValue.findUnique({
      where: { id: created.id },
    });
    expect(row?.values).toEqual({ maoDeObra: 200, deslocamento: 100 });
    expect(row?.totalValueInCents).toBe(300);
    expect(row?.serviceId).toBe(serviceId);
  });

  it('should throw ServiceAttendanceValueNotFoundError when id does not exist', async() => {
    const data: EditServiceAttendanceValueInputDto = {
      values: { maoDeObra: 1 },
    };

    await expect(sut.execute(9_999_999, data)).rejects.toThrow(ServiceAttendanceValueNotFoundError);
  });
});
