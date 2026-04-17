import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceModule } from '../../../client-attendance.module';
import { ClientAttendanceAlreadyExistsError } from '../../../domain/errors/client-attendance-already-exists.error';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import { EditClientAttendanceInputDto } from './dtos/edit-client-attendance.dto';
import { EditClientAttendance } from './edit-client-attendance.service';

describe('EditClientAttendance - Integration tests', () => {
  let sut: EditClientAttendance;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceModule],
    }).compile();

    sut = module.get(EditClientAttendance);
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
    const data: EditClientAttendanceInputDto = { name: `Novo nome ${Date.now()}` };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientAttendanceNotFoundError);
  });

  it('should update client attendance name', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });
    const data: EditClientAttendanceInputDto = { name: `Nome atualizado ${Date.now()}` };

    // Act
    await sut.execute(clientAttendance.id, data);

    // Assert
    const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });
    const data: EditClientAttendanceInputDto = { name: `Novo nome ${Date.now()}` };

    // Act
    const result = await sut.execute(clientAttendance.id, data);

    // Assert
    expect(result).toEqual({ message: 'Atendimento de cliente atualizado com sucesso' });
  });

  it('should throw ClientAttendanceAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    const nameA = `Tipo A ${Date.now()}`;
    await prisma.clientAttendance.create({
      data: { name: nameA, active: true },
    });
    const secondAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo B ${Date.now()}`, active: true },
    });
    const data: EditClientAttendanceInputDto = { name: nameA };

    // Act & Assert
    await expect(sut.execute(secondAttendance.id, data)).rejects.toThrow(ClientAttendanceAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client attendance being edited', async() => {
    // Arrange
    const name = `Tipo ${Date.now()}`;
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name, active: true },
    });
    const data: EditClientAttendanceInputDto = { name };

    // Act
    await sut.execute(clientAttendance.id, data);

    // Assert
    const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
