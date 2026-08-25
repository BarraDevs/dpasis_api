import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { CancelNfse } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/cancel-nfse.service';
import { CancelNfseOutputDto } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/dtos/cancel-nfse.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmWithNfseDto } from '../../dtos/nfm.dto';
import { FindNfmById } from '../find-nfm-by-id/find-nfm-by-id.service';
import { CancelNfm } from './cancel-nfm.service';
import { CancelNfmInputDto } from './dtos/cancel-nfm.dto';

describe('CancelNfm - Unit tests', () => {
  let sut: CancelNfm;
  let findNfmById: FindNfmById;
  let cancelNfse: CancelNfse;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CancelNfm,
        { provide: FindNfmById, useValue: createMock<FindNfmById>() },
        { provide: CancelNfse, useValue: createMock<CancelNfse>() },
      ],
    }).compile();

    sut = module.get(CancelNfm);
    findNfmById = module.get(FindNfmById);
    cancelNfse = module.get(CancelNfse);
  });

  const input: CancelNfmInputDto = { cancelReasonCode: 2 };

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(findNfmById, 'execute').mockRejectedValue(new NfmNotFoundError());

    // Act & Assert
    await expect(sut.execute(1, input)).rejects.toThrow(NfmNotFoundError);
    expect(cancelNfse.execute).not.toHaveBeenCalled();
  });

  it('should cancel via CancelNfse using nfse.id and return nfm id', async() => {
    // Arrange
    const nfm = createMock<NfmWithNfseDto>({
      id: 10,
      nfse: createMock<NfseDto>({ id: 99 }),
    });
    const cancelOutput = createMock<CancelNfseOutputDto>({
      id: 99,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
    });
    jest.spyOn(findNfmById, 'execute').mockResolvedValue(nfm);
    jest.spyOn(cancelNfse, 'execute').mockResolvedValue(cancelOutput);

    // Act
    const result = await sut.execute(10, input);

    // Assert
    expect(findNfmById.execute).toHaveBeenCalledWith(10);
    expect(cancelNfse.execute).toHaveBeenCalledWith(99, input);
    expect(result).toEqual({
      id: 10,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
    });
  });
});
