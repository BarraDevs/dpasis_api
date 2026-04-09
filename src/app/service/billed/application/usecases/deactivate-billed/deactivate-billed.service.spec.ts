import { Test } from '@nestjs/testing';
import { BilledNotFoundError } from 'src/app/service/billed/domain/errors/billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { DeactivateBilled } from './deactivate-billed.service';

describe('DeactivateBilled - Integration tests', () => {
  let sut: DeactivateBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(DeactivateBilled);
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

  it('should deactivate billed in database', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Ativo',
        isJunction: false,
        installmentDays: [5],
        active: true,
      },
    });

    await sut.execute(created.id);

    const updated = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Para desativar',
        isJunction: true,
        installmentDays: [],
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Faturado desativado com sucesso' });
  });

  it('should be idempotent when billed is already inactive', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Já inativo',
        isJunction: false,
        installmentDays: [10],
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Faturado desativado com sucesso' });

    const updated = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(false);
  });
});
