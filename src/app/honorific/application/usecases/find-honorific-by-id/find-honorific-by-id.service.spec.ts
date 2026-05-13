import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { FindHonorificById } from './find-honorific-by-id.service';

describe('FindHonorificById - Unit tests', () => {
  let sut: FindHonorificById;
  let honorificDao: IHonorificDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindHonorificById,
        {
          provide: TOKENS.HonorificDao,
          useValue: createMock<IHonorificDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindHonorificById);
    honorificDao = module.get(TOKENS.HonorificDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when not found', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(HonorificNotFoundError);
  });

  it('should return dto when found', async() => {
    const dto = createMock<HonorificDto>({ id: 1, name: 'Sr.' });
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(dto);

    await expect(sut.execute(1)).resolves.toEqual(dto);
  });
});
