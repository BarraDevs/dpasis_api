import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { ClientItemDto } from '../../dtos/client-item.dto';
import { FindAllClientItem } from './find-all-client-item.service';

describe('FindAllClientItem - Integration tests', () => {
  let sut: FindAllClientItem;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(FindAllClientItem);
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

    const result = await sut.execute({ clientId });

    expect(result.data[0]).toEqual<ClientItemDto>({
      id: item.id,
      clientId,
      description: item.description,
      quantity: item.quantity,
      unitValueInCents: item.unitValueInCents,
      totalValueInCents: 3 * 5000,
      cnaeNbsIndop: {
        id: cnaeNbsIndop.id,
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

  it('should return client items with default pagination', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Item 1',
          quantity: 1,
          unitValueInCents: 10000,
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 2',
          quantity: 2,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
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
        cnaeNbsIndopId,
      },
    });
    await prisma.clientItem.create({
      data: {
        clientId: client2.id,
        description: 'Item Cliente 2',
        quantity: 1,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
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
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Produto XYZ',
          quantity: 1,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
        },
      ],
    });

    const result = await sut.execute({ clientId, search: 'consultoria' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].description).toBe('Serviço de consultoria');
  });

  it('should filter by search in cnae', async() => {
    const [cnae1, cnae2, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '6201501', description: 'CNAE A', active: true } }),
      prisma.cnae.create({ data: { code: '4712100', description: 'CNAE B', active: true } }),
      prisma.nbs.create({ data: { code: 'NBS-CNAE-1', description: 'NBS', active: true } }),
      prisma.indop.create({ data: { code: 'INDOP-CNAE-1', description: 'INDOP', active: true } }),
    ]);
    const [cni1, cni2] = await Promise.all([
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae1.id, nbsId: nbs.id, indopId: indop.id } }),
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae2.id, nbsId: nbs.id, indopId: indop.id } }),
    ]);

    await prisma.clientItem.createMany({
      data: [
        { clientId, description: 'Item A', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id },
        { clientId, description: 'Item B', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id },
      ],
    });

    const result = await sut.execute({ clientId, search: '6201501' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].cnaeNbsIndop.cnae.code).toBe('6201501');
  });

  it('should filter by search in nbs', async() => {
    const [cnae, nbs1, nbs2, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: 'CNAE-NBS-1', description: 'CNAE', active: true } }),
      prisma.nbs.create({ data: { code: '01010101', description: 'NBS A', active: true } }),
      prisma.nbs.create({ data: { code: '99999999', description: 'NBS B', active: true } }),
      prisma.indop.create({ data: { code: 'INDOP-NBS-1', description: 'INDOP', active: true } }),
    ]);
    const [cni1, cni2] = await Promise.all([
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs1.id, indopId: indop.id } }),
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs2.id, indopId: indop.id } }),
    ]);

    await prisma.clientItem.createMany({
      data: [
        { clientId, description: 'Item A', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id },
        { clientId, description: 'Item B', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id },
      ],
    });

    const result = await sut.execute({ clientId, search: '01010101' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].cnaeNbsIndop.nbs.code).toBe('01010101');
  });

  it('should filter by search in indop', async() => {
    const [cnae, nbs, indop1, indop2] = await Promise.all([
      prisma.cnae.create({ data: { code: 'CNAE-INDOP-1', description: 'CNAE', active: true } }),
      prisma.nbs.create({ data: { code: 'NBS-INDOP-1', description: 'NBS', active: true } }),
      prisma.indop.create({ data: { code: 'INDOP-X', description: 'INDOP A', active: true } }),
      prisma.indop.create({ data: { code: 'INDOP-Y', description: 'INDOP B', active: true } }),
    ]);
    const [cni1, cni2] = await Promise.all([
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop1.id } }),
      prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop2.id } }),
    ]);

    await prisma.clientItem.createMany({
      data: [
        { clientId, description: 'Item A', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id },
        { clientId, description: 'Item B', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id },
      ],
    });

    const result = await sut.execute({ clientId, search: 'INDOP-X' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].cnaeNbsIndop.indop.code).toBe('INDOP-X');
  });

  it('should return all items when search is empty or whitespace', async() => {
    await prisma.clientItem.createMany({
      data: [
        {
          clientId,
          description: 'Item 1',
          quantity: 1,
          unitValueInCents: 10000,
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 2',
          quantity: 2,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
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
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 2',
          quantity: 1,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
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
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 2',
          quantity: 1,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 3',
          quantity: 1,
          unitValueInCents: 7500,
          cnaeNbsIndopId,
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
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 2',
          quantity: 1,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
        },
        {
          clientId,
          description: 'Item 3',
          quantity: 1,
          unitValueInCents: 7500,
          cnaeNbsIndopId,
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
        cnaeNbsIndopId,
      },
    });
    const item2 = await prisma.clientItem.create({
      data: {
        clientId,
        description: 'Segundo',
        quantity: 1,
        unitValueInCents: 5000,
        cnaeNbsIndopId,
      },
    });

    const result = await sut.execute({ clientId });

    expect(result.data[0].id).toBe(item1.id);
    expect(result.data[1].id).toBe(item2.id);
  });
});
