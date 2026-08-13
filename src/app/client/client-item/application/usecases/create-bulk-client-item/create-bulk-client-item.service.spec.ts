import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { CreateClientItemInputDto } from '../create-client-item/dtos/create-client-item.dto';
import { CreateBulkClientItem } from './create-bulk-client-item.service';

const makeValidItem = (overrides: Partial<CreateClientItemInputDto> & { clientId: number; cnaeNbsIndopId: number }): CreateClientItemInputDto => ({
  description: 'Item teste',
  quantity: 1,
  unitValueInCents: 10000,
  ...overrides,
});

describe('CreateBulkClientItem - Integration tests', () => {
  let sut: CreateBulkClientItem;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(CreateBulkClientItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale, cnae, nbs, indop, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const cni = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    cnaeNbsIndopId = cni.id;

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
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

  it('should return empty succeeded and failed when items array is empty', async() => {
    const result = await sut.execute({ items: [] });

    expect(result).toEqual({ succeeded: [], failed: [] });
  });

  it('should create all items successfully', async() => {
    const items = [
      makeValidItem({ clientId, cnaeNbsIndopId, description: 'Item 1' }),
      makeValidItem({ clientId, cnaeNbsIndopId, description: 'Item 2' }),
      makeValidItem({ clientId, cnaeNbsIndopId, description: 'Item 3' }),
    ];

    const result = await sut.execute({ items });

    expect(result.succeeded).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
    expect(result.succeeded.map(s => s.index)).toEqual([0, 1, 2]);
    expect(result.succeeded.every(s => typeof s.id === 'number')).toBe(true);

    const savedCount = await prisma.clientItem.count({ where: { clientId } });
    expect(savedCount).toBe(3);
  });

  it('should report all as failed when all have invalid clientId', async() => {
    const items = [
      makeValidItem({ clientId: 99999, cnaeNbsIndopId, description: 'Item 1' }),
      makeValidItem({ clientId: 99998, cnaeNbsIndopId, description: 'Item 2' }),
    ];

    const result = await sut.execute({ items });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(2);
    expect(result.failed.map(f => f.index)).toEqual([0, 1]);
    expect(result.failed.every(f => f.error.length > 0)).toBe(true);

    const savedCount = await prisma.clientItem.count({ where: { clientId } });
    expect(savedCount).toBe(0);
  });

  it('should report partial success when some items succeed and some fail', async() => {
    const items = [
      makeValidItem({ clientId, cnaeNbsIndopId, description: 'Item válido' }),
      makeValidItem({ clientId: 99999, cnaeNbsIndopId, description: 'Item inválido' }),
      makeValidItem({ clientId, cnaeNbsIndopId, description: 'Outro item válido' }),
    ];

    const result = await sut.execute({ items });

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.succeeded.map(s => s.index)).toEqual([0, 2]);
    expect(result.failed[0].index).toBe(1);
    expect(result.failed[0].error.length).toBeGreaterThan(0);

    const savedCount = await prisma.clientItem.count({ where: { clientId } });
    expect(savedCount).toBe(2);
  });
});
