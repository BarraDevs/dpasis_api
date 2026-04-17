import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceTypeModule } from '../../../client-attendance-type.module';
import { ClientAttendanceTypeNotFoundError } from '../../../domain/errors/client-attendance-type-not-found.error';
import { UpdateClientAttendanceTypeStatus } from './update-client-attendance-type-status.service';

describe('UpdateClientAttendanceTypeStatus - Integration tests', () => {
  let sut: UpdateClientAttendanceTypeStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceTypeModule],
    }).compile();

    sut = module.get(UpdateClientAttendanceTypeStatus);
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
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientAttendanceType.id);

    // Assert
    const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo ${Date.now()}`, active: false },
    });

    // Act
    await sut.execute(clientAttendanceType.id);

    // Assert
    const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientAttendanceType.id);

    // Assert
    expect(result).toEqual({ message: 'Status do tipo de atendimento de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Suporte Premium ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientAttendanceType.id);

    // Assert
    const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
    expect(updated?.name).toBe(clientAttendanceType.name);
    expect(updated?.active).toBe(false);
  });
});
