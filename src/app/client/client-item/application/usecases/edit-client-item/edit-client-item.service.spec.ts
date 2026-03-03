import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { EditClientItemInputDto } from './dtos/edit-client-item.dto';
import { EditClientItem } from './edit-client-item.service';

describe('EditClientItem - Integration tests', () => {
  let sut: EditClientItem;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(EditClientItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

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
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientItemNotFoundError when item does not exist', async() => {
    const data: EditClientItemInputDto = {
      description: 'Nova descrição',
    };

    await expect(sut.execute(99999, data)).rejects.toThrow(ClientItemNotFoundError);
  });

  it('should edit client item and return success message', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item original',
        quantity: 1,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    const data: EditClientItemInputDto = {
      description: 'Descrição atualizada',
      quantity: 3,
      unitValueInCents: 15000,
    };

    const result = await sut.execute(item.id, data);

    expect(result).toEqual({ message: 'Item do cliente atualizado com sucesso' });

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated).toEqual({
      ...item,
      description: data.description,
      quantity: data.quantity,
      unitValueInCents: data.unitValueInCents,
      updatedAt: updated?.updatedAt,
    });
  });

  it('should throw ClientNotFoundError when client is inactive', async() => {
    const [group2, owner2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);
    const inactiveClient = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group2.id,
        ownerId: owner2.id,
        companyName: 'Cliente Inativo',
        fantasyName: null,
        headquarters: 'Rio',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: false,
      },
    });

    const item = await prisma.clientItem.create({
      data: {
        clientId: inactiveClient.id,
        description: 'Item de cliente inativo',
        quantity: 1,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    const data: EditClientItemInputDto = { description: 'Tentativa de edição' };

    await expect(sut.execute(item.id, data)).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw ClientItemNotFoundError when id is 0', async() => {
    const data: EditClientItemInputDto = { description: 'Nova descrição' };

    await expect(sut.execute(0, data)).rejects.toThrow(ClientItemNotFoundError);
  });

  it('should throw ClientItemNotFoundError when id is negative', async() => {
    const data: EditClientItemInputDto = { description: 'Nova descrição' };

    await expect(sut.execute(-1, data)).rejects.toThrow(ClientItemNotFoundError);
  });

  it('should update only description when partial data is provided', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Descrição original',
        quantity: 5,
        unitValueInCents: 20000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '3',
      },
    });

    const data: EditClientItemInputDto = { description: 'Apenas descrição alterada' };

    await sut.execute(item.id, data);

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated).toEqual({
      ...item,
      description: data.description,
      updatedAt: updated?.updatedAt,
    });
  });

  it('should update only cnae, nbs and indop when provided', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Descrição fixa',
        quantity: 1,
        unitValueInCents: 10000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '1',
      },
    });

    const data: EditClientItemInputDto = {
      cnae: '9999999',
      nbs: '88888888',
      indop: '5',
    };

    await sut.execute(item.id, data);

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated).toEqual({
      ...item,
      cnae: data.cnae,
      nbs: data.nbs,
      indop: data.indop,
      updatedAt: updated?.updatedAt,
    });
  });

  it('should update quantity to zero when provided', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item com quantidade',
        quantity: 10,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    await sut.execute(item.id, { quantity: 0 });

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated?.quantity).toBe(0);
  });

  it('should not change item when edit receives empty object', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item original',
        quantity: 2,
        unitValueInCents: 15000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    await sut.execute(item.id, {});

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated).toEqual({
      ...item,
      updatedAt: updated?.updatedAt,
    });
  });
});
