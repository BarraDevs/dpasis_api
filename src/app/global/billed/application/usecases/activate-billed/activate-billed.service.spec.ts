import { Test } from '@nestjs/testing';
import { BilledNotFoundError } from 'src/app/global/billed/domain/errors/billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { ActivateBilled } from './activate-billed.service';

describe('ActivateBilled - Integration tests', () => {
  let sut: ActivateBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(ActivateBilled);
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

  it('should throw BilledNotFoundError when billed does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(BilledNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Faturado não encontrado na base de dados.');
  });

  it('should activate billed in database', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Inativo',
        isJunction: false,
        installmentDays: [5],
        active: false,
      },
    });

    await sut.execute(created.id);

    const updated = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Para ativar',
        isJunction: false,
        installmentDays: [5, 15],
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Faturado ativado com sucesso' });
  });

  it('should be idempotent when billed is already active', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Já ativo',
        isJunction: false,
        installmentDays: [10],
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Faturado ativado com sucesso' });

    const updated = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(true);
  });
});
