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

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(FindClientItemById);
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
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    const result = await sut.execute(item.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(item.id);
    expect(result.description).toBe(item.description);
    expect(result.quantity).toBe(item.quantity);
    expect(result.unitValueInCents).toBe(item.unitValueInCents);
    expect(result.totalValueInCents).toBe(2 * 10000);
  });

  it('should return all client item fields correctly', async() => {
    const item = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Descrição completa',
        quantity: 3,
        unitValueInCents: 5000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '2',
      },
    });

    const result = await sut.execute(item.id);

    expect(result).toEqual<ClientItemDto>({
      id: item.id,
      clientId: item.clientId,
      description: item.description,
      quantity: item.quantity,
      unitValueInCents: item.unitValueInCents,
      totalValueInCents: 3 * 5000,
      cnae: item.cnae,
      nbs: item.nbs,
      indop: item.indop,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  });
});
