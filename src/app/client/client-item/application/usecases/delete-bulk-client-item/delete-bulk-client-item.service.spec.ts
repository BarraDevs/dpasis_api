import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { DeleteBulkClientItem } from './delete-bulk-client-item.service';

describe('DeleteBulkClientItem - Integration tests', () => {
  let sut: DeleteBulkClientItem;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(DeleteBulkClientItem);
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

  it('should return empty succeeded and failed when ids array is empty', async() => {
    const result = await sut.execute({ ids: [] });

    expect(result).toEqual({ succeeded: [], failed: [] });
  });

  it('should delete all items successfully', async() => {
    const [item1, item2, item3] = await Promise.all([
      prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item 1',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      }),
      prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item 2',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      }),
      prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item 3',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      }),
    ]);

    const result = await sut.execute({ ids: [item1.id, item2.id, item3.id] });

    expect(result.succeeded).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
    expect(result.succeeded.map(s => s.id)).toEqual([item1.id, item2.id, item3.id]);

    const remaining = await prisma.clientItem.count({ where: { id: { in: [item1.id, item2.id, item3.id] } } });
    expect(remaining).toBe(0);
  });

  it('should report all as failed when all ids do not exist', async() => {
    const result = await sut.execute({ ids: [99999, 99998, 99997] });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(3);
    expect(result.failed.map(f => f.index)).toEqual([0, 1, 2]);
    expect(result.failed.every(f => f.error.length > 0)).toBe(true);
  });

  it('should report partial success when some ids exist and some do not', async() => {
    const [item1, item2] = await Promise.all([
      prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item 1',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      }),
      prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item 2',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      }),
    ]);

    const result = await sut.execute({ ids: [item1.id, 99999, item2.id] });

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.succeeded.map(s => s.id)).toEqual([item1.id, item2.id]);
    expect(result.failed[0].index).toBe(1);
    expect(result.failed[0].error.length).toBeGreaterThan(0);

    const item1Deleted = await prisma.clientItem.findUnique({ where: { id: item1.id } });
    const item2Deleted = await prisma.clientItem.findUnique({ where: { id: item2.id } });
    expect(item1Deleted).toBeNull();
    expect(item2Deleted).toBeNull();
  });
});
