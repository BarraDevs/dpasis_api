import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { ClientItemDto } from '../../dtos/client-item.dto';
import { FindClientItemById } from './find-client-item-by-id.service';

describe('FindClientItemById - Integration tests', () => {
  let sut: FindClientItemById;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(FindClientItemById);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner, cnae, nbs, indop] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);

    const cni = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    cnaeNbsIndopId = cni.id;

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
    await expect(sut.execute(99999)).rejects.toThrow(ClientItemNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow(
      'Item do cliente não encontrado na base de dados.',
    );
  });

  it('should return client item by id', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item de teste',
        quantity: 2,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
      },
    });

    const result = await sut.execute(item.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(item.id);
    expect(result.description).toBe(item.description);
    expect(result.quantity).toBe(item.quantity);
    expect(result.unitValueInCents).toBe(item.unitValueInCents);
    expect(result.totalValueInCents).toBe(2 * 10000);
    expect(result.cnaeNbsIndop).toBeDefined();
  });

  it('should return all client item fields correctly', async() => {
    const cnae = await prisma.cnae.create({ data: { code: 'cnae-code', description: 'CNAE Test', active: true } });
    const nbs = await prisma.nbs.create({ data: { code: 'nbs-code', description: 'NBS Test', active: true } });
    const indop = await prisma.indop.create({ data: { code: 'indop-code', description: 'INDOP Test', active: true } });
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id } });
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Descrição completa',
        quantity: 3,
        unitValueInCents: 5000,
        cnaeNbsIndopId: cnaeNbsIndop.id,
      },
    });

    const result = await sut.execute(item.id);

    expect(result).toEqual<ClientItemDto>({
      id: item.id,
      clientId,
      description: item.description,
      quantity: item.quantity,
      unitValueInCents: item.unitValueInCents,
      totalValueInCents: 3 * 5000,
      active: item.active,
      cnaeNbsIndop: {
        id: cnaeNbsIndop.id,
        active: cnaeNbsIndop.active,
        cnae: {
          id: cnae.id,
          code: cnae.code,
          description: cnae.description,
        },
        nbs: {
          id: nbs.id,
          code: nbs.code,
          description: nbs.description,
        },
        indop: {
          id: indop.id,
          code: indop.code,
          description: indop.description,
        },
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  });

  it('should throw ClientItemNotFoundError when id is 0', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientItemNotFoundError);
  });

  it('should throw ClientItemNotFoundError when id is negative', async() => {
    await expect(sut.execute(-1)).rejects.toThrow(ClientItemNotFoundError);
  });

  it('should calculate totalValueInCents correctly for quantity zero', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item quantidade zero',
        quantity: 0,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
      },
    });

    const result = await sut.execute(item.id);

    expect(result.totalValueInCents).toBe(0);
  });

  it('should calculate totalValueInCents correctly for large values', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item valores altos',
        quantity: 1000,
        unitValueInCents: 999999,
        cnaeNbsIndopId,
      },
    });

    const result = await sut.execute(item.id);

    expect(result.totalValueInCents).toBe(999999000);
  });
});
