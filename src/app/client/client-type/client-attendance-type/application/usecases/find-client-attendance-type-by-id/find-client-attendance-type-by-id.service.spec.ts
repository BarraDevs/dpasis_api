import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceTypeModule } from '../../../client-attendance-type.module';
import { ClientAttendanceTypeNotFoundError } from '../../../domain/errors/client-attendance-type-not-found.error';
import { ClientAttendanceTypeDto } from '../../dtos/client-attendance-type.dto';
import { FindClientAttendanceTypeById } from './find-client-attendance-type-by-id.service';

describe('FindClientAttendanceTypeById - Integration tests', () => {
  let sut: FindClientAttendanceTypeById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceTypeModule],
    }).compile();

    sut = module.get(FindClientAttendanceTypeById);
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

  it('should throw ClientAttendanceTypeNotFoundError when client attendance type does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientAttendanceTypeNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Tipo de atendimento de cliente não encontrado na base de dados.');
  });

  it('should throw ClientAttendanceTypeNotFoundError when client attendance type is inactive and onlyActive is true', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: false },
    });

    // Act & Assert
    await expect(sut.execute(clientAttendanceType.id, { onlyActive: true })).rejects.toThrow(ClientAttendanceTypeNotFoundError);
    await expect(sut.execute(clientAttendanceType.id, { onlyActive: true })).rejects.toThrow('Tipo de atendimento de cliente não encontrado na base de dados.');
  });

  it('should return client attendance type by id', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientAttendanceType.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientAttendanceType.id);
    expect(result.name).toBe(clientAttendanceType.name);
    expect(result.active).toBe(clientAttendanceType.active);
  });

  it('should return all client attendance type fields correctly', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo VIP ${Date.now()}`, active: false },
    });

    // Act
    const result = await sut.execute(clientAttendanceType.id);

    // Assert
    expect(result).toEqual<ClientAttendanceTypeDto>({
      id: clientAttendanceType.id,
      name: clientAttendanceType.name,
      active: clientAttendanceType.active,
      createdAt: clientAttendanceType.createdAt,
      updatedAt: clientAttendanceType.updatedAt,
    });
  });
});
