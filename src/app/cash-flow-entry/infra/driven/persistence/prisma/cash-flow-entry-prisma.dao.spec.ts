import { Test } from '@nestjs/testing';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { CashFlowEntrySaveData } from 'src/app/cash-flow-entry/application/persistence/dao/cash-flow-entry-dao.interface';
import { CashFlowEntryDaoAdapterPrisma } from './cash-flow-entry-prisma.dao';

describe('CashFlowEntryDaoAdapterPrisma - Integration tests', () => {
  let sut: CashFlowEntryDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CashFlowEntryDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CashFlowEntryDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function seedEntry(overrides: Partial<CashFlowEntrySaveData> = {}) {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const payload: CashFlowEntrySaveData = {
      companyId: company.id,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.MANUAL,
      amountInCents: 1000,
      occurredAt: new Date('2026-09-10T12:00:00.000Z'),
      description: 'Lançamento',
      ...overrides,
    };
    const id = await sut.save(payload);
    return { id, companyId: payload.companyId };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should save and findById', async() => {
    const { id, companyId } = await seedEntry({ description: 'Criado' });

    const found = await sut.findById(id);

    expect(found).toEqual(
      expect.objectContaining({
        id,
        companyId,
        description: 'Criado',
        origin: CashFlowEntryOrigin.MANUAL,
      }),
    );
  });

  it('should return null from findById when missing', async() => {
    expect(await sut.findById(999_999)).toBeNull();
  });

  it('should findByNfseId', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: 1,
        rpsNumber: 1,
        rpsSeries: 'NFSE',
        status: 'ISSUED',
        data: {},
      },
    });
    await sut.save({
      companyId: company.id,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.BANK_PAYMENT,
      amountInCents: 2000,
      occurredAt: new Date('2026-09-10T12:00:00.000Z'),
      description: 'Boleto',
      nfseId: nfse.id,
      bankPaymentRequestCode: 'req-1',
    });

    const found = await sut.findByNfseId(nfse.id);
    expect(found?.nfseId).toBe(nfse.id);
    expect(await sut.findByNfseId(nfse.id + 1)).toBeNull();
  });

  it('should filter findAll by company, dates and search', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const other = await prisma.company.create({ data: buildMinimalCompanyData() });
    await sut.save({
      companyId: company.id,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.MANUAL,
      amountInCents: 1,
      occurredAt: new Date('2026-09-10T00:00:00.000Z'),
      description: 'Pagamento boleto',
    });
    await sut.save({
      companyId: company.id,
      type: CashFlowEntryType.DEBIT,
      origin: CashFlowEntryOrigin.MANUAL,
      amountInCents: 2,
      occurredAt: new Date('2026-08-01T00:00:00.000Z'),
      description: 'Fora do período',
    });
    await sut.save({
      companyId: other.id,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.MANUAL,
      amountInCents: 3,
      occurredAt: new Date('2026-09-10T00:00:00.000Z'),
      description: 'Outra empresa',
    });

    const [rows, total] = await sut.findAll({
      companyId: company.id,
      startDate: '2026-09-01',
      endDate: '2026-09-30T23:59:59.999Z',
      search: 'boleto',
    });

    expect(total).toBe(1);
    expect(rows[0].description).toBe('Pagamento boleto');
  });

  it('should edit and delete', async() => {
    const { id } = await seedEntry();

    await sut.edit(id, { description: 'Editado', amountInCents: 50 });
    const edited = await sut.findById(id);
    expect(edited?.description).toBe('Editado');
    expect(edited?.amountInCents).toBe(50);

    await sut.delete(id);
    expect(await sut.findById(id)).toBeNull();
  });
});
