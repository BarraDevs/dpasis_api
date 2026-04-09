import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermModule } from '../../../delivery-term.module';
import { DeliveryTermAlreadyExistsError } from '../../../domain/errors/delivery-term-already-exists.error';
import { CreateDeliveryTerm } from './create-delivery-term.service';
import { CreateDeliveryTermInputDto } from './dtos/create-delivery-term.dto';

describe('CreateDeliveryTerm - Integration tests', () => {
  let sut: CreateDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DeliveryTermModule],
    }).compile();

    sut = module.get(CreateDeliveryTerm);
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

  it('should throw DeliveryTermAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Term ${Date.now()}-${Math.random()}`;

    const input: CreateDeliveryTermInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(DeliveryTermAlreadyExistsError);
  });

  it('should create delivery term and return id', async() => {
    const input: CreateDeliveryTermInputDto = {
      name: `Imediato ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.deliveryTerm.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist delivery term in database', async() => {
    const input: CreateDeliveryTermInputDto = {
      name: `30 dias ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const deliveryTermRow = await prisma.deliveryTerm.findUnique({ where: { id } });
    expect(deliveryTermRow).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(deliveryTermRow?.createdAt).toBeInstanceOf(Date);
    expect(deliveryTermRow?.updatedAt).toBeInstanceOf(Date);
  });
});
