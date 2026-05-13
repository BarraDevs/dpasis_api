import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { FindAllHonorificQueryDto } from './dtos/find-all-honorific.dto';
import { FindAllHonorific } from './find-all-honorific.service';

describe('FindAllHonorific - Unit tests', () => {
  let sut: FindAllHonorific;
  let honorificDao: IHonorificDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllHonorific,
        {
          provide: TOKENS.HonorificDao,
          useValue: createMock<IHonorificDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllHonorific);
    honorificDao = module.get(TOKENS.HonorificDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should delegate to dao and return pagination dto', async() => {
    const rows = [createMock<HonorificDto>()];
    jest.spyOn(honorificDao, 'findAll').mockResolvedValue([rows, 1]);

    const result = await sut.execute({ page: 1, size: 10 } as FindAllHonorificQueryDto);

    expect(result.data).toEqual(rows);
    expect(result.totalItems).toBe(1);
  });
});
