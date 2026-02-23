import { Test } from '@nestjs/testing';
import { ClientOwnerModule } from 'src/app/client-owner/client-owner.module';
import { ClientOwnerAlreadyExistsError } from 'src/app/client-owner/domain/errors/client-owner-already-exists.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientOwner } from './create-client-owner.service';
import { CreateClientOwnerInputDto } from './dtos/create-client-owner.dto';

describe('CreateClientOwner - Integration tests', () => {
  let sut: CreateClientOwner;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientOwnerModule],
    }).compile();

    sut = module.get(CreateClientOwner);
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

  it('should throw ClientOwnerAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const input: CreateClientOwnerInputDto = {
      name: 'Proprietário Duplicado',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientOwnerAlreadyExistsError);
  });

  it('should create client owner and return id', async() => {
    // Arrange
    const input: CreateClientOwnerInputDto = {
      name: 'Proprietário Premium',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientOwner.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client owner in database', async() => {
    // Arrange
    const input: CreateClientOwnerInputDto = {
      name: 'Proprietário VIP',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientOwner = await prisma.clientOwner.findUnique({ where: { id } });
    expect(clientOwner).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientOwner?.createdAt).toBeInstanceOf(Date);
    expect(clientOwner?.updatedAt).toBeInstanceOf(Date);
  });
});
