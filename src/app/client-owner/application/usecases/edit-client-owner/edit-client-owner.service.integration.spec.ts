import { Test } from '@nestjs/testing';
import { ClientOwnerModule } from 'src/app/client-owner/client-owner.module';
import { ClientOwnerAlreadyExistsError } from 'src/app/client-owner/domain/errors/client-owner-already-exists.error';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientOwnerInputDto } from './dtos/edit-client-owner.dto';
import { EditClientOwner } from './edit-client-owner.service';

describe('EditClientOwner - Integration tests', () => {
  let sut: EditClientOwner;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientOwnerModule],
    }).compile();

    sut = module.get(EditClientOwner);
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
    const data: EditClientOwnerInputDto = { name: 'Novo nome' };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientOwnerNotFoundError);
  });

  it('should update client owner name', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Nome original', active: true },
    });
    const data: EditClientOwnerInputDto = { name: 'Nome atualizado' };

    // Act
    await sut.execute(clientOwner.id, data);

    // Assert
    const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
    expect(updated?.name).toBe('Nome atualizado');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: true },
    });
    const data: EditClientOwnerInputDto = { name: 'Novo nome' };

    // Act
    const result = await sut.execute(clientOwner.id, data);

    // Assert
    expect(result).toEqual({ message: 'Proprietário de clientes atualizado com sucesso' });
  });

  it('should throw ClientOwnerAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    await prisma.clientOwner.create({
      data: { name: 'Proprietário A', active: true },
    });
    const clientOwnerB = await prisma.clientOwner.create({
      data: { name: 'Proprietário B', active: true },
    });
    const data: EditClientOwnerInputDto = { name: 'Proprietário A' };

    // Act & Assert
    await expect(sut.execute(clientOwnerB.id, data)).rejects.toThrow(ClientOwnerAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same owner being edited', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: true },
    });
    const data: EditClientOwnerInputDto = { name: 'Proprietário' };

    // Act
    await sut.execute(clientOwner.id, data);

    // Assert
    const updated = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
    expect(updated?.name).toBe('Proprietário');
    expect(updated?.active).toBe(true);
  });
});
