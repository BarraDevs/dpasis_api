import { Test } from '@nestjs/testing';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindAllClientTypeQueryDto } from './dtos/find-all-client-type.dto';
import { FindAllClientType } from './find-all-client-type.service';

describe('FindAllClientType', () => {
  let sut: FindAllClientType;
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
    return {
      client,
      data: {
        clientId: client.id,
        clientAttendanceTypeId: attendanceType.id,
        clientMaintenanceTicketTypeId: maintenanceTicketType.id,
        clientSystemTypeId: systemType.id,
        clientDescriptionTypeId: descriptionType.id,
        clientDriveTypeId: driveType.id,
        quantity: 5,
      },
    };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientTypeModule],
    }).compile();

    sut = module.get(FindAllClientType);
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

  it('should return empty pagination when no client types exist', async() => {
    const { client } = await createClientTypeFixtures();
    const query: FindAllClientTypeQueryDto = { clientId: client.id };

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return paginated client types for client', async() => {
    const { client, data } = await createClientTypeFixtures();
    await prisma.clientType.create({ data });
    await prisma.clientType.create({ data });
    const query: FindAllClientTypeQueryDto = { clientId: client.id };

    const result = await sut.execute(query);

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every(d => d.clientId === client.id)).toBe(true);
  });

  it('should return expanded objects in response', async() => {
    const { client, data } = await createClientTypeFixtures();
    const created = await prisma.clientType.create({ data });
    const query: FindAllClientTypeQueryDto = { clientId: client.id };

    const result = await sut.execute(query);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(created.id);
    expect(result.data[0].clientId).toBe(client.id);
    expect(result.data[0].clientSystemType).toBeDefined();
    expect(result.data[0].clientSystemType.id).toBeDefined();
    expect(result.data[0].clientSystemType.name).toBeDefined();
    expect(result.data[0].clientDriveType).toBeDefined();
    expect(result.data[0].clientDescriptionType).toBeDefined();
  });

  it('should paginate correctly', async() => {
    const { client, data } = await createClientTypeFixtures();
    for (let i = 0; i < 5; i++) {
      await prisma.clientType.create({ data });
    }

    const result1 = await sut.execute({ clientId: client.id, page: 1, size: 2 });
    const result2 = await sut.execute({ clientId: client.id, page: 2, size: 2 });

    expect(result1.data).toHaveLength(2);
    expect(result1.totalItems).toBe(5);
    expect(result2.data).toHaveLength(2);
    expect(result2.totalItems).toBe(5);
  });

  describe('filters', () => {
    it('should filter by active when active is true', async() => {
      const { client, data } = await createClientTypeFixtures();
      await prisma.clientType.create({ data });
      await prisma.clientType.create({ data: { ...data, active: false } });
      await prisma.clientType.create({ data });

      const result = await sut.execute({ clientId: client.id, active: true });

      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.data.every(d => d.active)).toBe(true);
    });

    it('should filter by active when active is false', async() => {
      const { client, data } = await createClientTypeFixtures();
      await prisma.clientType.create({ data });
      await prisma.clientType.create({ data: { ...data, active: false } });
      await prisma.clientType.create({ data: { ...data, active: false } });

      const result = await sut.execute({ clientId: client.id, active: false });

      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.data.every(d => !d.active)).toBe(true);
    });

    it('should filter by clientId - return only client types for specified client', async() => {
      const { client, data } = await createClientTypeFixtures();
      const { data: data2 } = await createClientTypeFixtures();
      await prisma.clientType.create({ data });
      await prisma.clientType.create({ data });
      await prisma.clientType.create({ data: data2 });

      const result = await sut.execute({ clientId: client.id });

      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.data.every(d => d.clientId === client.id)).toBe(true);
    });

    it('should filter by search - match clientSystemType name (case-insensitive)', async() => {
      const { client, data } = await createClientTypeFixtures();
      const systemTypeMatch = await prisma.clientSystemType.create({
        data: { name: 'Sistema Premium Busca', active: true },
      });
      const systemTypeNoMatch = await prisma.clientSystemType.create({
        data: { name: 'Outro Sistema', active: true },
      });
      await prisma.clientType.create({
        data: { ...data, clientSystemTypeId: systemTypeMatch.id },
      });
      await prisma.clientType.create({
        data: { ...data, clientSystemTypeId: systemTypeNoMatch.id },
      });

      const result = await sut.execute({ clientId: client.id, search: 'premium' });

      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.data[0].clientSystemType.name).toBe('Sistema Premium Busca');
    });

    it('should filter by search - match clientDescriptionType name', async() => {
      const { client, data } = await createClientTypeFixtures();
      const descMatch = await prisma.clientDescriptionType.create({
        data: { name: 'Descrição Especial', active: true },
      });
      await prisma.clientType.create({
        data: { ...data, clientDescriptionTypeId: descMatch.id },
      });

      const result = await sut.execute({ clientId: client.id, search: 'especial' });

      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.data[0].clientDescriptionType.name).toBe('Descrição Especial');
    });

    it('should filter by search - match clientDriveType name', async() => {
      const { client, data } = await createClientTypeFixtures();
      const driveMatch = await prisma.clientDriveType.create({
        data: { name: 'Google Drive Cloud', active: true },
      });
      await prisma.clientType.create({
        data: { ...data, clientDriveTypeId: driveMatch.id },
      });

      const result = await sut.execute({ clientId: client.id, search: 'google' });

      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.data[0].clientDriveType.name).toBe('Google Drive Cloud');
    });

    it('should return empty when search does not match any client type', async() => {
      const { client, data } = await createClientTypeFixtures();
      await prisma.clientType.create({ data });

      const result = await sut.execute({ clientId: client.id, search: 'termoQueNaoExiste' });

      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should combine clientId and search filters', async() => {
      const { client, data } = await createClientTypeFixtures();
      const { data: data2 } = await createClientTypeFixtures();
      const systemTypeMatch = await prisma.clientSystemType.create({
        data: { name: 'Sistema Unico Match', active: true },
      });
      await prisma.clientType.create({
        data: { ...data, clientSystemTypeId: systemTypeMatch.id },
      });
      await prisma.clientType.create({
        data: { ...data2, clientSystemTypeId: systemTypeMatch.id },
      });

      const result = await sut.execute({ clientId: client.id, search: 'unico' });

      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.data[0].clientId).toBe(client.id);
      expect(result.data[0].clientSystemType.name).toBe('Sistema Unico Match');
    });
  });
});
