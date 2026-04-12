import { Test } from '@nestjs/testing';
import { ClientAttendanceTypeNotFoundError } from 'src/app/client/client-type/client-attendance-type/domain/errors/client-attendance-type-not-found.error';
import { ClientDescriptionTypeNotFoundError } from 'src/app/client/client-type/client-description-type/domain/errors/client-description-type-not-found.error';
import { ClientDriveTypeNotFoundError } from 'src/app/client/client-type/client-drive-type/domain/errors/client-drive-type-not-found.error';
import { ClientMaintenanceTicketTypeNotFoundError } from 'src/app/client/client-type/client-maintenance-ticket-type/domain/errors/client-maintenance-ticket-type-not-found.error';
import { ClientSystemTypeNotFoundError } from 'src/app/client/client-type/client-system-type/domain/errors/client-system-type-not-found.error';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientType } from './create-client-type.service';
import { CreateClientTypeInputDto, CreateClientTypeOutputDto } from './dtos/create-client-type.dto';

describe('CreateClientType', () => {
  let sut: CreateClientType;
  let prisma: PrismaService;

  const createClientTypeFixtures = async() => {
    const group = await prisma.clientGroup.create({
      data: { name: `Grupo ${Date.now()}-${Math.random()}`, active: true },
    });
    const owner = await prisma.clientOwner.create({
      data: { name: `Owner ${Date.now()}-${Math.random()}`, active: true },
    });
    const client = await prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
    const attendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Attendance ${Date.now()}-${Math.random()}`, active: true },
    });
    const maintenanceTicketType = await prisma.clientMaintenanceTicketType.create({
      data: { name: `Maintenance ${Date.now()}-${Math.random()}`, active: true },
    });
    const systemType = await prisma.clientSystemType.create({
      data: { name: `Sistema ${Date.now()}-${Math.random()}`, active: true },
    });
    const descriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Descrição ${Date.now()}-${Math.random()}`, active: true },
    });
    const driveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}-${Math.random()}`, active: true },
    });
    const data: CreateClientTypeInputDto = {
      clientId: client.id,
      clientAttendanceTypeId: attendanceType.id,
      clientMaintenanceTicketTypeId: maintenanceTicketType.id,
      clientSystemTypeId: systemType.id,
      clientDescriptionTypeId: descriptionType.id,
      clientDriveTypeId: driveType.id,
      quantity: 5,
    };
    return { client, data };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientTypeModule],
    }).compile();

    sut = module.get(CreateClientType);
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

  it('should create client type and return id', async() => {
    const { data } = await createClientTypeFixtures();

    const result = await sut.execute(data);

    expect(result).toBeDefined();
    expect(result).toMatchObject<CreateClientTypeOutputDto>({ id: expect.any(Number) });
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.clientId).toBe(data.clientId);
    expect(saved?.quantity).toBe(data.quantity);
    expect(saved?.active).toBe(true);
  });

  it('should persist in client_types table', async() => {
    const { data } = await createClientTypeFixtures();

    const { id } = await sut.execute(data);

    const row = await prisma.clientType.findUnique({ where: { id } });
    expect(row).toEqual(
      expect.objectContaining({
        id,
        clientId: data.clientId,
        quantity: data.quantity,
        active: true,
      }),
    );
    expect(row?.createdAt).toBeInstanceOf(Date);
    expect(row?.updatedAt).toBeInstanceOf(Date);
  });

  it('should create multiple client types for same client', async() => {
    const { data } = await createClientTypeFixtures();

    const result1 = await sut.execute(data);
    const result2 = await sut.execute(data);

    expect(result1.id).not.toBe(result2.id);
    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(2);
  });

  it('should throw ClientNotFoundError when client is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.client.update({
      where: { id: data.clientId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientAttendanceTypeNotFoundError when clientAttendanceType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientAttendanceType.update({
      where: { id: data.clientAttendanceTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientAttendanceTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientMaintenanceTicketTypeNotFoundError when clientMaintenanceTicketType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientMaintenanceTicketType.update({
      where: { id: data.clientMaintenanceTicketTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientMaintenanceTicketTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientSystemTypeNotFoundError when clientSystemType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientSystemType.update({
      where: { id: data.clientSystemTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientSystemTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientDescriptionTypeNotFoundError when clientDescriptionType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientDescriptionType.update({
      where: { id: data.clientDescriptionTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientDescriptionTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientDriveTypeNotFoundError when clientDriveType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientDriveType.update({
      where: { id: data.clientDriveTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientDriveTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });
});
