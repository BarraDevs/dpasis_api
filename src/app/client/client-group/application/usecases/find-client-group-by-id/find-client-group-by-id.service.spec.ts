import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientGroupModule } from '../../../client-group.module';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import { FindClientGroupById } from './find-client-group-by-id.service';

describe('FindClientGroupById - Integration tests', () => {
  let sut: FindClientGroupById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(FindClientGroupById);
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
    await expect(sut.execute(id)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
  });

  it('should return client group by id', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo Premium', active: true },
    });

    // Act
    const result = await sut.execute(clientGroup.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientGroup.id);
    expect(result.name).toBe(clientGroup.name);
    expect(result.active).toBe(clientGroup.active);
  });

  it('should return all client group fields correctly', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo VIP', active: false },
    });

    // Act
    const result = await sut.execute(clientGroup.id);

    // Assert
    expect(result).toEqual<ClientGroupDto>({
      id: clientGroup.id,
      name: clientGroup.name,
      active: clientGroup.active,
      createdAt: clientGroup.createdAt,
      updatedAt: clientGroup.updatedAt,
    });
  });
});
