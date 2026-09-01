import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CancelNfse } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/cancel-nfse.service';
import { CancelNfseOutputDto } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/dtos/cancel-nfse.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseNotIssuedError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-issued.error';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { TOKENS } from 'src/core/di/token';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { CancelNfm } from './cancel-nfm.service';
import { CancelNfmInputDto } from './dtos/cancel-nfm.dto';

function makeNfm(overrides: { id?: number; withIssuedNfse?: boolean; withPendingNfse?: boolean } = {}): Nfm {
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
      bankPaymentProvider: null,
      bankPaymentRequestCode: null,
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

  beforeEach(async() => {
    nfmRepository = createMock<INfmRepository>();

    const module = await Test.createTestingModule({
      providers: [
        CancelNfm,
        { provide: TOKENS.NfmRepository, useValue: nfmRepository },
        { provide: CancelNfse, useValue: createMock<CancelNfse>() },
      ],
    }).compile();

    sut = module.get(CancelNfm);
    cancelNfse = module.get(CancelNfse);
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
    });
  });
});
