import { Test } from '@nestjs/testing';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { FindCashFlowEntryById } from './find-cash-flow-entry-by-id.service';

describe('FindCashFlowEntryById - Integration tests', () => {
  let sut: FindCashFlowEntryById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CashFlowEntryModule],
    }).compile();

    sut = module.get(FindCashFlowEntryById);
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

  it('should throw CashFlowEntryNotFoundError when the entry does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(CashFlowEntryNotFoundError);
  });

  it('should return the persisted entry', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const entry = await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 333,
        occurredAt: new Date('2026-09-10T00:00:00.000Z'),
        description: 'Detalhe',
      },
    });

    const result = await sut.execute(entry.id);

    expect(result.id).toBe(entry.id);
    expect(result.description).toBe('Detalhe');
    expect(result.amountInCents).toBe(333);
  });
});
