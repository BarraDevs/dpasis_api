import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAttendanceNotFoundError } from 'src/app/client/client-attendance/domain/errors/client-attendance-not-found.error';
import { ClientMaintenanceTicketNotFoundError } from 'src/app/client/client-maintenance-ticket/domain/errors/client-maintenance-ticket-not-found.error';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LinkClientAttendanceAndMaintenance } from './link-client-attendance-and-maintenance.service';

describe('LinkClientAttendanceAndMaintenance - Integration tests', () => {
  let sut: LinkClientAttendanceAndMaintenance;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(LinkClientAttendanceAndMaintenance);
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

  it('should throw ClientNotFoundError when client does not exist', async() => {
    await expect(
      sut.execute(99999, { attendanceId: 1, maintenanceTicketId: 1 }),
    ).rejects.toThrow(ClientNotFoundError);
    await expect(
      sut.execute(99999, { attendanceId: 1, maintenanceTicketId: 1 }),
    ).rejects.toThrow('Cliente não encontrado na base de dados.');
  });

  it('should throw ClientAttendanceNotFoundError when attendance does not exist', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(
      sut.execute(client.id, { attendanceId: 99999, maintenanceTicketId: 1 }),
    ).rejects.toThrow(ClientAttendanceNotFoundError);
  });

  it('should throw ClientAttendanceNotFoundError when attendance is inactive', async() => {
    const [group, resale, attendance] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.clientAttendance.create({ data: { name: `Att ${Date.now()}`, active: false } }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(
      sut.execute(client.id, { attendanceId: attendance.id, maintenanceTicketId: 1 }),
    ).rejects.toThrow(ClientAttendanceNotFoundError);
  });

  it('should throw ClientMaintenanceTicketNotFoundError when maintenance ticket does not exist', async() => {
    const [group, resale, attendance] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.clientAttendance.create({ data: { name: `Att ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(
      sut.execute(client.id, { attendanceId: attendance.id, maintenanceTicketId: 99999 }),
    ).rejects.toThrow(ClientMaintenanceTicketNotFoundError);
  });

  it('should throw ClientMaintenanceTicketNotFoundError when maintenance ticket is inactive', async() => {
    const [group, resale, attendance, ticket] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.clientAttendance.create({ data: { name: `Att ${Date.now()}`, active: true } }),
      prisma.clientMaintenanceTicket.create({ data: { name: `Tk ${Date.now()}`, active: false } }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(
      sut.execute(client.id, { attendanceId: attendance.id, maintenanceTicketId: ticket.id }),
    ).rejects.toThrow(ClientMaintenanceTicketNotFoundError);
  });

  it('should persist attendance and maintenance ticket ids on client', async() => {
    const [group, resale, attendance, ticket] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.clientAttendance.create({ data: { name: `Att ${Date.now()}`, active: true } }),
      prisma.clientMaintenanceTicket.create({ data: { name: `Tk ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id, {
      attendanceId: attendance.id,
      maintenanceTicketId: ticket.id,
    });

    expect(result).toEqual({ message: 'Vínculo atualizado com sucesso' });

    const updated = await prisma.client.findUnique({ where: { id: client.id } });
    expect(updated?.attendanceId).toBe(attendance.id);
    expect(updated?.maintenanceTicketId).toBe(ticket.id);
  });
});
