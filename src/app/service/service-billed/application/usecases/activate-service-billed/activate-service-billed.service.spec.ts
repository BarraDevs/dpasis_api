import { Test } from '@nestjs/testing';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledModule } from '../../../service-billed.module';
import { ActivateServiceBilled } from './activate-service-billed.service';

describe('ActivateServiceBilled - Integration tests', () => {
  let sut: ActivateServiceBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceBilledModule],
    }).compile();

    sut = module.get(ActivateServiceBilled);
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

  it('should throw ServiceBilledNotFoundError when service billed does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ServiceBilledNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Serviço faturado não encontrado na base de dados.');
  });

  it('should activate service billed in database', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Inativo',
        isJunction: false,
        installmentDays: [5],
        active: false,
      },
    });

    await sut.execute(created.id);

    const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Para ativar',
        isJunction: false,
        installmentDays: [5, 15],
        active: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Serviço faturado ativado com sucesso' });
  });

  it('should be idempotent when service billed is already active', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Já ativo',
        isJunction: false,
        installmentDays: [10],
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Serviço faturado ativado com sucesso' });

    const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(true);
  });
});
