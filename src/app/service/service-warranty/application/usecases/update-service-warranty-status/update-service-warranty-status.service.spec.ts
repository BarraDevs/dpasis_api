import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import { ServiceWarrantyModule } from '../../../service-warranty.module';
import { UpdateServiceWarrantyStatus } from './update-service-warranty-status.service';

describe('UpdateServiceWarrantyStatus - Integration tests', () => {
  let sut: UpdateServiceWarrantyStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceWarrantyModule],
    }).compile();

    sut = module.get(UpdateServiceWarrantyStatus);
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

  it('should throw ServiceWarrantyNotFoundError when service warranty does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceWarrantyNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    await sut.execute(serviceWarranty.id);

    const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: false },
    });

    await sut.execute(serviceWarranty.id);

    const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceWarranty.id);

    expect(result).toEqual({ message: 'Status da garantia de serviço atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `90 dias ${Date.now()}`, active: true },
    });

    await sut.execute(serviceWarranty.id);

    const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(updated?.name).toBe(serviceWarranty.name);
    expect(updated?.active).toBe(false);
  });
});
