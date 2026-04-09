import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermModule } from '../../../delivery-term.module';
import { DeliveryTermAlreadyExistsError } from '../../../domain/errors/delivery-term-already-exists.error';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import { EditDeliveryTermInputDto } from './dtos/edit-delivery-term.dto';
import { EditDeliveryTerm } from './edit-delivery-term.service';

describe('EditDeliveryTerm - Integration tests', () => {
  let sut: EditDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DeliveryTermModule],
    }).compile();

    sut = module.get(EditDeliveryTerm);
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

  it('should throw DeliveryTermNotFoundError when delivery term does not exist', async() => {
    const data: EditDeliveryTermInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(DeliveryTermNotFoundError);
  });

  it('should update delivery term name', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditDeliveryTermInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(deliveryTermRow.id, data);

    const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const data: EditDeliveryTermInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(deliveryTermRow.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw DeliveryTermAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Term A ${Date.now()}`;
    await prisma.deliveryTerm.create({ data: { name: nameA, active: true } });
    const deliveryTermB = await prisma.deliveryTerm.create({
      data: { name: `Term B ${Date.now()}`, active: true },
    });

    const data: EditDeliveryTermInputDto = { name: nameA };
    await expect(sut.execute(deliveryTermB.id, data)).rejects.toThrow(DeliveryTermAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same delivery term being edited', async() => {
    const name = `Term ${Date.now()}`;
    const deliveryTermRow = await prisma.deliveryTerm.create({ data: { name, active: true } });

    const data: EditDeliveryTermInputDto = { name };
    await sut.execute(deliveryTermRow.id, data);

    const updated = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
