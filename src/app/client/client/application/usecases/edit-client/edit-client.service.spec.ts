import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client/client-group/domain/errors/client-group-not-found.error';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClient } from './edit-client.service';

describe('EditClient - Integration tests', () => {
  let sut: EditClient;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(EditClient);
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
    await expect(sut.execute(99999, { companyName: 'Novo Nome' })).rejects.toThrow(ClientNotFoundError);
    await expect(sut.execute(99999, { companyName: 'Novo Nome' })).rejects.toThrow('Cliente não encontrado na base de dados.');
  });

  it('should update client and persist in database', async() => {
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
        companyName: 'Empresa Original',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id, { companyName: 'Empresa Atualizada' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const updated = await prisma.client.findUnique({ where: { id: client.id } });
    expect(updated?.companyName).toBe('Empresa Atualizada');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should return success message', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 2,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id, { fantasyName: 'Fantasia' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should allow setting document to match another client when duplicate documents are allowed', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    await prisma.client.create({
      data: {
        id: 3,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa 1',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const client2 = await prisma.client.create({
      data: {
        id: 4,
        type: ClientType.PJ,
        document: '09748165000121',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa 2',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client2.id, { document: '09748165000110' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.client.findUnique({ where: { id: client2.id } });
    expect(updated?.document).toBe('09748165000110');
  });

  it('should allow keeping same document when editing own client', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 5,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id, { companyName: 'Empresa Atualizada', document: '09748165000110' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.client.findUnique({ where: { id: client.id } });
    expect(updated?.companyName).toBe('Empresa Atualizada');
  });

  it('should throw ClientGroupNotFoundError when groupId is inactive', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    const inactiveGroup = await prisma.clientGroup.create({
      data: { name: `Grupo Inativo ${Date.now()}`, active: false },
    });
    const client = await prisma.client.create({
      data: {
        id: 6,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { groupId: inactiveGroup.id })).rejects.toThrow(
      ClientGroupNotFoundError,
    );
  });

  it('should throw ClientGroupNotFoundError when groupId does not exist', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 7,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { groupId: 99999 })).rejects.toThrow(ClientGroupNotFoundError);
  });

  it('should throw ResaleNotFoundError when resaleId is inactive', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    const inactiveResale = await prisma.resale.create({
      data: { ...buildMinimalResaleData(nextResaleFixtureId()), active: false },
    });
    const client = await prisma.client.create({
      data: {
        id: 8,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { resaleId: inactiveResale.id })).rejects.toThrow(
      ResaleNotFoundError,
    );
  });

  it('should throw ResaleNotFoundError when resaleId does not exist', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 9,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { resaleId: 99999 })).rejects.toThrow(ResaleNotFoundError);
  });

  it('should throw CompanyNotFoundError when companyId is inactive', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    const inactiveCompany = await prisma.company.create({
      data: {
        name: `Empresa Inativa ${Date.now()}`,
        fantasyName: 'Fantasia',
        document: `09.748.165/0001-${String(Date.now() % 100).padStart(2, '0')}`,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        email01: 'inactive@test.com',
        active: false,
      },
    });
    const client = await prisma.client.create({
      data: {
        id: 10,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        companies: { connect: [] },
      },
    });

    await expect(sut.execute(client.id, { companyIds: [inactiveCompany.id] })).rejects.toThrow(
      CompanyNotFoundError,
    );
  });

  it('should throw CompanyNotFoundError when companyId does not exist', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const company = await prisma.company.create({
      data: {
        name: `Empresa ${Date.now()}`,
        fantasyName: 'Fantasia',
        document: `09.748.165/0001-${String(Date.now() % 100).padStart(2, '0')}`,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        email01: 'edit@test.com',
        active: true,
      },
    });

    const client = await prisma.client.create({
      data: {
        id: 11,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        companies: { connect: [{ id: company.id }] },
      },
    });

    await expect(sut.execute(client.id, { companyIds: [99999] })).rejects.toThrow(CompanyNotFoundError);
  });

  it('should update companyIds when provided', async() => {
    const ts = Date.now();
    const [group, resale, company1, company2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${ts}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({
        data: {
          name: `Empresa1 ${ts}`,
          fantasyName: 'Fantasia',
          document: `09.748.165/0001-${String(ts).slice(-4)}`,
          zipCode: '01310100',
          street: 'Av Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          phone01: '11999999999',
          email01: `edit1${ts}@test.com`,
          active: true,
        },
      }),
      prisma.company.create({
        data: {
          name: `Empresa2 ${ts}`,
          fantasyName: 'Fantasia',
          document: `09.748.165/0002-${String(ts).slice(-4)}`,
          zipCode: '01310100',
          street: 'Av Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          phone01: '11999999999',
          email01: `edit2${ts}@test.com`,
          active: true,
        },
      }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 12,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        companies: { connect: [{ id: company1.id }] },
      },
    });

    await sut.execute(client.id, { companyIds: [company2.id] });

    const updated = await prisma.client.findUnique({
      where: { id: client.id },
      include: { companies: true },
    });
    expect(updated?.companies).toHaveLength(1);
    expect(updated?.companies[0].id).toBe(company2.id);
  });

  it('should update multiple fields', async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 13,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await sut.execute(client.id, {
      companyName: 'Nova Empresa',
      fantasyName: 'Fantasia',
      headquarters: 'Rio de Janeiro',
    });

    const updated = await prisma.client.findUnique({ where: { id: client.id } });
    expect(updated?.companyName).toBe('Nova Empresa');
    expect(updated?.fantasyName).toBe('Fantasia');
    expect(updated?.headquarters).toBe('Rio de Janeiro');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should persist honorificId when honorific is active', async() => {
    const honorific = await prisma.honorific.create({
      data: { name: `EditSet-${Date.now()}`, active: true },
    });
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 14,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await sut.execute(client.id, { honorificId: honorific.id });

    const updatedHonorificId = await prisma.client.findUnique({ where: { id: client.id } });
    expect(updatedHonorificId?.honorificId).toBe(honorific.id);
  });

  it('should clear honorificId when patched with null', async() => {
    const honorific = await prisma.honorific.create({
      data: { name: `EditClr-${Date.now()}`, active: true },
    });
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 15,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        honorificId: honorific.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await sut.execute(client.id, { honorificId: null });

    const cleared = await prisma.client.findUnique({ where: { id: client.id } });
    expect(cleared?.honorificId).toBeNull();
  });

  it('should throw HonorificNotFoundError when assigning inactive honorific', async() => {
    const honorific = await prisma.honorific.create({
      data: { name: `EditBan-${Date.now()}`, active: false },
    });
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 16,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { honorificId: honorific.id })).rejects.toThrow(
      HonorificNotFoundError,
    );
  });
});
