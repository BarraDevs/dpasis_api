import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeAlreadyExistsError } from '../../../domain/errors/client-description-type-already-exists.error';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import { EditClientDescriptionTypeInputDto } from './dtos/edit-client-description-type.dto';
import { EditClientDescriptionType } from './edit-client-description-type.service';

describe('EditClientDescriptionType - Integration tests', () => {
  let sut: EditClientDescriptionType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(EditClientDescriptionType);
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

  it('should throw ClientDescriptionTypeNotFoundError when client description type does not exist', async() => {
    const id = 0;

    const data: EditClientDescriptionTypeInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(id, data)).rejects.toThrow(ClientDescriptionTypeNotFoundError);
  });

  it('should update client description type name', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditClientDescriptionTypeInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(clientDescriptionType.id, data);

    const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const data: EditClientDescriptionTypeInputDto = { name: `Novo nome ${Date.now()}` };

    const result = await sut.execute(clientDescriptionType.id, data);
    expect(result).toEqual({ message: 'Tipo de descrição de cliente atualizado com sucesso' });
  });

  it('should throw ClientDescriptionTypeAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Tipo A ${Date.now()}`;
    await prisma.clientDescriptionType.create({
      data: { name: nameA, active: true },
    });
    const clientDescriptionTypeB = await prisma.clientDescriptionType.create({
      data: { name: `Tipo B ${Date.now()}`, active: true },
    });

    const data: EditClientDescriptionTypeInputDto = { name: nameA };

    await expect(sut.execute(clientDescriptionTypeB.id, data)).rejects.toThrow(ClientDescriptionTypeAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client description type being edited', async() => {
    const name = `Tipo ${Date.now()}`;
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name, active: true },
    });

    const data: EditClientDescriptionTypeInputDto = { name };
    await sut.execute(clientDescriptionType.id, data);

    const updated = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
