import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceTypeModule } from '../../../client-attendance-type.module';
import { ClientAttendanceTypeAlreadyExistsError } from '../../../domain/errors/client-attendance-type-already-exists.error';
import { ClientAttendanceTypeNotFoundError } from '../../../domain/errors/client-attendance-type-not-found.error';
import { EditClientAttendanceTypeInputDto } from './dtos/edit-client-attendance-type.dto';
import { EditClientAttendanceType } from './edit-client-attendance-type.service';

describe('EditClientAttendanceType - Integration tests', () => {
  let sut: EditClientAttendanceType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceTypeModule],
    }).compile();

    sut = module.get(EditClientAttendanceType);
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
    const data: EditClientAttendanceTypeInputDto = { name: `Novo nome ${Date.now()}` };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientAttendanceTypeNotFoundError);
  });

  it('should update client attendance type name', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });
    const data: EditClientAttendanceTypeInputDto = { name: `Nome atualizado ${Date.now()}` };

    // Act
    await sut.execute(clientAttendanceType.id, data);

    // Assert
    const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });
    const data: EditClientAttendanceTypeInputDto = { name: `Novo nome ${Date.now()}` };

    // Act
    const result = await sut.execute(clientAttendanceType.id, data);

    // Assert
    expect(result).toEqual({ message: 'Tipo de atendimento de cliente atualizado com sucesso' });
  });

  it('should throw ClientAttendanceTypeAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    const nameA = `Tipo A ${Date.now()}`;
    await prisma.clientAttendanceType.create({
      data: { name: nameA, active: true },
    });
    const clientAttendanceTypeB = await prisma.clientAttendanceType.create({
      data: { name: `Tipo B ${Date.now()}`, active: true },
    });
    const data: EditClientAttendanceTypeInputDto = { name: nameA };

    // Act & Assert
    await expect(sut.execute(clientAttendanceTypeB.id, data)).rejects.toThrow(ClientAttendanceTypeAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client attendance type being edited', async() => {
    // Arrange
    const name = `Tipo ${Date.now()}`;
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name, active: true },
    });
    const data: EditClientAttendanceTypeInputDto = { name };

    // Act
    await sut.execute(clientAttendanceType.id, data);

    // Assert
    const updated = await prisma.clientAttendanceType.findUnique({ where: { id: clientAttendanceType.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
