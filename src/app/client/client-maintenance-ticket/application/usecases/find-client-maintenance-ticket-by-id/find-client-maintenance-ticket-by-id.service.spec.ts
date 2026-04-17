import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketModule } from '../../../client-maintenance-ticket.module';
import { ClientMaintenanceTicketNotFoundError } from '../../../domain/errors/client-maintenance-ticket-not-found.error';
import { ClientMaintenanceTicketDto } from '../../dtos/client-maintenance-ticket.dto';
import { FindClientMaintenanceTicketById } from './find-client-maintenance-ticket-by-id.service';

describe('FindClientMaintenanceTicketById - Integration tests', () => {
  let sut: FindClientMaintenanceTicketById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketModule],
    }).compile();

    sut = module.get(FindClientMaintenanceTicketById);
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
    await expect(sut.execute(id)).rejects.toThrow('Chamado de manutenção de cliente não encontrado na base de dados.');
  });

  it('should throw ClientMaintenanceTicketNotFoundError when client maintenance ticket is inactive and onlyActive is true', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome Premium ${Date.now()}`, active: false },
    });

    // Act & Assert
    await expect(sut.execute(clientMaintenanceTicket.id, { onlyActive: true })).rejects.toThrow(ClientMaintenanceTicketNotFoundError);
    await expect(sut.execute(clientMaintenanceTicket.id, { onlyActive: true })).rejects.toThrow('Chamado de manutenção de cliente não encontrado na base de dados.');
  });

  it('should return client maintenance ticket by id', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome Premium ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicket.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientMaintenanceTicket.id);
    expect(result.name).toBe(clientMaintenanceTicket.name);
    expect(result.active).toBe(clientMaintenanceTicket.active);
  });

  it('should return all client maintenance ticket fields correctly', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome VIP ${Date.now()}`, active: false },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicket.id);

    // Assert
    expect(result).toEqual<ClientMaintenanceTicketDto>({
      id: clientMaintenanceTicket.id,
      name: clientMaintenanceTicket.name,
      active: clientMaintenanceTicket.active,
      createdAt: clientMaintenanceTicket.createdAt,
      updatedAt: clientMaintenanceTicket.updatedAt,
    });
  });
});
