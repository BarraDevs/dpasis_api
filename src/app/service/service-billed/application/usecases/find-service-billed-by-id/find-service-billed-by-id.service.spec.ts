import { Test } from '@nestjs/testing';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledModule } from '../../../service-billed.module';
import { ServiceBilledDto } from '../../dtos/service-billed.dto';
import { FindServiceBilledById } from './find-service-billed-by-id.service';

describe('FindServiceBilledById - Integration tests', () => {
  let sut: FindServiceBilledById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceBilledModule],
    }).compile();

    sut = module.get(FindServiceBilledById);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should throw ServiceBilledNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ServiceBilledNotFoundError);
  });

  it('should throw ServiceBilledNotFoundError when onlyActive is true and billed service is inactive', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Descrição teste',
        isJunction: true,
        installmentDays: [5, 15, 25],
        active: false,
      },
    });

    await expect(sut.execute(created.id, { onlyActive: true })).rejects.toThrow(ServiceBilledNotFoundError);
  });

  it('should return billed service by id when onlyActive is true and billed service is active', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Descrição teste',
        isJunction: true,
        installmentDays: [5, 15, 25],
        active: true,
      },
    });

    const result = await sut.execute(created.id, { onlyActive: true });

    expect(result).toEqual<ServiceBilledDto>({
      id: created.id,
      description: 'Descrição teste',
      isJunction: true,
      installmentDays: [5, 15, 25],
      active: true,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should return billed service by id', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Descrição teste',
        isJunction: true,
        installmentDays: [5, 15, 25],
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual<ServiceBilledDto>({
      id: created.id,
      description: 'Descrição teste',
      isJunction: true,
      installmentDays: [5, 15, 25],
      active: false,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });
});
