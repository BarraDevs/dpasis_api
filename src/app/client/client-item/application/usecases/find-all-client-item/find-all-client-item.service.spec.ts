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

  it('should return empty array when clientId has no items (non-existent client)', async() => {
    const result = await sut.execute({ clientId: 99999 });

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

  it('should filter by search in cnae', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Item A',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '6201501',
          nbs: '12345678',
          indop: '1',
        },
        {
          clientId,
          description: 'Item B',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '4712100',
          nbs: '12345678',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId, search: '6201501' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].cnae).toBe('6201501');
  });

  it('should filter by search in nbs', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Item A',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '01010101',
          indop: '1',
        },
        {
          clientId,
          description: 'Item B',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '99999999',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId, search: '01010101' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].nbs).toBe('01010101');
  });

  it('should filter by search in indop', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Item A',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: 'INDOP-X',
        },
        {
          clientId,
          description: 'Item B',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: 'INDOP-Y',
        },
      ],
    });

    const result = await sut.execute({ clientId, search: 'INDOP-X' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].indop).toBe('INDOP-X');
  });

  it('should return all items when search is empty or whitespace', async() => {
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

    const resultEmpty = await sut.execute({ clientId, search: '' });
    const resultWhitespace = await sut.execute({ clientId, search: '   ' });

    expect(resultEmpty.data).toHaveLength(2);
    expect(resultWhitespace.data).toHaveLength(2);
  });

  it('should return pagination structure with currentPage, itemsPerPage, totalPages', async() => {
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
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId });

    expect(result).toMatchObject({
      currentPage: 1,
      itemsPerPage: expect.any(Number),
      totalItems: 2,
      totalPages: expect.any(Number),
      data: expect.any(Array),
    });
    expect(result.data).toHaveLength(2);
  });

  it('should respect page and size pagination', async() => {
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
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
        {
          clientId,
          description: 'Item 3',
          quantity: 1,
          unitValueInCents: 7500,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId, page: 1, size: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('should return second page when page=2', async() => {
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
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
        {
          clientId,
          description: 'Item 3',
          quantity: 1,
          unitValueInCents: 7500,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      ],
    });

    const result = await sut.execute({ clientId, page: 2, size: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].description).toBe('Item 3');
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('should return items ordered by id ascending', async() => {
    const item1 = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Primeiro',
        quantity: 1,
        unitValueInCents: 10000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });
    const item2 = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Segundo',
        quantity: 1,
        unitValueInCents: 5000,
        cnae: '1234567',
        nbs: '12345678',
        indop: '1',
      },
    });

    const result = await sut.execute({ clientId });

    expect(result.data[0].id).toBe(item1.id);
    expect(result.data[1].id).toBe(item2.id);
  });
});
