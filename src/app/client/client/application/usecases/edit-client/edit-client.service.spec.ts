import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client/client-group/domain/errors/client-group-not-found.error';
import { ClientOwnerNotFoundError } from 'src/app/client/client-owner/domain/errors/client-owner-not-found.error';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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

  it('should throw DocumentAlreadyTakenError when document is taken by another client', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa 1',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const client2 = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000121',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa 2',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client2.id, { document: '09748165000110' })).rejects.toThrow(DocumentAlreadyTakenError);
    await expect(sut.execute(client2.id, { document: '09748165000110' })).rejects.toThrow('O documento 09748165000110 já está em uso.');
  });

  it('should allow keeping same document when editing own client', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    const inactiveGroup = await prisma.clientGroup.create({
      data: { name: `Grupo Inativo ${Date.now()}`, active: false },
    });
    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { groupId: 99999 })).rejects.toThrow(ClientGroupNotFoundError);
  });

  it('should throw ClientOwnerNotFoundError when ownerId is inactive', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    const inactiveOwner = await prisma.clientOwner.create({
      data: { name: `Owner Inativo ${Date.now()}`, active: false },
    });
    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { ownerId: inactiveOwner.id })).rejects.toThrow(
      ClientOwnerNotFoundError,
    );
  });

  it('should throw ClientOwnerNotFoundError when ownerId does not exist', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(client.id, { ownerId: 99999 })).rejects.toThrow(ClientOwnerNotFoundError);
  });

  it('should throw CompanyNotFoundError when companyId is inactive', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
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
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
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
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner, company1, company2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${ts}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${ts}`, active: true } }),
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
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
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
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
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
});
