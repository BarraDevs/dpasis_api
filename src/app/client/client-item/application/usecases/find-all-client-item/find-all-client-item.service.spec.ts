import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { FindAllClientItem } from './find-all-client-item.service';

describe('FindAllClientItem - Integration tests', () => {
  let sut: FindAllClientItem;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(FindAllClientItem);
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

  it('should return empty array when no items exist', async() => {
    const result = await sut.execute({ clientId });

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return client items with default pagination', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Item 1',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
        {
          clientId,
          description: 'Item 2',
          quantity: 2,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
  });

  it('should filter by clientId', async() => {
    const [group2, owner2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);
    const client2 = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '22222222000222',
        ie: null,
        groupId: group2.id,
        ownerId: owner2.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'Rio',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item Cliente 1',
        quantity: 1,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });
    await prisma.clientItem.create({
      data: {
        clientId: client2.id,
        description: 'Item Cliente 2',
        quantity: 1,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    const result = await sut.execute({ clientId });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].clientId).toBe(clientId);
    expect(result.data[0].description).toBe('Item Cliente 1');
  });

  it('should filter by search in description', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Serviço de consultoria',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
        {
          clientId,
          description: 'Produto XYZ',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId, search: 'consultoria' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].description).toBe('Serviço de consultoria');
  });
});
