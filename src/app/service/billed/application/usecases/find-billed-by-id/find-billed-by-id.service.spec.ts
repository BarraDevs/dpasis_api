import { Test } from '@nestjs/testing';
import { BilledNotFoundError } from 'src/app/service/billed/domain/errors/billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { BilledDto } from '../../dtos/billed.dto';
import { FindBilledById } from './find-billed-by-id.service';

describe('FindBilledById - Integration tests', () => {
  let sut: FindBilledById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(FindBilledById);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should throw BilledNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(BilledNotFoundError);
  });

  it('should throw BilledNotFoundError when onlyActive is true and billed is inactive', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Descrição teste',
        isJunction: true,
        installmentDays: [5, 15, 25],
        active: false,
      },
    });

    await expect(sut.execute(created.id, { onlyActive: true })).rejects.toThrow(BilledNotFoundError);
  });

  it('should return billed by id when onlyActive is true and billed is active', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Descrição teste',
        isJunction: true,
        installmentDays: [5, 15, 25],
        active: true,
      },
    });

    const result = await sut.execute(created.id, { onlyActive: true });

    expect(result).toEqual<BilledDto>({
      id: created.id,
      description: 'Descrição teste',
      isJunction: true,
      installmentDays: [5, 15, 25],
      active: true,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should return billed by id', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Descrição teste',
        isJunction: true,
        installmentDays: [5, 15, 25],
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual<BilledDto>({
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
