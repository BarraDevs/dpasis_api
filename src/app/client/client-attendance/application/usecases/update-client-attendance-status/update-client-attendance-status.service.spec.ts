import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceModule } from '../../../client-attendance.module';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import { UpdateClientAttendanceStatus } from './update-client-attendance-status.service';

describe('UpdateClientAttendanceStatus - Integration tests', () => {
  let sut: UpdateClientAttendanceStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceModule],
    }).compile();

    sut = module.get(UpdateClientAttendanceStatus);
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
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientAttendance.id);

    // Assert
    const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo ${Date.now()}`, active: false },
    });

    // Act
    await sut.execute(clientAttendance.id);

    // Assert
    const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientAttendance.id);

    // Assert
    expect(result).toEqual({ message: 'Status do atendimento de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Suporte Premium ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientAttendance.id);

    // Assert
    const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
    expect(updated?.name).toBe(clientAttendance.name);
    expect(updated?.active).toBe(false);
  });
});
