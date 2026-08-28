import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindNfmById } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { NfmNotFoundError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-not-found.error';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { ProcessIssueNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { NfseBankPaymentAlreadyLinkedError } from '../../../domain/errors/nfse-bank-payment-already-linked.error';
import { NfseBankPaymentIssueFailedError } from '../../../domain/errors/nfse-bank-payment-issue-failed.error';
import { NfseNotIssuedForBankPaymentError } from '../../../domain/errors/nfse-not-issued-for-bank-payment.error';
import { IssueBankPaymentByNfmId } from './issue-bank-payment-by-nfm-id.service';

function makeNfm(
  overrides: Partial<Omit<NfmWithNfseDto, 'nfse'>> & { nfse?: Partial<NfseDto> } = {},
): NfmWithNfseDto {
  const { nfse: nfseOverrides, ...nfmOverrides } = overrides;
  return createMock<NfmWithNfseDto>({
    id: 10,
    nfse: createMock<NfseDto>({
      id: 99,
      status: NfseStatus.ISSUED,
      bankPaymentRequestCode: null,
      bankPaymentProvider: null,
      ...nfseOverrides,
    }),
    ...nfmOverrides,
  });
}

describe('IssueBankPaymentByNfmId - Unit tests', () => {
  let sut: IssueBankPaymentByNfmId;
  let findNfmById: FindNfmById;
  let processIssueNfseBankPayment: ProcessIssueNfseBankPayment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        IssueBankPaymentByNfmId,
        { provide: FindNfmById, useValue: createMock<FindNfmById>() },
        { provide: ProcessIssueNfseBankPayment, useValue: createMock<ProcessIssueNfseBankPayment>() },
      ],
    }).compile();

    sut = module.get(IssueBankPaymentByNfmId);
    findNfmById = module.get(FindNfmById);
    processIssueNfseBankPayment = module.get(ProcessIssueNfseBankPayment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(findNfmById, 'execute').mockRejectedValue(new NfmNotFoundError());

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(NfmNotFoundError);
    expect(processIssueNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should throw NfseNotIssuedForBankPaymentError when nfse is not ISSUED', async() => {
    // Arrange
    jest.spyOn(findNfmById, 'execute').mockResolvedValue(makeNfm({
      nfse: { status: NfseStatus.PENDING },
    }));

    // Act & Assert
    await expect(sut.execute(10)).rejects.toThrow(NfseNotIssuedForBankPaymentError);
    expect(processIssueNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should throw NfseBankPaymentAlreadyLinkedError when boleto is already linked', async() => {
    // Arrange
    jest.spyOn(findNfmById, 'execute').mockResolvedValue(makeNfm({
      nfse: { bankPaymentRequestCode: 'already-there' },
    }));

    // Act & Assert
    await expect(sut.execute(10)).rejects.toThrow(NfseBankPaymentAlreadyLinkedError);
    expect(processIssueNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should call ProcessIssueNfseBankPayment with nfse.id and return the result', async() => {
    // Arrange
    const nfm = makeNfm();
    const output = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    };
    jest.spyOn(findNfmById, 'execute').mockResolvedValue(nfm);
    jest.spyOn(processIssueNfseBankPayment, 'execute').mockResolvedValue(output);

    // Act
    const result = await sut.execute(10);

    // Assert
    expect(findNfmById.execute).toHaveBeenCalledWith(10);
    expect(processIssueNfseBankPayment.execute).toHaveBeenCalledWith({ nfseId: 99 });
    expect(result).toEqual(output);
  });

  it('should throw NfseBankPaymentIssueFailedError when process returns null', async() => {
    // Arrange
    jest.spyOn(findNfmById, 'execute').mockResolvedValue(makeNfm());
    jest.spyOn(processIssueNfseBankPayment, 'execute').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(10)).rejects.toThrow(NfseBankPaymentIssueFailedError);
  });
});
