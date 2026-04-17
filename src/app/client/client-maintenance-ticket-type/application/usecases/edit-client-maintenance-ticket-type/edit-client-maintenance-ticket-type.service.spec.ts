import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeModule } from '../../../client-maintenance-ticket-type.module';
import { ClientMaintenanceTicketTypeAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-type-already-exists.error';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import { EditClientMaintenanceTicketTypeInputDto } from './dtos/edit-client-maintenance-ticket-type.dto';
import { EditClientMaintenanceTicketType } from './edit-client-maintenance-ticket-type.service';

describe('EditClientMaintenanceTicketType - Integration tests', () => {
  let sut: EditClientMaintenanceTicketType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketTypeModule],
    }).compile();

    sut = module.get(EditClientMaintenanceTicketType);
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

  it('should throw ClientMaintenanceTicketTypeNotFoundError when client maintenance ticket type does not exist', async() => {
    // Arrange
    const id = 0;
    const data: EditClientMaintenanceTicketTypeInputDto = { name: `Novo nome ${Date.now()}` };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientMaintenanceTicketTypeNotFoundError);
  });

  it('should update client maintenance ticket type name', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });
    const data: EditClientMaintenanceTicketTypeInputDto = { name: `Nome atualizado ${Date.now()}` };

    // Act
    await sut.execute(clientMaintenanceTicketType.id, data);

    // Assert
    const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });
    const data: EditClientMaintenanceTicketTypeInputDto = { name: `Novo nome ${Date.now()}` };

    // Act
    const result = await sut.execute(clientMaintenanceTicketType.id, data);

    // Assert
    expect(result).toEqual({ message: 'Tipo de chamado de manutenção de cliente atualizado com sucesso' });
  });

  it('should throw ClientMaintenanceTicketTypeAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    const nameA = `Tipo A ${Date.now()}`;
    await prisma.clientMaintenanceTicketType.create({
      data: { name: nameA, active: true },
    });
    const clientMaintenanceTicketTypeB = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo B ${Date.now()}`, active: true },
    });
    const data: EditClientMaintenanceTicketTypeInputDto = { name: nameA };

    // Act & Assert
    await expect(sut.execute(clientMaintenanceTicketTypeB.id, data)).rejects.toThrow(ClientMaintenanceTicketTypeAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client maintenance ticket type being edited', async() => {
    // Arrange
    const name = `Tipo ${Date.now()}`;
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name, active: true },
    });
    const data: EditClientMaintenanceTicketTypeInputDto = { name };

    // Act
    await sut.execute(clientMaintenanceTicketType.id, data);

    // Assert
    const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
