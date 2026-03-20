import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import { ServiceDeliveryTermModule } from '../../../service-delivery-term.module';
import { UpdateServiceDeliveryTermStatus } from './update-service-delivery-term-status.service';

describe('UpdateServiceDeliveryTermStatus - Integration tests', () => {
  let sut: UpdateServiceDeliveryTermStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceDeliveryTermModule],
    }).compile();

    sut = module.get(UpdateServiceDeliveryTermStatus);
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

  it('should throw ServiceDeliveryTermNotFoundError when service delivery term does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceDeliveryTermNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    await sut.execute(serviceDeliveryTerm.id);

    const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: false },
    });

    await sut.execute(serviceDeliveryTerm.id);

    const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceDeliveryTerm.id);

    expect(result).toEqual({ message: 'Status do prazo de entrega atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Imediato ${Date.now()}`, active: true },
    });

    await sut.execute(serviceDeliveryTerm.id);

    const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(updated?.name).toBe(serviceDeliveryTerm.name);
    expect(updated?.active).toBe(false);
  });
});
