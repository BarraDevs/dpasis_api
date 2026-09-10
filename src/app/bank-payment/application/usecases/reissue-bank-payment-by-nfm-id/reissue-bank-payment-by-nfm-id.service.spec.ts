import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindNfmById } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { NfmNotFoundError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-not-found.error';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { ReissueNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/reissue-nfse-bank-payment/reissue-nfse-bank-payment.service';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ReissueBankPaymentByNfmId } from './reissue-bank-payment-by-nfm-id.service';

function makeNfm(): NfmWithNfseDto {
  return createMock<NfmWithNfseDto>({
    id: 10,
    nfse: createMock<NfseDto>({
      id: 99,
      status: NfseStatus.ISSUED,
      bankPaymentRequestCode: 'req-failed',
    }),
  });
}

describe('ReissueBankPaymentByNfmId - Unit tests', () => {
  let sut: ReissueBankPaymentByNfmId;
  let findNfmById: FindNfmById;
  let reissueNfseBankPayment: ReissueNfseBankPayment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReissueBankPaymentByNfmId,
        { provide: FindNfmById, useValue: createMock<FindNfmById>() },
        { provide: ReissueNfseBankPayment, useValue: createMock<ReissueNfseBankPayment>() },
      ],
    }).compile();

    sut = module.get(ReissueBankPaymentByNfmId);
    findNfmById = module.get(FindNfmById);
    reissueNfseBankPayment = module.get(ReissueNfseBankPayment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(findNfmById, 'execute').mockRejectedValue(new NfmNotFoundError());

    // Act & Assert
    await expect(sut.execute(1, { reason: 'reemissão autorizada', confirm: true })).rejects.toThrow(NfmNotFoundError);
    expect(reissueNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should delegate to the nfse reissue with the nfse id and the operator reason', async() => {
    // Arrange
    const output = { nfseId: 99, replacedRequestCode: 'req-failed' };
    jest.spyOn(findNfmById, 'execute').mockResolvedValue(makeNfm());
    jest.spyOn(reissueNfseBankPayment, 'execute').mockResolvedValue(output);

    // Act
    const result = await sut.execute(10, { reason: 'Inter reportou FALHA_EMISSAO', confirm: true });

    // Assert
    expect(findNfmById.execute).toHaveBeenCalledWith(10);
    expect(reissueNfseBankPayment.execute).toHaveBeenCalledWith({ nfseId: 99, reason: 'Inter reportou FALHA_EMISSAO' });
    expect(result).toBe(output);
  });
});
