import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceModule } from '../../../client-attendance.module';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import { ClientAttendanceDto } from '../../dtos/client-attendance.dto';
import { FindClientAttendanceById } from './find-client-attendance-by-id.service';

describe('FindClientAttendanceById - Integration tests', () => {
  let sut: FindClientAttendanceById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceModule],
    }).compile();

    sut = module.get(FindClientAttendanceById);
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

  it('should throw ClientAttendanceNotFoundError when client attendance does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientAttendanceNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Atendimento de cliente não encontrado na base de dados.');
  });

  it('should throw ClientAttendanceNotFoundError when client attendance is inactive and onlyActive is true', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: false },
    });

    // Act & Assert
    await expect(sut.execute(clientAttendance.id, { onlyActive: true })).rejects.toThrow(ClientAttendanceNotFoundError);
    await expect(sut.execute(clientAttendance.id, { onlyActive: true })).rejects.toThrow('Atendimento de cliente não encontrado na base de dados.');
  });

  it('should return client attendance by id', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientAttendance.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientAttendance.id);
    expect(result.name).toBe(clientAttendance.name);
    expect(result.active).toBe(clientAttendance.active);
  });

  it('should return all client attendance fields correctly', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo VIP ${Date.now()}`, active: false },
    });

    // Act
    const result = await sut.execute(clientAttendance.id);

    // Assert
    expect(result).toEqual<ClientAttendanceDto>({
      id: clientAttendance.id,
      name: clientAttendance.name,
      active: clientAttendance.active,
      createdAt: clientAttendance.createdAt,
      updatedAt: clientAttendance.updatedAt,
    });
  });
});
