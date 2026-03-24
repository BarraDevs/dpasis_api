import { Test } from '@nestjs/testing';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { seedServiceCatalogForeignKeys } from 'src/app/service/service-catalog/infra/driven/persistence/prisma/service-catalog-prisma-test.helpers';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceAttendanceValueModule } from '../../../service-attendance-value.module';
import { CreateServiceAttendanceValue } from './create-service-attendance-value.service';
import { CreateServiceAttendanceValueInputDto } from './dtos/create-service-attendance-value.dto';

async function seedActiveService(prisma: PrismaService): Promise<{ id: number }> {
  const fk = await seedServiceCatalogForeignKeys(prisma);
  const service = await prisma.service.create({
    data: {
      ...fk,
      name: 'Serviço teste attendance value',
      unitPriceInCents: 1000,
      description: 'Descrição para teste de integração',
      isCommercial: true,
      active: true,
    },
  });
  return { id: service.id };
}

describe('CreateServiceAttendanceValue - Integration tests', () => {
  let sut: CreateServiceAttendanceValue;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceAttendanceValueModule],
    }).compile();

    sut = module.get(CreateServiceAttendanceValue);
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

  it('should persist service attendance value when service catalog exists and is active', async() => {
    const { id: serviceId } = await seedActiveService(prisma);
    const input: CreateServiceAttendanceValueInputDto = {
      serviceId,
      values: { maoDeObra: 10000, deslocamento: 5000 },
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    const row = await prisma.serviceAttendanceValue.findUnique({
      where: { id: result.id },
    });
    expect(row).not.toBeNull();
    expect(row?.serviceId).toBe(serviceId);
    expect(row?.values).toEqual({ maoDeObra: 10000, deslocamento: 5000 });
    expect(row?.totalValueInCents).toBe(15000);
  });

  it('should throw ServiceCatalogNotFoundError when service is inactive', async() => {
    const { id: serviceId } = await seedActiveService(prisma);
    await prisma.service.update({
      where: { id: serviceId },
      data: { active: false },
    });

    const input: CreateServiceAttendanceValueInputDto = {
      serviceId,
      values: { maoDeObra: 1 },
    };

    await expect(sut.execute(input)).rejects.toThrow(ServiceCatalogNotFoundError);

    const count = await prisma.serviceAttendanceValue.count();
    expect(count).toBe(0);
  });

  it('should throw ServiceCatalogNotFoundError when service id does not exist', async() => {
    await seedActiveService(prisma);

    const input: CreateServiceAttendanceValueInputDto = {
      serviceId: 9_999_999,
      values: { maoDeObra: 1 },
    };

    await expect(sut.execute(input)).rejects.toThrow(ServiceCatalogNotFoundError);
  });
});
