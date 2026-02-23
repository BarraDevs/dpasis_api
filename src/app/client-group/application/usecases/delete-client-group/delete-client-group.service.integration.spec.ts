import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client-group/domain/errors/client-group-not-found.error';
import { ClientGroupModule } from 'src/app/client-group/client-group.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClientGroup } from './delete-client-group.service';

describe('DeleteClientGroup - Integration tests', () => {
  let sut: DeleteClientGroup;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(DeleteClientGroup);
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

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientGroupNotFoundError);
  });

  it('should delete client group from database', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });

    // Act
    await sut.execute(clientGroup.id);

    // Assert
    const deleted = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });

    // Act
    const result = await sut.execute(clientGroup.id);

    // Assert
    expect(result).toEqual({ message: 'Grupo de clientes excluído com sucesso' });
  });
});
