import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketModule } from '../../../client-maintenance-ticket.module';
import { ClientMaintenanceTicketAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-already-exists.error';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import { EditClientMaintenanceTicketInputDto } from './dtos/edit-client-maintenance-ticket.dto';
import { EditClientMaintenanceTicket } from './edit-client-maintenance-ticket.service';

describe('EditClientMaintenanceTicket - Integration tests', () => {
  let sut: EditClientMaintenanceTicket;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketModule],
    }).compile();

    sut = module.get(EditClientMaintenanceTicket);
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

  it('should throw ClientMaintenanceTicketNotFoundError when client maintenance ticket does not exist', async() => {
    // Arrange
    const id = 0;
    const data: EditClientMaintenanceTicketInputDto = { name: `Novo nome ${Date.now()}` };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientMaintenanceTicketNotFoundError);
  });

  it('should update client maintenance ticket name', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });
    const data: EditClientMaintenanceTicketInputDto = { name: `Nome atualizado ${Date.now()}` };

    // Act
    await sut.execute(clientMaintenanceTicket.id, data);

    // Assert
    const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome ${Date.now()}`, active: true },
    });
    const data: EditClientMaintenanceTicketInputDto = { name: `Novo nome ${Date.now()}` };

    // Act
    const result = await sut.execute(clientMaintenanceTicket.id, data);

    // Assert
    expect(result).toEqual({ message: 'Chamado de manutenção de cliente atualizado com sucesso' });
  });

  it('should throw ClientMaintenanceTicketAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    const nameA = `Nome A ${Date.now()}`;
    await prisma.clientMaintenanceTicket.create({
      data: { name: nameA, active: true },
    });
    const secondMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome B ${Date.now()}`, active: true },
    });
    const data: EditClientMaintenanceTicketInputDto = { name: nameA };

    // Act & Assert
    await expect(sut.execute(secondMaintenanceTicket.id, data)).rejects.toThrow(ClientMaintenanceTicketAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client maintenance ticket being edited', async() => {
    // Arrange
    const name = `Nome ${Date.now()}`;
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name, active: true },
    });
    const data: EditClientMaintenanceTicketInputDto = { name };

    // Act
    await sut.execute(clientMaintenanceTicket.id, data);

    // Assert
    const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
