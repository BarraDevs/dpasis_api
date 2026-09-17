import { Test } from '@nestjs/testing';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { EditCashFlowEntry } from './edit-cash-flow-entry.service';

describe('EditCashFlowEntry - Integration tests', () => {
  let sut: EditCashFlowEntry;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CashFlowEntryModule],
    }).compile();

    sut = module.get(EditCashFlowEntry);
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
    await expect(sut.execute(0, { description: 'Novo' })).rejects.toThrow(CashFlowEntryNotFoundError);
  });

  it('should update description without changing origin', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const entry = await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.BANK_PAYMENT,
        amountInCents: 1000,
        occurredAt: new Date('2026-09-10T00:00:00.000Z'),
        description: 'Original',
      },
    });

    const result = await sut.execute(entry.id, { description: 'Ajustado' });

    expect(result).toEqual({ message: 'Lançamento de fluxo de caixa atualizado com sucesso' });
    const updated = await prisma.cashFlowEntry.findUnique({ where: { id: entry.id } });
    expect(updated?.description).toBe('Ajustado');
    expect(updated?.origin).toBe(CashFlowEntryOrigin.BANK_PAYMENT);
    expect(updated?.amountInCents).toBe(1000);
  });
});
