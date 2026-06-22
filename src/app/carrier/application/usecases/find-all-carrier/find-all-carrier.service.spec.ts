import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CarrierDto } from '../../dtos/carrier.dto';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';
import { FindAllCarrier } from './find-all-carrier.service';

describe('FindAllCarrier - Unit tests', () => {
  let sut: FindAllCarrier;
  let carrierDao: ICarrierDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllCarrier,
        { provide: TOKENS.CarrierDao, useValue: createMock<ICarrierDao>() },
      ],
    }).compile();

    sut = module.get(FindAllCarrier);
    carrierDao = module.get(TOKENS.CarrierDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return paginated result from dao', async() => {
    const carriers = [createMock<CarrierDto>()];
    jest.spyOn(carrierDao, 'findAll').mockResolvedValue([carriers, 1]);

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result).toEqual(new Pagination(carriers, 1, 1, 10).getDto());
  });
});
