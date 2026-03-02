import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientOwnerModule } from '../../../client-owner.module';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import { UpdateClientOwnerStatus } from './update-client-owner-status.service';

describe('UpdateClientOwnerStatus - Integration tests', () => {
  let sut: UpdateClientOwnerStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientOwnerModule],
    }).compile();

    sut = module.get(UpdateClientOwnerStatus);
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

  it('should throw ClientOwnerNotFoundError when client owner does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientOwnerNotFoundError);
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: true },
    });

    // Act
    await sut.execute(clientOwner.id);

    // Assert
    const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: false },
    });

    // Act
    await sut.execute(clientOwner.id);

    // Assert
    const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: true },
    });

    // Act
    const result = await sut.execute(clientOwner.id);

    // Assert
    expect(result).toEqual({ message: 'Status do proprietário de clientes atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário Premium', active: true },
    });

    // Act
    await sut.execute(clientOwner.id);

    // Assert
    const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
    expect(updated?.name).toBe('Proprietário Premium');
    expect(updated?.active).toBe(false);
  });
});
