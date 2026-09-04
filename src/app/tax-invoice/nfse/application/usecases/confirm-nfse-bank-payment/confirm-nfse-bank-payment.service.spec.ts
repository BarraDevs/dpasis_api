import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import { ConfirmNfseBankPayment } from './confirm-nfse-bank-payment.service';

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    status: NfseStatus.ISSUED,
    batchProtocol: 'PROTO-1',
    nfseNumber: '12345',
    verificationCode: 'ABC',
    issuedAt: new Date('2026-09-03T10:00:00Z'),
    errorMessage: null,
    canceledAt: null,
    cancelReasonCode: null,
    bankPaymentProvider: BankPaymentProvider.INTER,
    bankPaymentRequestCode: 'req-1',
    bankPaymentIdempotencyKey: 'nfse-1',
    bankPaymentRequestedAt: new Date('2026-09-03T10:05:00Z'),
    bankPaymentErrorMessage: null,
    bankPaymentFailedAt: null,
    bankPaymentStatus: null,
    bankPaymentConfirmedAt: null,
    reconcileAttemptCount: 0,
    nextReconcileAt: null,
    createdAt: new Date('2026-09-03T09:00:00Z'),
    nfmId: 500,
    data: {},
    ...overrides,
  };
}

function makeBankPayment(status: BankPaymentStatus): BankPaymentDto {
  return createMock<BankPaymentDto>({ provider: BankPaymentProvider.INTER, requestCode: 'req-1', status });
}

describe('ConfirmNfseBankPayment - Unit tests', () => {
  let sut: ConfirmNfseBankPayment;
  let nfseRepository: INfseRepository;
  let findBankPayment: FindBankPayment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ConfirmNfseBankPayment,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: FindBankPayment, useValue: createMock<FindBankPayment>() },
      ],
    }).compile();

    sut = module.get(ConfirmNfseBankPayment);
    nfseRepository = module.get(TOKENS.NfseRepository);
    findBankPayment = module.get(FindBankPayment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when there is no charge to confirm', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ bankPaymentRequestCode: null })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should be a no-op when the charge was already confirmed', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z') })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should ask the provider using the linked request code and provider', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.EMITTED));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(findBankPayment.execute).toHaveBeenCalledWith('req-1', BankPaymentProvider.INTER);
  });

  it.each([
    BankPaymentStatus.EMITTED,
    BankPaymentStatus.RECEIVED,
    BankPaymentStatus.PAID,
    BankPaymentStatus.MARKED_RECEIVED,
    BankPaymentStatus.EXPIRED,
    BankPaymentStatus.CANCELLED,
  ])('should confirm the charge when the provider reports %s', async(status) => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(status));

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props.bankPaymentStatus).toBe(status);
    expect(nfse.props.bankPaymentConfirmedAt).toBeInstanceOf(Date);
    expect(result).toEqual({ nfseId: 1, status, confirmed: true });
  });

  it('should keep asking while the charge is still awaiting approval', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.AWAITING_APPROVAL));

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props.bankPaymentConfirmedAt).toBeNull();
    expect(result?.confirmed).toBe(false);
  });

  it('should record the failure without unlinking the charge', async() => {
    // Arrange — apagar `bankPaymentRequestCode` reabriria a duplicidade fechada na Onda 2.
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.FAILED));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props.bankPaymentStatus).toBe(BankPaymentStatus.FAILED);
    expect(nfse.props.bankPaymentErrorMessage).toContain('req-1');
    expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
    expect(nfse.props.bankPaymentRequestCode).toBe('req-1');
    expect(nfse.props.bankPaymentConfirmedAt).toBeNull();
  });

  it('should persist whatever the provider reported', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.EMITTED));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
  });
});
