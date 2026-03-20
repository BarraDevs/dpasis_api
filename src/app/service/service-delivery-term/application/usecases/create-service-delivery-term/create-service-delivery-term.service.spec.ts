import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermAlreadyExistsError } from '../../../domain/errors/service-delivery-term-already-exists.error';
import { ServiceDeliveryTermModule } from '../../../service-delivery-term.module';
import { CreateServiceDeliveryTerm } from './create-service-delivery-term.service';
import { CreateServiceDeliveryTermInputDto } from './dtos/create-service-delivery-term.dto';

describe('CreateServiceDeliveryTerm - Integration tests', () => {
  let sut: CreateServiceDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceDeliveryTermModule],
    }).compile();

    sut = module.get(CreateServiceDeliveryTerm);
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

  it('should throw ServiceDeliveryTermAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Term ${Date.now()}-${Math.random()}`;

    const input: CreateServiceDeliveryTermInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ServiceDeliveryTermAlreadyExistsError);
  });

  it('should create service delivery term and return id', async() => {
    const input: CreateServiceDeliveryTermInputDto = {
      name: `Imediato ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.serviceDeliveryTerm.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist service delivery term in database', async() => {
    const input: CreateServiceDeliveryTermInputDto = {
      name: `30 dias ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.findUnique({ where: { id } });
    expect(serviceDeliveryTerm).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(serviceDeliveryTerm?.createdAt).toBeInstanceOf(Date);
    expect(serviceDeliveryTerm?.updatedAt).toBeInstanceOf(Date);
  });
});
