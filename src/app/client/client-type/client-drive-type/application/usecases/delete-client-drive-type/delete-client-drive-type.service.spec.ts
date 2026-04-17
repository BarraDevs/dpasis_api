import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeInUseError } from '../../../domain/errors/client-drive-type-in-use.error';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import { DeleteClientDriveType } from './delete-client-drive-type.service';

describe('DeleteClientDriveType - Integration tests', () => {
  let sut: DeleteClientDriveType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(DeleteClientDriveType);
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

  it('should throw ClientDriveTypeNotFoundError when client drive type does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientDriveTypeNotFoundError);
  });

  it('should throw ClientDriveTypeInUseError when client types use the drive type', async() => {
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

    const clientAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.MAIN,
        zipCode: '01310-100',
        street: 'Av. Teste',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
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
        clientAddressId: clientAddress.id,
        quantity: 1,
      },
    });

    await expect(sut.execute(driveType.id)).rejects.toThrow(ClientDriveTypeInUseError);
    await expect(sut.execute(driveType.id)).rejects.toThrow(
      'Não é possível excluir pois existem tipos de cliente vinculados.',
    );

    const stillExists = await prisma.clientDriveType.findUnique({ where: { id: driveType.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete client drive type from database', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    await sut.execute(clientDriveType.id);

    const deleted = await prisma.clientDriveType.findUnique({ where: { id: clientDriveType.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDriveType.id);

    expect(result).toEqual({ message: 'Tipo de drive de cliente excluído com sucesso' });
  });
});
