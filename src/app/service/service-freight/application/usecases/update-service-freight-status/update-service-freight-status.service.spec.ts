import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import { ServiceFreightModule } from '../../../service-freight.module';
import { UpdateServiceFreightStatus } from './update-service-freight-status.service';

describe('UpdateServiceFreightStatus - Integration tests', () => {
  let sut: UpdateServiceFreightStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceFreightModule],
    }).compile();

    sut = module.get(UpdateServiceFreightStatus);
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

  it('should throw ServiceFreightNotFoundError when service freight does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceFreightNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    await sut.execute(serviceFreight.id);

    const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: false },
    });

    await sut.execute(serviceFreight.id);

    const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceFreight.id);

    expect(result).toEqual({ message: 'Status do frete de serviço atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `CIF ${Date.now()}`, active: true },
    });

    await sut.execute(serviceFreight.id);

    const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(updated?.name).toBe(serviceFreight.name);
    expect(updated?.active).toBe(false);
  });
});
