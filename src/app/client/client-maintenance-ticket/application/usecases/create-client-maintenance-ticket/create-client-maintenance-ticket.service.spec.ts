import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketModule } from '../../../client-maintenance-ticket.module';
import { ClientMaintenanceTicketAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-already-exists.error';
import { CreateClientMaintenanceTicket } from './create-client-maintenance-ticket.service';
import { CreateClientMaintenanceTicketInputDto } from './dtos/create-client-maintenance-ticket.dto';

describe('CreateClientMaintenanceTicket - Integration tests', () => {
  let sut: CreateClientMaintenanceTicket;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketModule],
    }).compile();

    sut = module.get(CreateClientMaintenanceTicket);
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

  it('should throw ClientMaintenanceTicketAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const name = `Manutenção ${Date.now()}-${Math.random()}`;
    const input: CreateClientMaintenanceTicketInputDto = { name };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientMaintenanceTicketAlreadyExistsError);
  });

  it('should create client maintenance ticket and return id', async() => {
    // Arrange
    const input: CreateClientMaintenanceTicketInputDto = {
      name: `Manutenção Preventiva ${Date.now()}-${Math.random()}`,
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientMaintenanceTicket.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client maintenance ticket in database', async() => {
    // Arrange
    const input: CreateClientMaintenanceTicketInputDto = {
      name: `Manutenção Corretiva ${Date.now()}-${Math.random()}`,
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.findUnique({ where: { id } });
    expect(clientMaintenanceTicket).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientMaintenanceTicket?.createdAt).toBeInstanceOf(Date);
    expect(clientMaintenanceTicket?.updatedAt).toBeInstanceOf(Date);
  });
});
