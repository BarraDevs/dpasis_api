import { Test } from '@nestjs/testing';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { FindAllCashFlowEntry } from './find-all-cash-flow-entry.service';

describe('FindAllCashFlowEntry - Integration tests', () => {
  let sut: FindAllCashFlowEntry;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CashFlowEntryModule],
    }).compile();

    sut = module.get(FindAllCashFlowEntry);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty results for a company without entries', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });

    const result = await sut.execute({ companyId: company.id });

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should filter by company, period, type and search', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const other = await prisma.company.create({ data: buildMinimalCompanyData() });

    await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 100,
        occurredAt: new Date('2026-09-10T12:00:00.000Z'),
        description: 'Pagamento boleto A',
      },
    });
    await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.DEBIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 50,
        occurredAt: new Date('2026-09-12T12:00:00.000Z'),
        description: 'Despesa',
      },
    });
    await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 80,
        occurredAt: new Date('2026-08-01T12:00:00.000Z'),
        description: 'Pagamento antigo',
      },
    });
    await prisma.cashFlowEntry.create({
      data: {
        companyId: other.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 999,
        occurredAt: new Date('2026-09-11T12:00:00.000Z'),
        description: 'Pagamento outra empresa',
      },
    });

    const byPeriod = await sut.execute({
      companyId: company.id,
      startDate: '2026-09-01',
      endDate: '2026-09-30T23:59:59.999Z',
    });
    expect(byPeriod.totalItems).toBe(2);

    const credits = await sut.execute({
      companyId: company.id,
      type: CashFlowEntryType.CREDIT,
      startDate: '2026-09-01',
      endDate: '2026-09-30T23:59:59.999Z',
    });
    expect(credits.totalItems).toBe(1);
    expect(credits.data[0].description).toBe('Pagamento boleto A');

    const search = await sut.execute({ companyId: company.id, search: 'boleto' });
    expect(search.totalItems).toBe(1);
    expect(search.data[0].description).toContain('boleto');
  });

  it('should order by occurredAt desc', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const older = await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 1,
        occurredAt: new Date('2026-09-01T00:00:00.000Z'),
        description: 'Antigo',
      },
    });
    const newer = await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 2,
        occurredAt: new Date('2026-09-20T00:00:00.000Z'),
        description: 'Novo',
      },
    });

    const result = await sut.execute({ companyId: company.id });

    expect(result.data[0].id).toBe(newer.id);
    expect(result.data[1].id).toBe(older.id);
  });
});
