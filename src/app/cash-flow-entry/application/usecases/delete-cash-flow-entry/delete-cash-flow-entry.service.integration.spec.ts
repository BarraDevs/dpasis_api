import { Test } from '@nestjs/testing';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { CashFlowEntryNotFoundError } from 'src/app/cash-flow-entry/domain/errors/cash-flow-entry-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { DeleteCashFlowEntry } from './delete-cash-flow-entry.service';

describe('DeleteCashFlowEntry - Integration tests', () => {
  let sut: DeleteCashFlowEntry;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CashFlowEntryModule],
    }).compile();

    sut = module.get(DeleteCashFlowEntry);
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

  it('should delete the entry', async() => {
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const entry = await prisma.cashFlowEntry.create({
      data: {
        companyId: company.id,
        type: CashFlowEntryType.CREDIT,
        origin: CashFlowEntryOrigin.MANUAL,
        amountInCents: 1000,
        occurredAt: new Date('2026-09-10T00:00:00.000Z'),
        description: 'Apagar',
      },
    });

    const result = await sut.execute(entry.id);

    expect(result).toEqual({ message: 'Lançamento de fluxo de caixa excluído com sucesso' });
    expect(await prisma.cashFlowEntry.findUnique({ where: { id: entry.id } })).toBeNull();
  });
});
