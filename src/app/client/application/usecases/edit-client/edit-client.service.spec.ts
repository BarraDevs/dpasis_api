import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client-group/domain/errors/client-group-not-found.error';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { ClientModule } from 'src/app/client/client.module';
import { ClientInvoiceType } from 'src/app/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EditClient } from './edit-client.service';

describe('EditClient - Integration tests', () => {
  let sut: EditClient;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule, ConfigModule],
    }).compile();

    sut = module.get(EditClient);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    if (prisma) {
      await prisma.truncate();
      await prisma.$disconnect();
    }
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientNotFoundError when client does not exist', async() => {
    await expect(sut.execute(99999, { companyName: 'Novo Nome' })).rejects.toThrow(ClientNotFoundError);
    await expect(sut.execute(99999, { companyName: 'Novo Nome' })).rejects.toThrow('Client não encontrado.');
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
