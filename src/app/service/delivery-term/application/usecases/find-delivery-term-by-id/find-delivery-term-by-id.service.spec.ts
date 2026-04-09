import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermModule } from '../../../delivery-term.module';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import { DeliveryTermDto } from '../../dtos/delivery-term.dto';
import { FindDeliveryTermById } from './find-delivery-term-by-id.service';

describe('FindDeliveryTermById - Integration tests', () => {
  let sut: FindDeliveryTermById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DeliveryTermModule],
    }).compile();

    sut = module.get(FindDeliveryTermById);
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
    await expect(sut.execute(0)).rejects.toThrow('Prazo de entrega não encontrado na base de dados.');
  });

  it('should throw DeliveryTermNotFoundError when delivery term is inactive and onlyActive is true', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(deliveryTermRow.id, { onlyActive: true })).rejects.toThrow(DeliveryTermNotFoundError);
    await expect(sut.execute(deliveryTermRow.id, { onlyActive: true })).rejects.toThrow('Prazo de entrega não encontrado na base de dados.');
  });

  it('should return delivery term by id', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(deliveryTermRow.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(deliveryTermRow.id);
    expect(result.name).toBe(deliveryTermRow.name);
    expect(result.active).toBe(deliveryTermRow.active);
  });

  it('should return all delivery term fields correctly', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(deliveryTermRow.id);

    expect(result).toEqual<DeliveryTermDto>({
      id: deliveryTermRow.id,
      name: deliveryTermRow.name,
      active: deliveryTermRow.active,
      createdAt: deliveryTermRow.createdAt,
      updatedAt: deliveryTermRow.updatedAt,
    });
  });
});
