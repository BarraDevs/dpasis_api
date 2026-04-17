import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeModule } from '../../../client-maintenance-ticket-type.module';
import { ClientMaintenanceTicketTypeNotFoundError } from '../../../domain/errors/client-maintenance-ticket-type-not-found.error';
import { DeleteClientMaintenanceTicketType } from './delete-client-maintenance-ticket-type.service';

describe('DeleteClientMaintenanceTicketType - Integration tests', () => {
  let sut: DeleteClientMaintenanceTicketType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketTypeModule],
    }).compile();

    sut = module.get(DeleteClientMaintenanceTicketType);
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

  it('should delete client maintenance ticket type from database', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    const deleted = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: clientMaintenanceTicketType.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute(clientMaintenanceTicketType.id);

    // Assert
    expect(result).toEqual({ message: 'Tipo de chamado de manutenção de cliente excluído com sucesso' });
  });
});
