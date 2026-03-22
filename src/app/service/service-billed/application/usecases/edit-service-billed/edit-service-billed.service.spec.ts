import { Test } from '@nestjs/testing';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledModule } from '../../../service-billed.module';
import { EditServiceBilledInputDto } from './dtos/edit-service-billed.dto';
import { EditServiceBilled } from './edit-service-billed.service';

describe('EditServiceBilled - Integration tests', () => {
  let sut: EditServiceBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceBilledModule],
    }).compile();

    sut = module.get(EditServiceBilled);
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
    const input: EditServiceBilledInputDto = { description: 'Atualizado' };

    await expect(sut.execute(99999, input)).rejects.toThrow(ServiceBilledNotFoundError);
  });

  it('should update billed service description', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Original',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const result = await sut.execute(created.id, { description: 'Descrição atualizada' });
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
    expect(updated?.description).toBe('Descrição atualizada');
  });

  it('should update all fields', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Original',
        isJunction: false,
        installmentDays: [5],
        active: true,
      },
    });

    await sut.execute(created.id, {
      description: 'Nova descrição',
      isJunction: true,
      installmentDays: [10, 20, 30],
    });

    const updated = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
    expect(updated?.description).toBe('Nova descrição');
    expect(updated?.isJunction).toBe(true);
    expect(updated?.installmentDays).toEqual([10, 20, 30]);
  });
});
