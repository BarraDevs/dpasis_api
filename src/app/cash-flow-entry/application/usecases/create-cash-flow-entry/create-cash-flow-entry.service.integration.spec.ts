import { Test } from '@nestjs/testing';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { CreateCashFlowEntry } from './create-cash-flow-entry.service';
import { CreateCashFlowEntryInputDto } from './dtos/create-cash-flow-entry.dto';

function makeInput(overrides: Partial<CreateCashFlowEntryInputDto> = {}): CreateCashFlowEntryInputDto {
  return {
    companyId: 1,
    type: CashFlowEntryType.CREDIT,
    amountInCents: 15050,
    occurredAt: '2026-09-17T12:00:00.000Z',
    description: 'Entrada manual',
    ...overrides,
  };
}

describe('CreateCashFlowEntry - Integration tests', () => {
  let sut: CreateCashFlowEntry;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CashFlowEntryModule],
    }).compile();

    sut = module.get(CreateCashFlowEntry);
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

  it('should throw CompanyNotFoundError when company does not exist', async() => {
    await expect(sut.execute(makeInput({ companyId: 999 }))).rejects.toThrow(CompanyNotFoundError);
  });

  it('should throw CompanyNotFoundError when company is inactive', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData({ active: false }) });

    await expect(sut.execute(makeInput({ companyId: company.id }))).rejects.toThrow(CompanyNotFoundError);
  });

  it('should persist a MANUAL CREDIT entry', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });

    const result = await sut.execute(makeInput({ companyId: company.id }));

    expect(typeof result.id).toBe('number');
    const saved = await prisma.cashFlowEntry.findUnique({ where: { id: result.id } });
    expect(saved).toEqual(
      expect.objectContaining({
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 15050,
        description: 'Entrada manual',
        nfseId: null,
        bankPaymentRequestCode: null,
      }),
    );
    expect(saved?.occurredAt).toEqual(new Date('2026-09-17T12:00:00.000Z'));
  });

  it('should persist a MANUAL DEBIT entry', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });

    const { id } = await sut.execute(makeInput({
      companyId: company.id,
      type: CashFlowEntryType.DEBIT,
      description: 'Saída futura',
    }));

    const saved = await prisma.cashFlowEntry.findUnique({ where: { id } });
    expect(saved?.type).toBe(CashFlowEntryType.DEBIT);
    expect(saved?.origin).toBe(CashFlowEntryOrigin.MANUAL);
  });
});
