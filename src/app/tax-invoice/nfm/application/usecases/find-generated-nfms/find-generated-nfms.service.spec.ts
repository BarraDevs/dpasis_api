import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { NfmWithNfseDto } from '../../dtos/nfm.dto';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
import { InvalidNfmDateRangeError } from '../../../domain/errors/invalid-nfm-date-range.error';
import { FindGeneratedNfmsQueryDto } from './dtos/find-generated-nfms.dto';
import { FindGeneratedNfms } from './find-generated-nfms.service';

describe('FindGeneratedNfms - Unit tests', () => {
  let sut: FindGeneratedNfms;
  let nfmDao: INfmDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindGeneratedNfms,
        {
          provide: TOKENS.NfmDao,
          useValue: createMock<INfmDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindGeneratedNfms);
    nfmDao = module.get(TOKENS.NfmDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call nfmDao.findAll and return paginated result', async() => {
    // Arrange
    const query: FindGeneratedNfmsQueryDto = { page: 1, size: 10 };
    const mockRow = createMock<NfmWithNfseDto>();
    jest.spyOn(nfmDao, 'findAll').mockResolvedValue([[mockRow], 1]);

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(nfmDao.findAll).toHaveBeenCalledWith(query);
    expect(result.data).toEqual([mockRow]);
    expect(result.totalItems).toBe(1);
  });

  it('should pass date filters to dao', async() => {
    // Arrange
    const query: FindGeneratedNfmsQueryDto = {
      dateStart: '2026-08-01',
      dateEnd: '2026-08-31',
    };
    jest.spyOn(nfmDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    await sut.execute(query);

    // Assert
    expect(nfmDao.findAll).toHaveBeenCalledWith(query);
  });

  it('should throw InvalidNfmDateRangeError when dateStart is after dateEnd', async() => {
    // Arrange
    const query: FindGeneratedNfmsQueryDto = {
      dateStart: '2026-08-31',
      dateEnd: '2026-08-01',
    };

    // Act & Assert
    await expect(sut.execute(query)).rejects.toThrow(InvalidNfmDateRangeError);
    expect(nfmDao.findAll).not.toHaveBeenCalled();
  });

  it('should allow only dateStart', async() => {
    // Arrange
    const query: FindGeneratedNfmsQueryDto = { dateStart: '2026-08-01' };
    jest.spyOn(nfmDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    await sut.execute(query);

    // Assert
    expect(nfmDao.findAll).toHaveBeenCalledWith(query);
  });

  it('should allow only dateEnd', async() => {
    // Arrange
    const query: FindGeneratedNfmsQueryDto = { dateEnd: '2026-08-31' };
    jest.spyOn(nfmDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    await sut.execute(query);

    // Assert
    expect(nfmDao.findAll).toHaveBeenCalledWith(query);
  });
});
