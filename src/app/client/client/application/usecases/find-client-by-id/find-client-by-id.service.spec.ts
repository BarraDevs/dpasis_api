import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindClientById } from './find-client-by-id.service';

describe('FindClientById - Integration tests', () => {
  let sut: FindClientById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(FindClientById);
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
    await expect(sut.execute(99999)).rejects.toThrow(ClientNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Cliente não encontrado na base de dados.');
  });

  it('should throw ClientNotFoundError when onlyActive is true and client is inactive', async() => {
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
        active: false,
      },
    });

    await expect(sut.execute(client.id, true)).rejects.toThrow(ClientNotFoundError);
    await expect(sut.execute(client.id, true)).rejects.toThrow('Cliente não encontrado na base de dados.');
  });

  it('should return client when onlyActive is true and client is active', async() => {
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
        companyName: 'Empresa Ativa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id, true);

    expect(result).not.toBeNull();
    expect(result.id).toBe(client.id);
    expect(result.active).toBe(true);
  });

  it('should return client by id', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: '123456789',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa LTDA',
        fantasyName: 'Empresa',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(client.id);
    expect(result.document).toBe('09748165000110');
    expect(result.companyName).toBe('Empresa LTDA');
    expect(result.type).toBe(ClientType.PJ);
  });

  it('should return all client fields correctly', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PF,
        document: '97456321558',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Pessoa Física',
        fantasyName: null,
        headquarters: 'Rio de Janeiro',
        invoiceType: ClientInvoiceType.INDIVIDUAL,
        generateInvoice: false,
        active: false,
      },
    });

    const result = await sut.execute(client.id);

    expect(result).toEqual({
      id: client.id,
      type: ClientType.PF,
      document: '97456321558',
      ie: null,
      groupId: group.id,
      ownerId: owner.id,
      companyName: 'Pessoa Física',
      fantasyName: null,
      headquarters: 'Rio de Janeiro',
      invoiceType: ClientInvoiceType.INDIVIDUAL,
      generateInvoice: false,
      active: false,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  });
});
