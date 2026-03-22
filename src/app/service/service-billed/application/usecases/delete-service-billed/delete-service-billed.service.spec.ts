import { Test } from '@nestjs/testing';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledModule } from '../../../service-billed.module';
import { DeleteServiceBilled } from './delete-service-billed.service';

describe('DeleteServiceBilled - Integration tests', () => {
  let sut: DeleteServiceBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceBilledModule],
    }).compile();

    sut = module.get(DeleteServiceBilled);
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

  it('should delete billed service from database', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Para deletar',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const result = await sut.execute(created.id);
    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });

    const deleted = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
