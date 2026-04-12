import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { CnaeNbsIndopNotFoundError } from 'src/app/global/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { EditClientItemInputDto } from './dtos/edit-client-item.dto';
import { EditClientItem } from './edit-client-item.service';

describe('EditClientItem - Integration tests', () => {
  let sut: EditClientItem;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;
  let cnaeNbsIndopId2: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(EditClientItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner, cnae, nbs, indop, cnae2, nbs2, indop2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
      prisma.cnae.create({ data: { code: '9999999', description: 'CNAE 2', active: true } }),
      prisma.nbs.create({ data: { code: '88888888', description: 'NBS 2', active: true } }),
      prisma.indop.create({ data: { code: '5', description: 'INDOP 2', active: true } }),
    ]);

    const [cni1, cni2] = await Promise.all([
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id } }),
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae2.id, nbsId: nbs2.id, indopId: indop2.id } }),
    ]);
    cnaeNbsIndopId = cni1.id;
    cnaeNbsIndopId2 = cni2.id;

    const client = await prisma.client.create({
      data: {
        id: 1,
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
        cnaeNbsIndopId,
        active: true,
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
    expect(updated?.description).toBe(data.description);
    expect(updated?.quantity).toBe(data.quantity);
    expect(updated?.unitValueInCents).toBe(data.unitValueInCents);
  });

  it('should throw ClientNotFoundError when client is inactive', async() => {
    const [group2, owner2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);
    const inactiveClient = await prisma.client.create({
      data: {
        id: 2,
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
        cnaeNbsIndopId,
        active: true,
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
        cnaeNbsIndopId,
        active: true,
      },
    });

    const data: EditClientItemInputDto = { description: 'Apenas descrição alterada' };

    await sut.execute(item.id, data);

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated?.description).toBe(data.description);
  });

  it('should throw CnaeNbsIndopNotFoundError when cnaeNbsIndopId does not exist', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item',
        quantity: 1,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
        active: true,
      },
    });

    const data: EditClientItemInputDto = { cnaeNbsIndopId: 99999 };

    await expect(sut.execute(item.id, data)).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should update only cnaeNbsIndopId when provided', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Descrição fixa',
        quantity: 1,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
        active: true,
      },
    });

    const data: EditClientItemInputDto = {
      cnaeNbsIndopId: cnaeNbsIndopId2,
    };

    await sut.execute(item.id, data);

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated?.cnaeNbsIndopId).toBe(cnaeNbsIndopId2);
  });

  it('should update quantity to zero when provided', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item com quantidade',
        quantity: 10,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
        active: true,
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
        cnaeNbsIndopId,
        active: true,
      },
    });

    await sut.execute(item.id, {});

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated?.description).toBe(item.description);
    expect(updated?.quantity).toBe(item.quantity);
    expect(updated?.cnaeNbsIndopId).toBe(item.cnaeNbsIndopId);
  });
});
