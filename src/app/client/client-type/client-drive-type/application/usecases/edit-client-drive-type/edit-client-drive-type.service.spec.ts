import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeAlreadyExistsError } from '../../../domain/errors/client-drive-type-already-exists.error';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import { EditClientDriveTypeInputDto } from './dtos/edit-client-drive-type.dto';
import { EditClientDriveType } from './edit-client-drive-type.service';

describe('EditClientDriveType - Integration tests', () => {
  let sut: EditClientDriveType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(EditClientDriveType);
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

  it('should throw ClientDriveTypeNotFoundError when client drive type does not exist', async() => {
    const data: EditClientDriveTypeInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ClientDriveTypeNotFoundError);
  });

  it('should update client drive type name', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditClientDriveTypeInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(clientDriveType.id, data);

    const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    const data: EditClientDriveTypeInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(clientDriveType.id, data);

    expect(result).toEqual({ message: 'Tipo de drive de cliente atualizado com sucesso' });
  });

  it('should throw ClientDriveTypeAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Drive A ${Date.now()}`;
    await prisma.clientDriveType.create({ data: { name: nameA, active: true } });
    const clientDriveTypeB = await prisma.clientDriveType.create({
      data: { name: `Drive B ${Date.now()}`, active: true },
    });

    const data: EditClientDriveTypeInputDto = { name: nameA };
    await expect(sut.execute(clientDriveTypeB.id, data)).rejects.toThrow(ClientDriveTypeAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client drive type being edited', async() => {
    const name = `Drive ${Date.now()}`;
    const clientDriveType = await prisma.clientDriveType.create({ data: { name, active: true } });

    const data: EditClientDriveTypeInputDto = { name };
    await sut.execute(clientDriveType.id, data);

    const updated = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
