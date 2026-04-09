import { Test } from '@nestjs/testing';
import { BilledNotFoundError } from 'src/app/service/billed/domain/errors/billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { EditBilledInputDto } from './dtos/edit-billed.dto';
import { EditBilled } from './edit-billed.service';

describe('EditBilled - Integration tests', () => {
  let sut: EditBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(EditBilled);
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
    const input: EditBilledInputDto = { description: 'Atualizado' };

    await expect(sut.execute(99999, input)).rejects.toThrow(BilledNotFoundError);
  });

  it('should update billed description', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Original',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const result = await sut.execute(created.id, { description: 'Descrição atualizada' });
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const updated = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(updated?.description).toBe('Descrição atualizada');
  });

  it('should update all fields', async() => {
    const created = await prisma.billed.create({
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

    const updated = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(updated?.description).toBe('Nova descrição');
    expect(updated?.isJunction).toBe(true);
    expect(updated?.installmentDays).toEqual([10, 20, 30]);
  });
});
