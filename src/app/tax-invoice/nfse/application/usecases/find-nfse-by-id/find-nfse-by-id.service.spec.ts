import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseDto } from '../../dtos/nfse.dto';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import { FindNfseById } from './find-nfse-by-id.service';

describe('FindNfseById - Unit tests', () => {
  let sut: FindNfseById;
  let nfseDao: INfseDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindNfseById,
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
      ],
    }).compile();

    sut = module.get(FindNfseById);
    nfseDao = module.get(TOKENS.NfseDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(NfseNotFoundError);
  });

  it('should return the nfse when found', async() => {
    // Arrange
    const nfse = createMock<NfseDto>({ id: 1 });
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(nfse);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual(nfse);
  });
});
