import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CashFlowEntryOrigin } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-origin.enum';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { TOKENS } from 'src/core/di/token';
import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import type { ICashFlowEntryDao } from '../../persistence/dao/cash-flow-entry-dao.interface';
import { RecordPaidBankPaymentCashFlowEntry } from './record-paid-bank-payment-cash-flow-entry.service';

describe('RecordPaidBankPaymentCashFlowEntry - Unit tests', () => {
  let sut: RecordPaidBankPaymentCashFlowEntry;
  let dao: ICashFlowEntryDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        RecordPaidBankPaymentCashFlowEntry,
        { provide: TOKENS.CashFlowEntryDao, useValue: createMock<ICashFlowEntryDao>() },
      ],
    }).compile();

    sut = module.get(RecordPaidBankPaymentCashFlowEntry);
    dao = module.get(TOKENS.CashFlowEntryDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return the existing id without saving', async() => {
    // Arrange
    jest.spyOn(dao, 'findByNfseId').mockResolvedValue(createMock<CashFlowEntryDto>({ id: 9 }));

    // Act
    const result = await sut.execute({
      companyId: 1,
      nfseId: 3,
      bankPaymentRequestCode: 'req-1',
      occurredAt: new Date('2026-09-17T12:00:00.000Z'),
      amount: 100,
    });

    // Assert
    expect(result).toEqual({ id: 9 });
    expect(dao.save).not.toHaveBeenCalled();
  });

  it('should return null when there is no row and no amount', async() => {
    // Arrange
    jest.spyOn(dao, 'findByNfseId').mockResolvedValue(null);

    // Act
    const result = await sut.execute({
      companyId: 1,
      nfseId: 3,
      bankPaymentRequestCode: 'req-1',
      occurredAt: new Date('2026-09-17T12:00:00.000Z'),
    });

    // Assert
    expect(result).toEqual({ id: null });
    expect(dao.save).not.toHaveBeenCalled();
  });

  it('should save a CREDIT BANK_PAYMENT row converting reais to cents', async() => {
    // Arrange
    const occurredAt = new Date('2026-09-17T12:00:00.000Z');
    jest.spyOn(dao, 'findByNfseId').mockResolvedValue(null);
    jest.spyOn(dao, 'save').mockResolvedValue(15);

    // Act
    const result = await sut.execute({
      companyId: 2,
      nfseId: 8,
      bankPaymentRequestCode: 'req-9',
      occurredAt,
      amount: 150.5,
    });

    // Assert
    expect(dao.save).toHaveBeenCalledWith({
      companyId: 2,
      type: CashFlowEntryType.CREDIT,
      origin: CashFlowEntryOrigin.BANK_PAYMENT,
      amountInCents: 15050,
      occurredAt,
      description: 'Pagamento de boleto NFS-e 8 (req-9)',
      nfseId: 8,
      bankPaymentRequestCode: 'req-9',
    });
    expect(result).toEqual({ id: 15 });
  });
});
