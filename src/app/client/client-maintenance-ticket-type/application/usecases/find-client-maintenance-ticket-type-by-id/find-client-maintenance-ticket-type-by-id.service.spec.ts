import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeModule } from '../../../client-maintenance-ticket-type.module';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import { ClientMaintenanceTicketTypeDto } from '../../dtos/client-maintenance-ticket-type.dto';
import { FindClientMaintenanceTicketTypeById } from './find-client-maintenance-ticket-type-by-id.service';

describe('FindClientMaintenanceTicketTypeById - Integration tests', () => {
  let sut: FindClientMaintenanceTicketTypeById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketTypeModule],
    }).compile();

    sut = module.get(FindClientMaintenanceTicketTypeById);
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

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientMaintenanceTicketTypeNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Tipo de chamado de manutenção de cliente não encontrado na base de dados.');
  });

  it('should throw ClientMaintenanceTicketTypeNotFoundError when client maintenance ticket type is inactive and onlyActive is true', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: false },
    });

    // Act & Assert
    await expect(sut.execute(clientMaintenanceTicketType.id, { onlyActive: true })).rejects.toThrow(ClientMaintenanceTicketTypeNotFoundError);
    await expect(sut.execute(clientMaintenanceTicketType.id, { onlyActive: true })).rejects.toThrow('Tipo de chamado de manutenção de cliente não encontrado na base de dados.');
  });

  it('should return client maintenance ticket type by id', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo Premium ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientMaintenanceTicketType.id);
    expect(result.name).toBe(clientMaintenanceTicketType.name);
    expect(result.active).toBe(clientMaintenanceTicketType.active);
  });

  it('should return all client maintenance ticket type fields correctly', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo VIP ${Date.now()}`, active: false },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    expect(result).toEqual<ClientMaintenanceTicketTypeDto>({
      id: clientMaintenanceTicketType.id,
      name: clientMaintenanceTicketType.name,
      active: clientMaintenanceTicketType.active,
      createdAt: clientMaintenanceTicketType.createdAt,
      updatedAt: clientMaintenanceTicketType.updatedAt,
    });
  });
});
