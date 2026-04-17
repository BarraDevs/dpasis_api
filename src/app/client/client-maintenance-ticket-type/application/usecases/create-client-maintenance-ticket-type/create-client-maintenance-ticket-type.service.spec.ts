import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeModule } from '../../../client-maintenance-ticket-type.module';
import { ClientMaintenanceTicketTypeAlreadyExistsError } from '../../../domain/errors/client-maintenance-ticket-type-already-exists.error';
import { CreateClientMaintenanceTicketType } from './create-client-maintenance-ticket-type.service';
import { CreateClientMaintenanceTicketTypeInputDto } from './dtos/create-client-maintenance-ticket-type.dto';

describe('CreateClientMaintenanceTicketType - Integration tests', () => {
  let sut: CreateClientMaintenanceTicketType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketTypeModule],
    }).compile();

    sut = module.get(CreateClientMaintenanceTicketType);
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

  it('should throw ClientMaintenanceTicketTypeAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const name = `Manutenção ${Date.now()}-${Math.random()}`;
    const input: CreateClientMaintenanceTicketTypeInputDto = { name };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientMaintenanceTicketTypeAlreadyExistsError);
  });

  it('should create client maintenance ticket type and return id', async() => {
    // Arrange
    const input: CreateClientMaintenanceTicketTypeInputDto = {
      name: `Manutenção Preventiva ${Date.now()}-${Math.random()}`,
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client maintenance ticket type in database', async() => {
    // Arrange
    const input: CreateClientMaintenanceTicketTypeInputDto = {
      name: `Manutenção Corretiva ${Date.now()}-${Math.random()}`,
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientMaintenanceTicketType = await prisma.clientMaintenanceTicketType.findUnique({ where: { id } });
    expect(clientMaintenanceTicketType).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientMaintenanceTicketType?.createdAt).toBeInstanceOf(Date);
    expect(clientMaintenanceTicketType?.updatedAt).toBeInstanceOf(Date);
  });
});
