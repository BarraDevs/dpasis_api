import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { CarrierDto } from '../../dtos/carrier.dto';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';
import { FindCarrierById } from './find-carrier-by-id.service';

describe('FindCarrierById - Unit tests', () => {
  let sut: FindCarrierById;
  let carrierDao: ICarrierDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindCarrierById,
        { provide: TOKENS.CarrierDao, useValue: createMock<ICarrierDao>() },
      ],
    }).compile();

    sut = module.get(FindCarrierById);
    carrierDao = module.get(TOKENS.CarrierDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CarrierNotFoundError when carrier does not exist', async() => {
    jest.spyOn(carrierDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(CarrierNotFoundError);
  });

  it('should return carrier when found', async() => {
    const carrier = createMock<CarrierDto>({ active: true });
    jest.spyOn(carrierDao, 'findById').mockResolvedValue(carrier);

    const result = await sut.execute(1);

    expect(result).toEqual(carrier);
  });

  it('should throw CarrierNotFoundError when onlyActive and carrier is inactive', async() => {
    const carrier = createMock<CarrierDto>({ active: false });
    jest.spyOn(carrierDao, 'findById').mockResolvedValue(carrier);

    await expect(sut.execute(1, { onlyActive: true })).rejects.toThrow(CarrierNotFoundError);
  });
});
