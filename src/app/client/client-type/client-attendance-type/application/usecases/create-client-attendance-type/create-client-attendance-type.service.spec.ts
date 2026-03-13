import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceTypeModule } from '../../../client-attendance-type.module';
import { ClientAttendanceTypeAlreadyExistsError } from '../../../domain/errors/client-attendance-type-already-exists.error';
import { CreateClientAttendanceType } from './create-client-attendance-type.service';
import { CreateClientAttendanceTypeInputDto } from './dtos/create-client-attendance-type.dto';

describe('CreateClientAttendanceType - Integration tests', () => {
  let sut: CreateClientAttendanceType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceTypeModule],
    }).compile();

    sut = module.get(CreateClientAttendanceType);
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

  it('should throw ClientAttendanceTypeAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const name = `Suporte ${Date.now()}-${Math.random()}`;
    const input: CreateClientAttendanceTypeInputDto = { name };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientAttendanceTypeAlreadyExistsError);
  });

  it('should create client attendance type and return id', async() => {
    // Arrange
    const input: CreateClientAttendanceTypeInputDto = {
      name: `Suporte Técnico ${Date.now()}-${Math.random()}`,
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientAttendanceType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client attendance type in database', async() => {
    // Arrange
    const input: CreateClientAttendanceTypeInputDto = {
      name: `Suporte VIP ${Date.now()}-${Math.random()}`,
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientAttendanceType = await prisma.clientAttendanceType.findUnique({ where: { id } });
    expect(clientAttendanceType).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientAttendanceType?.createdAt).toBeInstanceOf(Date);
    expect(clientAttendanceType?.updatedAt).toBeInstanceOf(Date);
  });
});
