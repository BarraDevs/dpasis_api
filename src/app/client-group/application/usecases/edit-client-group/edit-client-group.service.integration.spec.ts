import { Test } from '@nestjs/testing';
import { ClientGroupModule } from 'src/app/client-group/client-group.module';
import { ClientGroupAlreadyExistsError } from 'src/app/client-group/domain/errors/client-group-already-exists.error';
import { ClientGroupNotFoundError } from 'src/app/client-group/domain/errors/client-group-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientGroupInputDto } from './dtos/edit-client-group.dto';
import { EditClientGroup } from './edit-client-group.service';

describe('EditClientGroup - Integration tests', () => {
  let sut: EditClientGroup;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(EditClientGroup);
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

  it('should throw ClientGroupNotFoundError when client group does not exist', async() => {
    // Arrange
    const id = 0;
    const data: EditClientGroupInputDto = { name: 'Novo nome' };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientGroupNotFoundError);
  });

  it('should update client group name', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Nome original', active: true },
    });
    const data: EditClientGroupInputDto = { name: 'Nome atualizado' };

    // Act
    await sut.execute(clientGroup.id, data);

    // Assert
    const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(updated?.name).toBe('Nome atualizado');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });
    const data: EditClientGroupInputDto = { name: 'Novo nome' };

    // Act
    const result = await sut.execute(clientGroup.id, data);

    // Assert
    expect(result).toEqual({ message: 'Grupo de clientes atualizado com sucesso' });
  });

  it('should throw ClientGroupAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    await prisma.clientGroup.create({
      data: { name: 'Grupo A', active: true },
    });
    const clientGroupB = await prisma.clientGroup.create({
      data: { name: 'Grupo B', active: true },
    });
    const data: EditClientGroupInputDto = { name: 'Grupo A' };

    // Act & Assert
    await expect(sut.execute(clientGroupB.id, data)).rejects.toThrow(ClientGroupAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same group being edited', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });
    const data: EditClientGroupInputDto = { name: 'Grupo' };

    // Act
    await sut.execute(clientGroup.id, data);

    // Assert
    const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(updated?.name).toBe('Grupo');
    expect(updated?.active).toBe(true);
  });
});
