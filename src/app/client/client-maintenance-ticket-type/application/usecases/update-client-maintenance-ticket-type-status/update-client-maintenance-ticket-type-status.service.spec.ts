import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeModule } from '../../../client-maintenance-ticket-type.module';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import { UpdateClientMaintenanceTicketTypeStatus } from './update-client-maintenance-ticket-type-status.service';

describe('UpdateClientMaintenanceTicketTypeStatus - Integration tests', () => {
  let sut: UpdateClientMaintenanceTicketTypeStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketTypeModule],
    }).compile();

    sut = module.get(UpdateClientMaintenanceTicketTypeStatus);
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
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo ${Date.now()}`, active: false },
    });

    // Act
    await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    expect(result).toEqual({ message: 'Status do tipo de chamado de manutenção de cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Manutenção Premium ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    const updated = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
    expect(updated?.name).toBe(clientMaintenanceTicketType.name);
    expect(updated?.active).toBe(false);
  });
});
