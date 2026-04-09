import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightAlreadyExistsError } from '../../../domain/errors/freight-already-exists.error';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import { FreightModule } from '../../../freight.module';
import { EditFreightInputDto } from './dtos/edit-freight.dto';
import { EditFreight } from './edit-freight.service';

describe('EditFreight - Integration tests', () => {
  let sut: EditFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FreightModule],
    }).compile();

    sut = module.get(EditFreight);
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

  it('should throw FreightNotFoundError when freight does not exist', async() => {
    const data: EditFreightInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(FreightNotFoundError);
  });

  it('should update freight name', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditFreightInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(freightRow.id, data);

    const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const data: EditFreightInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(freightRow.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw FreightAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Freight A ${Date.now()}`;
    await prisma.freight.create({ data: { name: nameA, active: true } });
    const freightB = await prisma.freight.create({
      data: { name: `Freight B ${Date.now()}`, active: true },
    });

    const data: EditFreightInputDto = { name: nameA };
    await expect(sut.execute(freightB.id, data)).rejects.toThrow(FreightAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same freight being edited', async() => {
    const name = `Freight ${Date.now()}`;
    const freightRow = await prisma.freight.create({ data: { name, active: true } });

    const data: EditFreightInputDto = { name };
    await sut.execute(freightRow.id, data);

    const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
