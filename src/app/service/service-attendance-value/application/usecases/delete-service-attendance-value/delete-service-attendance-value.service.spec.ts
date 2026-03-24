import { Test } from '@nestjs/testing';
import { ServiceAttendanceValueNotFoundError } from 'src/app/service/service-attendance-value/domain/errors/service-attendance-value-not-found.error';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceAttendanceValueModule } from '../../../service-attendance-value.module';
import { DeleteServiceAttendanceValue } from './delete-service-attendance-value.service';

async function seedActiveService(prisma: PrismaService): Promise<{ id: number }> {
  const fk = await seedServiceCatalogForeignKeys(prisma);
  const service = await prisma.service.create({
    data: {
      ...fk,
      name: 'Serviço teste delete attendance value',
      unitPriceInCents: 1000,
      description: 'Descrição para teste de integração',
      isCommercial: true,
      active: true,
    },
  });
  return { id: service.id };
}

describe('DeleteServiceAttendanceValue - Integration tests', () => {
  let sut: DeleteServiceAttendanceValue;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceAttendanceValueModule],
    }).compile();

    sut = module.get(DeleteServiceAttendanceValue);
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

  it('should delete existing row and return success message', async() => {
    const { id: serviceId } = await seedActiveService(prisma);
    const created = await prisma.serviceAttendanceValue.create({
      data: {
        serviceId,
        values: { maoDeObra: 100, deslocamento: 50 },
        totalValueInCents: 150,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
    const row = await prisma.serviceAttendanceValue.findUnique({
      where: { id: created.id },
    });
    expect(row).toBeNull();
  });

  it('should throw ServiceAttendanceValueNotFoundError when id does not exist', async() => {
    await expect(sut.execute(9_999_999)).rejects.toThrow(ServiceAttendanceValueNotFoundError);
  });
});
