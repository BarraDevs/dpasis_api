import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientFactory } from 'src/app/client/client/domain/factories/client.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientRepositoryAdapterPrisma } from './client-prisma.repository';

describe('ClientRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function createClientGroupResaleAndCompany() {
    const suffix = String(Date.now()).slice(-4);
    const [group, resale, honorific, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.honorific.create({ data: { name: `Sr. ${Date.now()}`, active: true } }),
      prisma.company.create({
        data: {
          name: `Empresa ${Date.now()}`,
          fantasyName: 'Fantasia',
          document: `09.748.165/0001-${suffix}`,
          zipCode: '01310100',
          street: 'Av Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          phone01: '11999999999',
          email01: `test${suffix}@test.com`,
          active: true,
        },
      }),
    ]);
    return { group, resale, honorific, company };
  }

  describe('save', () => {
    it('should persist client in clients table with correct data', async() => {
      const { group, resale, honorific, company } = await createClientGroupResaleAndCompany();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: '123456789',
        groupId: group.id,
        resaleId: resale.id,
        honorificId: honorific.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        parentClientId: null,
        socialName: 'Social LTDA',
        domain: 'empresa.com.br',
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: 'Empresa',
        headquarters: 'São Paulo',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.parentClientId).toBe(null);
      expect(saved?.isSubClient).toBe(false);
      expect(saved?.type).toBe(ClientType.PJ);
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.ie).toBe('123456789');
      expect(saved?.honorificId).toBe(honorific.id);
      expect(saved?.groupId).toBe(group.id);
      expect(saved?.resaleId).toBe(resale.id);
      expect(saved?.companyName).toBe('Empresa LTDA');
      expect(saved?.fantasyName).toBe('Empresa');
      expect(saved?.socialName).toBe('Social LTDA');
      expect(saved?.domain).toBe('empresa.com.br');
      expect(saved?.headquarters).toBe('São Paulo');
      expect(saved?.invoiceType).toBe(ClientInvoiceType.CONTRACT);
      expect(saved?.generateInvoice).toBe(true);
      expect(saved?.active).toBe(true);
      expect(saved?.createdAt).toBeInstanceOf(Date);
      expect(saved?.updatedAt).toBeInstanceOf(Date);
    });

    it('should persist explicit createdAt when provided on entity', async() => {
      const { group, resale, honorific, company } = await createClientGroupResaleAndCompany();
      const createdAt = new Date('2020-03-15T00:00:00.000Z');

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: '123456789',
        groupId: group.id,
        resaleId: resale.id,
        honorificId: honorific.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        parentClientId: null,
        socialName: 'Social LTDA',
        domain: 'empresa.com.br',
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: 'Empresa',
        headquarters: 'São Paulo',
        createdAt,
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });

      expect(saved?.createdAt).toEqual(createdAt);
    });

    it('should persist client with optional fields as null', async() => {
      const { group, resale, company } = await createClientGroupResaleAndCompany();

      const entity = ClientFactory.create({
        parentClientId: null,
        type: ClientType.PF,
        document: '974.563.215-58',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        companyName: 'Pessoa Física',
        honorificId: null,
        ie: null,
        fantasyName: null,
        socialName: null,
        domain: null,
        headquarters: 'Rio de Janeiro',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '97456321558' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.parentClientId).toBeNull();
      expect(saved?.honorificId).toBeNull();
      expect(saved?.ie).toBeNull();
      expect(saved?.fantasyName).toBeNull();
      expect(saved?.socialName).toBeNull();
      expect(saved?.domain).toBeNull();
    });

    it('should persist client with explicit id when entity has id > 0', async() => {
      const explicitId = 50_000;
      const { group, resale, company } = await createClientGroupResaleAndCompany();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        honorificId: null,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa Id Explícito',
        fantasyName: null,
        socialName: null,
        domain: null,
        parentClientId: null,
        headquarters: 'São Paulo',
        id: explicitId,
      });

      const returnedId = await sut.save(entity);

      expect(returnedId).toBe(explicitId);

      const saved = await prisma.client.findUnique({
        where: { id: explicitId },
      });

      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(explicitId);
      expect(saved?.companyName).toBe('Empresa Id Explícito');
    });
  });

  describe('edit', () => {
    it('should update client in database', async() => {
      const { group, resale, company } = await createClientGroupResaleAndCompany();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        honorificId: null,
        socialName: null,
        domain: null,
        parentClientId: null,
        generateInvoice: true,
        companyName: 'Nome Original',
        fantasyName: null,
        headquarters: 'São Paulo',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();

      const entityToEdit = ClientFactory.edit({
        ...entity.props,
        id: saved!.id,
        companyId: company.id,
        companyName: 'Nome Atualizado',
        fantasyName: 'Nova Fantasia',
        socialName: 'Nome social atualizado',
      });

      await sut.edit(entityToEdit);

      const updated = await prisma.client.findUnique({
        where: { id: saved!.id },
      });

      expect(updated?.companyName).toBe('Nome Atualizado');
      expect(updated?.fantasyName).toBe('Nova Fantasia');
      expect(updated?.socialName).toBe('Nome social atualizado');
      expect(updated?.document).toBe('09748165000110');
    });

    it('should persist parentClientId and isSubClient on edit', async() => {
      const { group, resale, company } = await createClientGroupResaleAndCompany();

      const parent = await prisma.client.create({
        data: {
          id: 80_001,
          type: ClientType.PJ,
          document: '28695096000179',
          ie: null,
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Cliente Pai',
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const childEntity = ClientFactory.create({
        id: 80_002,
        type: ClientType.PJ,
        document: '33000167000101',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        honorificId: null,
        generateInvoice: true,
        companyName: 'Cliente Filho',
        fantasyName: null,
        socialName: null,
        domain: null,
        headquarters: 'São Paulo',
        parentClientId: parent.id,
      });

      await sut.save(childEntity);

      const detachEntity = ClientFactory.edit({
        ...childEntity.props,
        id: childEntity.props.id,
        companyId: childEntity.props.companyId,
        parentClientId: null,
      });

      await sut.edit(detachEntity);

      const afterDetach = await prisma.client.findUniqueOrThrow({ where: { id: 80_002 } });
      expect(afterDetach.parentClientId).toBeNull();
      expect(afterDetach.isSubClient).toBe(false);

      const reattach = ClientFactory.edit({
        ...detachEntity.props,
        id: 80_002,
        companyId: detachEntity.props.companyId,
        parentClientId: parent.id,
      });

      await sut.edit(reattach);

      const afterReattach = await prisma.client.findUniqueOrThrow({ where: { id: 80_002 } });
      expect(afterReattach.parentClientId).toBe(parent.id);
      expect(afterReattach.isSubClient).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return null when client does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return client entity when found', async() => {
      const { group, resale, company } = await createClientGroupResaleAndCompany();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        socialName: null,
        domain: null,
        parentClientId: null,
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        honorificId: null,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa',
        fantasyName: null,
        headquarters: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();

      const found = await sut.findById(saved!.id);

      expect(found).not.toBeNull();
      expect(found?.props.id).toBe(saved!.id);
      expect(found?.props.companyName).toBe('Empresa');
      expect(found?.props.document).toBe('09748165000110');
      expect(found?.props.socialName).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove client from database', async() => {
      const { group, resale, company } = await createClientGroupResaleAndCompany();

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        socialName: null,
        domain: null,
        parentClientId: null,
        honorificId: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa Para Deletar',
        fantasyName: null,
        headquarters: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();

      await sut.delete(saved!.id);

      const deleted = await prisma.client.findUnique({
        where: { id: saved!.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('linkAttendanceAndMaintenance', () => {
    it('should set attendanceId and maintenanceTicketId on client', async() => {
      const { group, resale, company } = await createClientGroupResaleAndCompany();
      const [attendance, ticket] = await Promise.all([
        prisma.clientAttendance.create({ data: { name: `Att ${Date.now()}`, active: true } }),
        prisma.clientMaintenanceTicket.create({ data: { name: `Tk ${Date.now()}`, active: true } }),
      ]);

      const entity = ClientFactory.create({
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        socialName: null,
        domain: null,
        parentClientId: null,
        honorificId: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa',
        fantasyName: null,
        headquarters: 'SP',
      });

      await sut.save(entity);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();
      expect(saved?.attendanceId).toBeNull();
      expect(saved?.maintenanceTicketId).toBeNull();

      await sut.linkAttendanceAndMaintenance(saved!.id, attendance.id, ticket.id);

      const updated = await prisma.client.findUnique({
        where: { id: saved!.id },
      });

      expect(updated?.attendanceId).toBe(attendance.id);
      expect(updated?.maintenanceTicketId).toBe(ticket.id);
    });

    it('should throw when client does not exist', async() => {
      const [attendance, ticket] = await Promise.all([
        prisma.clientAttendance.create({ data: { name: `Att ${Date.now()}`, active: true } }),
        prisma.clientMaintenanceTicket.create({ data: { name: `Tk ${Date.now()}`, active: true } }),
      ]);

      await expect(
        sut.linkAttendanceAndMaintenance(99999, attendance.id, ticket.id),
      ).rejects.toThrow(PrismaClientKnownRequestError);

      await expect(
        sut.linkAttendanceAndMaintenance(99999, attendance.id, ticket.id),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });
});
