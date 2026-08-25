import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmWithNfseDto } from '../../dtos/nfm.dto';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
import { FindNfmById } from './find-nfm-by-id.service';

describe('FindNfmById - Unit tests', () => {
  let sut: FindNfmById;
  let nfmDao: INfmDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindNfmById,
        { provide: TOKENS.NfmDao, useValue: createMock<INfmDao>() },
      ],
    }).compile();

    sut = module.get(FindNfmById);
    nfmDao = module.get(TOKENS.NfmDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(nfmDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(NfmNotFoundError);
  });

  it('should return the nfm when found', async() => {
    // Arrange
    const nfm = createMock<NfmWithNfseDto>({ id: 1 });
    jest.spyOn(nfmDao, 'findById').mockResolvedValue(nfm);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual(nfm);
  });
});
