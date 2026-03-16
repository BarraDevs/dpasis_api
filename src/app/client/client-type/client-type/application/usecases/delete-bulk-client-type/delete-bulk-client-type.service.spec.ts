import { Test } from '@nestjs/testing';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteBulkClientType } from './delete-bulk-client-type.service';

describe('DeleteBulkClientType - Integration tests', () => {
  let sut: DeleteBulkClientType;
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
    const data = {
      clientId: client.id,
      clientAttendanceTypeId: attendanceType.id,
      clientMaintenanceTicketTypeId: maintenanceTicketType.id,
      clientSystemTypeId: systemType.id,
      clientDescriptionTypeId: descriptionType.id,
      clientDriveTypeId: driveType.id,
      quantity: 5,
      active: true,
    };
    return { client, data };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientTypeModule],
    }).compile();

    sut = module.get(DeleteBulkClientType);
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

  it('should return empty succeeded and failed when ids array is empty', async() => {
    const result = await sut.execute({ ids: [] });

    expect(result).toEqual({ succeeded: [], failed: [] });
  });

  it('should delete all client types successfully', async() => {
    const { data } = await createClientTypeFixtures();
    const [ct1, ct2, ct3] = await Promise.all([
      prisma.clientType.create({ data }),
      prisma.clientType.create({ data }),
      prisma.clientType.create({ data }),
    ]);

    const result = await sut.execute({ ids: [ct1.id, ct2.id, ct3.id] });

    expect(result.succeeded).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
    expect(result.succeeded.map(s => s.id)).toEqual([ct1.id, ct2.id, ct3.id]);

    const remaining = await prisma.clientType.count({ where: { id: { in: [ct1.id, ct2.id, ct3.id] } } });
    expect(remaining).toBe(0);
  });

  it('should report all as failed when all ids do not exist', async() => {
    const result = await sut.execute({ ids: [99999, 99998, 99997] });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(3);
    expect(result.failed.map(f => f.index)).toEqual([0, 1, 2]);
    expect(result.failed.every(f => f.error.length > 0)).toBe(true);
  });

  it('should report partial success when some ids exist and some do not', async() => {
    const { data } = await createClientTypeFixtures();
    const [ct1, ct2] = await Promise.all([
      prisma.clientType.create({ data }),
      prisma.clientType.create({ data }),
    ]);

    const result = await sut.execute({ ids: [ct1.id, 99999, ct2.id] });

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.succeeded.map(s => s.id)).toEqual([ct1.id, ct2.id]);
    expect(result.failed[0].index).toBe(1);
    expect(result.failed[0].error.length).toBeGreaterThan(0);

    const ct1Deleted = await prisma.clientType.findUnique({ where: { id: ct1.id } });
    const ct2Deleted = await prisma.clientType.findUnique({ where: { id: ct2.id } });
    expect(ct1Deleted).toBeNull();
    expect(ct2Deleted).toBeNull();
  });
});
