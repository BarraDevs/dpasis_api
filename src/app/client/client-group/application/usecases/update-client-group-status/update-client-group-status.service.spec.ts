import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientGroupModule } from '../../../client-group.module';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { UpdateClientGroupStatus } from './update-client-group-status.service';

describe('UpdateClientGroupStatus - Integration tests', () => {
  let sut: UpdateClientGroupStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(UpdateClientGroupStatus);
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

  it('should invert active from true to false', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });

    // Act
    await sut.execute(clientGroup.id);

    // Assert
    const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: false },
    });

    // Act
    await sut.execute(clientGroup.id);

    // Assert
    const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });

    // Act
    const result = await sut.execute(clientGroup.id);

    // Assert
    expect(result).toEqual({ message: 'Status do grupo de clientes atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo Premium', active: true },
    });

    // Act
    await sut.execute(clientGroup.id);

    // Assert
    const updated = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(updated?.name).toBe('Grupo Premium');
    expect(updated?.active).toBe(false);
  });
});
