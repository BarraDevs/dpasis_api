import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyAlreadyExistsError } from '../../../domain/errors/warranty-already-exists.error';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import { WarrantyModule } from '../../../warranty.module';
import { EditWarrantyInputDto } from './dtos/edit-warranty.dto';
import { EditWarranty } from './edit-warranty.service';

describe('EditWarranty - Integration tests', () => {
  let sut: EditWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [WarrantyModule],
    }).compile();

    sut = module.get(EditWarranty);
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

  it('should throw WarrantyNotFoundError when warranty does not exist', async() => {
    const data: EditWarrantyInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(WarrantyNotFoundError);
  });

  it('should update warranty name', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditWarrantyInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(warranty.id, data);

    const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const data: EditWarrantyInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(warranty.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw WarrantyAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Warranty A ${Date.now()}`;
    await prisma.warranty.create({ data: { name: nameA, active: true } });
    const warrantyB = await prisma.warranty.create({
      data: { name: `Warranty B ${Date.now()}`, active: true },
    });

    const data: EditWarrantyInputDto = { name: nameA };
    await expect(sut.execute(warrantyB.id, data)).rejects.toThrow(WarrantyAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same warranty being edited', async() => {
    const name = `Warranty ${Date.now()}`;
    const warranty = await prisma.warranty.create({ data: { name, active: true } });

    const data: EditWarrantyInputDto = { name };
    await sut.execute(warranty.id, data);

    const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
