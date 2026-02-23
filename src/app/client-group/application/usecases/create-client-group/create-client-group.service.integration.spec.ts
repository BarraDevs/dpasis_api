import { Test } from '@nestjs/testing';
import { ClientGroupModule } from 'src/app/client-group/client-group.module';
import { ClientGroupAlreadyExistsError } from 'src/app/client-group/domain/errors/client-group-already-exists.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientGroup } from './create-client-group.service';
import { CreateClientGroupInputDto } from './dtos/create-client-group.dto';

describe('CreateClientGroup - Integration tests', () => {
  let sut: CreateClientGroup;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(CreateClientGroup);
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

  it('should throw ClientGroupAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const input: CreateClientGroupInputDto = {
      name: 'Grupo Duplicado',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientGroupAlreadyExistsError);
  });

  it('should create client group and return id', async() => {
    // Arrange
    const input: CreateClientGroupInputDto = {
      name: 'Grupo Premium',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientGroup.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client group in database', async() => {
    // Arrange
    const input: CreateClientGroupInputDto = {
      name: 'Grupo VIP',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientGroup = await prisma.clientGroup.findUnique({ where: { id } });
    expect(clientGroup).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientGroup?.createdAt).toBeInstanceOf(Date);
    expect(clientGroup?.updatedAt).toBeInstanceOf(Date);
  });
});
