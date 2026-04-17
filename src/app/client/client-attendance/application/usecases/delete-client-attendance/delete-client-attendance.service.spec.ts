import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceModule } from '../../../client-attendance.module';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import { DeleteClientAttendance } from './delete-client-attendance.service';

describe('DeleteClientAttendance - Integration tests', () => {
  let sut: DeleteClientAttendance;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceModule],
    }).compile();

    sut = module.get(DeleteClientAttendance);
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

  it('should delete client attendance from database', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientAttendance.id);

    // Assert
    const deleted = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientAttendance.id);

    // Assert
    expect(result).toEqual({ message: 'Atendimento de cliente excluído com sucesso' });
  });
});
