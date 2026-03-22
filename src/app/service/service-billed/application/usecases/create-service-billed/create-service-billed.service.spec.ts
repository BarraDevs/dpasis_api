import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledModule } from '../../../service-billed.module';
import { CreateServiceBilled } from './create-service-billed.service';
import { CreateServiceBilledInputDto } from './dtos/create-service-billed.dto';

describe('CreateServiceBilled - Integration tests', () => {
  let sut: CreateServiceBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceBilledModule],
    }).compile();

    sut = module.get(CreateServiceBilled);
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

  it('should create billed service and return id', async() => {
    const input: CreateServiceBilledInputDto = {
      description: `Descrição ${Date.now()}-${Math.random()}`,
      isJunction: false,
      installmentDays: [5, 15, 25],
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.serviceBilled.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.description).toBe(input.description);
    expect(saved?.isJunction).toBe(input.isJunction);
    expect(saved?.installmentDays).toEqual(input.installmentDays);
    expect(saved?.active).toBe(true);
  });

  it('should persist billed service with isJunction true and empty installmentDays', async() => {
    const input: CreateServiceBilledInputDto = {
      description: `Junção ${Date.now()}`,
      isJunction: true,
      installmentDays: [],
    };

    const { id } = await sut.execute(input);

    const serviceBilled = await prisma.serviceBilled.findUnique({ where: { id } });
    expect(serviceBilled).toEqual(
      expect.objectContaining({
        id,
        description: input.description,
        isJunction: true,
        installmentDays: [],
        active: true,
      }),
    );
    expect(serviceBilled?.createdAt).toBeInstanceOf(Date);
    expect(serviceBilled?.updatedAt).toBeInstanceOf(Date);
  });
});
