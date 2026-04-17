import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketModule } from '../../../client-maintenance-ticket.module';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import { UpdateClientMaintenanceTicketStatus } from './update-client-maintenance-ticket-status.service';

describe('UpdateClientMaintenanceTicketStatus - Integration tests', () => {
  let sut: UpdateClientMaintenanceTicketStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketModule],
    }).compile();

    sut = module.get(UpdateClientMaintenanceTicketStatus);
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

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientMaintenanceTicketNotFoundError);
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientMaintenanceTicket.id);

    // Assert
    const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome ${Date.now()}`, active: false },
    });

    // Act
    await sut.execute(clientMaintenanceTicket.id);

    // Assert
    const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicket.id);

    // Assert
    expect(result).toEqual({ message: 'Status do chamado de manutenção de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Manutenção Premium ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientMaintenanceTicket.id);

    // Assert
    const updated = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
    expect(updated?.name).toBe(clientMaintenanceTicket.name);
    expect(updated?.active).toBe(false);
  });
});
