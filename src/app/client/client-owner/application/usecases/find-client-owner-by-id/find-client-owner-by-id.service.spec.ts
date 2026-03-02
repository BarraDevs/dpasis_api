import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientOwnerModule } from '../../../client-owner.module';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import { FindClientOwnerById } from './find-client-owner-by-id.service';

describe('FindClientOwnerById - Integration tests', () => {
  let sut: FindClientOwnerById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientOwnerModule],
    }).compile();

    sut = module.get(FindClientOwnerById);
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
    await expect(sut.execute(id)).rejects.toThrow('Proprietário de clientes não encontrado na base de dados.');
  });

  it('should return client owner by id', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário Premium', active: true },
    });

    // Act
    const result = await sut.execute(clientOwner.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientOwner.id);
    expect(result.name).toBe(clientOwner.name);
    expect(result.active).toBe(clientOwner.active);
  });

  it('should return all client owner fields correctly', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário VIP', active: false },
    });

    // Act
    const result = await sut.execute(clientOwner.id);

    // Assert
    expect(result).toEqual<ClientOwnerDto>({
      id: clientOwner.id,
      name: clientOwner.name,
      active: clientOwner.active,
      createdAt: clientOwner.createdAt,
      updatedAt: clientOwner.updatedAt,
    });
  });
});
