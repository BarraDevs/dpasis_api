import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketModule } from '../../../client-maintenance-ticket.module';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import { DeleteClientMaintenanceTicket } from './delete-client-maintenance-ticket.service';

describe('DeleteClientMaintenanceTicket - Integration tests', () => {
  let sut: DeleteClientMaintenanceTicket;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketModule],
    }).compile();

    sut = module.get(DeleteClientMaintenanceTicket);
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

  it('should delete client maintenance ticket from database', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientMaintenanceTicket.id);

    // Assert
    const deleted = await prisma.clientMaintenanceTicket.findUnique({ where: { id: clientMaintenanceTicket.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicket.id);

    // Assert
    expect(result).toEqual({ message: 'Chamado de manutenção de cliente excluído com sucesso' });
  });
});
