import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CancelBankPayment } from 'src/app/bank-payment/application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { CancelNfse } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/cancel-nfse.service';
import { CancelNfseOutputDto } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/dtos/cancel-nfse.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseNotIssuedError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-issued.error';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { CancelNfm } from './cancel-nfm.service';
import { CancelNfmInputDto } from './dtos/cancel-nfm.dto';

function makeNfm(overrides: {
  id?: number;
  withIssuedNfse?: boolean;
  withPendingNfse?: boolean;
  bankPaymentRequestCode?: string | null;
} = {}): Nfm {
  const entity = NfmFactory.load({
    id: overrides.id ?? 10,
    clientId: 1,
    clientDocument: '00000000000101',
    companyName: 'Empresa',
    referenceMonth: 8,
    referenceYear: 2026,
    totalValueInCents: 1000,
    cnaeNbsIndopId: 1,
    data: {},
    nfse: null,
  });

  if (overrides.withIssuedNfse) {
    entity.linkNfse(NfseFactory.load({
      id: 99,
      companyId: 1,
      clientId: 1,
      rpsNumber: 1,
      rpsSeries: '1',
      status: NfseStatus.ISSUED,
      batchProtocol: null,
      nfseNumber: '1000',
      verificationCode: 'ABC',
      issuedAt: new Date('2026-07-20T10:00:00Z'),
      errorMessage: null,
      canceledAt: null,
      cancelReasonCode: null,
      bankPaymentProvider: overrides.bankPaymentRequestCode ? BankPaymentProvider.INTER : null,
      bankPaymentRequestCode: overrides.bankPaymentRequestCode ?? null,
      data: {},
    }));
  }

  if (overrides.withPendingNfse) {
    entity.linkNfse(NfseFactory.load({
      id: 99,
      companyId: 1,
      clientId: 1,
      rpsNumber: 1,
      rpsSeries: '1',
      status: NfseStatus.PENDING,
      batchProtocol: null,
      nfseNumber: null,
      verificationCode: null,
      issuedAt: null,
      errorMessage: null,
      canceledAt: null,
      cancelReasonCode: null,
      bankPaymentProvider: null,
      bankPaymentRequestCode: null,
      data: {},
    }));
  }

  return entity;
}

describe('CancelNfm - Unit tests', () => {
  let sut: CancelNfm;
  let nfmRepository: jest.Mocked<INfmRepository>;
  let cancelNfse: CancelNfse;
  let cancelBankPayment: CancelBankPayment;

  beforeEach(async() => {
    nfmRepository = createMock<INfmRepository>();

    const module = await Test.createTestingModule({
      providers: [
        CancelNfm,
        { provide: TOKENS.NfmRepository, useValue: nfmRepository },
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: CancelNfse, useValue: createMock<CancelNfse>() },
        { provide: CancelBankPayment, useValue: createMock<CancelBankPayment>() },
      ],
    }).compile();

    sut = module.get(CancelNfm);
    cancelNfse = module.get(CancelNfse);
    cancelBankPayment = module.get(CancelBankPayment);
  });

  const input: CancelNfmInputDto = { cancelReasonCode: 2 };

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    // Arrange
    nfmRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1, input)).rejects.toThrow(NfmNotFoundError);
    expect(cancelNfse.execute).not.toHaveBeenCalled();
  });

  it('should throw NfmNfseMissingError when nfm has no linked nfse', async() => {
    // Arrange
    nfmRepository.findById.mockResolvedValue(makeNfm({ id: 10 }));

    // Act & Assert
    await expect(sut.execute(10, input)).rejects.toThrow(NfmNfseMissingError);
    expect(cancelNfse.execute).not.toHaveBeenCalled();
  });

  it('should throw NfseNotIssuedError when linked nfse is not issued', async() => {
    // Arrange
    nfmRepository.findById.mockResolvedValue(makeNfm({ withPendingNfse: true }));

    // Act & Assert
    await expect(sut.execute(10, input)).rejects.toThrow(NfseNotIssuedError);
    expect(cancelNfse.execute).not.toHaveBeenCalled();
  });

  it('should cancel via CancelNfse using nfse.id and return nfm id', async() => {
    // Arrange
    nfmRepository.findById.mockResolvedValue(makeNfm({ withIssuedNfse: true }));
    const cancelOutput = createMock<CancelNfseOutputDto>({
      id: 99,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
    });
    jest.spyOn(cancelNfse, 'execute').mockResolvedValue(cancelOutput);

    // Act
    const result = await sut.execute(10, input);

    // Assert
    expect(nfmRepository.findById).toHaveBeenCalledWith(10);
    expect(cancelNfse.execute).toHaveBeenCalledWith(99, input);
    expect(result).toEqual({
      id: 10,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
      bankPaymentCanceled: false,
    });
    expect(cancelBankPayment.execute).not.toHaveBeenCalled();
  });

  describe('bank payment cascade', () => {
    const cancelOutput = createMock<CancelNfseOutputDto>({
      id: 99,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
    });

    beforeEach(() => {
      jest.spyOn(cancelNfse, 'execute').mockResolvedValue(cancelOutput);
    });

    it('should cancel the linked boleto before the nfse', async() => {
      // Arrange
      nfmRepository.findById.mockResolvedValue(makeNfm({
        withIssuedNfse: true,
        bankPaymentRequestCode: 'req-123',
      }));
      const order: string[] = [];
      jest.spyOn(cancelBankPayment, 'execute').mockImplementation(async() => {
        order.push('bankPayment');
        return { message: 'ok' };
      });
      jest.spyOn(cancelNfse, 'execute').mockImplementation(async() => {
        order.push('nfse');
        return cancelOutput;
      });

      // Act
      const result = await sut.execute(10, input);

      // Assert — cancelar boleto é reversível, cancelar nota não: a ordem importa.
      expect(order).toEqual(['bankPayment', 'nfse']);
      expect(cancelBankPayment.execute).toHaveBeenCalledWith('req-123', {
        provider: BankPaymentProvider.INTER,
        reason: 'Serviço não prestado',
      });
      expect(result.bankPaymentCanceled).toBe(true);
      expect(result.bankPaymentError).toBeUndefined();
    });

    it('should still cancel the nfse and report the failure when the boleto cannot be canceled', async() => {
      // Arrange
      nfmRepository.findById.mockResolvedValue(makeNfm({
        withIssuedNfse: true,
        bankPaymentRequestCode: 'req-123',
      }));
      jest.spyOn(cancelBankPayment, 'execute').mockRejectedValue(new Error('Cobrança já paga'));

      // Act
      const result = await sut.execute(10, input);

      // Assert
      expect(cancelNfse.execute).toHaveBeenCalledWith(99, input);
      expect(result).toMatchObject({
        status: NfseStatus.CANCELED,
        bankPaymentCanceled: false,
        bankPaymentError: 'Cobrança já paga',
      });
    });

    it.each([
      [1, 'Erro na emissão da NFS-e'],
      [2, 'Serviço não prestado'],
      [4, 'Nota fiscal duplicada'],
    ])('should map cancelReasonCode %i to a boleto reason within the 50 char limit', async(code, expected) => {
      // Arrange
      nfmRepository.findById.mockResolvedValue(makeNfm({
        withIssuedNfse: true,
        bankPaymentRequestCode: 'req-123',
      }));

      // Act
      await sut.execute(10, { cancelReasonCode: code });

      // Assert
      expect(cancelBankPayment.execute).toHaveBeenCalledWith('req-123', {
        provider: BankPaymentProvider.INTER,
        reason: expected,
      });
      expect(expected.length).toBeLessThanOrEqual(50);
    });
  });
});
