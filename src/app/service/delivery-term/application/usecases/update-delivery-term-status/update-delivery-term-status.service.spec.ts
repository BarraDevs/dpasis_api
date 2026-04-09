import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermModule } from '../../../delivery-term.module';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import { UpdateDeliveryTermStatus } from './update-delivery-term-status.service';

describe('UpdateDeliveryTermStatus - Integration tests', () => {
  let sut: UpdateDeliveryTermStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DeliveryTermModule],
    }).compile();

    sut = module.get(UpdateDeliveryTermStatus);
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

  it('should throw DeliveryTermNotFoundError when delivery term does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(DeliveryTermNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    await sut.execute(deliveryTermRow.id);

    const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: false },
    });

    await sut.execute(deliveryTermRow.id);

    const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const result = await sut.execute(deliveryTermRow.id);

    expect(result).toEqual({ message: 'Status do prazo de entrega atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Imediato ${Date.now()}`, active: true },
    });

    await sut.execute(deliveryTermRow.id);

    const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
    expect(updated?.name).toBe(deliveryTermRow.name);
    expect(updated?.active).toBe(false);
  });
});
