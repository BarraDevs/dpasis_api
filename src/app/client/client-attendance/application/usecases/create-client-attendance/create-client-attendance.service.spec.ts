import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceModule } from '../../../client-attendance.module';
import { ClientAttendanceAlreadyExistsError } from '../../../domain/errors/client-attendance-already-exists.error';
import { CreateClientAttendance } from './create-client-attendance.service';
import { CreateClientAttendanceInputDto } from './dtos/create-client-attendance.dto';

describe('CreateClientAttendance - Integration tests', () => {
  let sut: CreateClientAttendance;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceModule],
    }).compile();

    sut = module.get(CreateClientAttendance);
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

  it('should throw ClientAttendanceAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const name = `Suporte ${Date.now()}-${Math.random()}`;
    const input: CreateClientAttendanceInputDto = { name };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientAttendanceAlreadyExistsError);
  });

  it('should create client attendance and return id', async() => {
    // Arrange
    const input: CreateClientAttendanceInputDto = {
      name: `Suporte Técnico ${Date.now()}-${Math.random()}`,
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientAttendance.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client attendance in database', async() => {
    // Arrange
    const input: CreateClientAttendanceInputDto = {
      name: `Suporte VIP ${Date.now()}-${Math.random()}`,
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientAttendance = await prisma.clientAttendance.findUnique({ where: { id } });
    expect(clientAttendance).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientAttendance?.createdAt).toBeInstanceOf(Date);
    expect(clientAttendance?.updatedAt).toBeInstanceOf(Date);
  });
});
