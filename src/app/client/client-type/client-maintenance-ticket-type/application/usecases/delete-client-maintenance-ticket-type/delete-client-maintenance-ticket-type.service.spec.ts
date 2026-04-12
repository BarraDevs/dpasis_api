import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketTypeModule } from '../../../client-maintenance-ticket-type.module';
import { ClientMaintenanceTicketTypeInUseError } from '../../../domain/errors/client-maintenance-ticket-type-in-use.error';
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

  it('should throw ClientMaintenanceTicketTypeInUseError when client types use the maintenance ticket type', async() => {
    const [attendanceType, maintenanceType, systemType, descriptionType, driveType] = await Promise.all([
      prisma.clientAttendanceType.create({ data: { name: `Atendimento ${Date.now()}`, active: true } }),
      prisma.clientMaintenanceTicketType.create({ data: { name: `Manutenção ${Date.now()}`, active: true } }),
      prisma.clientSystemType.create({ data: { name: `Sistema ${Date.now()}`, active: true } }),
      prisma.clientDescriptionType.create({ data: { name: `Descrição ${Date.now()}`, active: true } }),
      prisma.clientDriveType.create({ data: { name: `Drive ${Date.now()}`, active: true } }),
    ]);

    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: false,
        active: true,
      },
    });

    await prisma.clientType.create({
      data: {
        clientId: client.id,
        clientAttendanceTypeId: attendanceType.id,
        clientMaintenanceTicketTypeId: maintenanceType.id,
        clientSystemTypeId: systemType.id,
        clientDescriptionTypeId: descriptionType.id,
        clientDriveTypeId: driveType.id,
        quantity: 1,
      },
    });

    await expect(sut.execute(maintenanceType.id)).rejects.toThrow(ClientMaintenanceTicketTypeInUseError);
    await expect(sut.execute(maintenanceType.id)).rejects.toThrow(
      'Não é possível excluir pois existem tipos de cliente vinculados.',
    );

    const stillExists = await prisma.clientMaintenanceTicketType.findUnique({ where: { id: maintenanceType.id } });
    expect(stillExists).not.toBeNull();
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
