import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { HonorificNotFoundError } from 'src/app/global/honorific/domain/errors/honorific-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { UpdateHonorificStatus } from './update-honorific-status.service';

describe('UpdateHonorificStatus - Unit tests', () => {
  let sut: UpdateHonorificStatus;
  let honorificDao: IHonorificDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateHonorificStatus,
        {
          provide: TOKENS.HonorificDao,
          useValue: createMock<IHonorificDao>(),
        },
      ],
    }).compile();

    sut = module.get(UpdateHonorificStatus);
    honorificDao = module.get(TOKENS.HonorificDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw HonorificNotFoundError when missing', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(HonorificNotFoundError);
  });

  it('should toggle active true to false', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>({ id: 1, active: true }));
    const spy = jest.spyOn(honorificDao, 'updateStatus').mockResolvedValue();

    await sut.execute(1);

    expect(spy).toHaveBeenCalledWith(1, false);
  });

  it('should return success message', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>({ active: true }));
    jest.spyOn(honorificDao, 'updateStatus').mockResolvedValue();

    const result = await sut.execute(1);

    expect(result.message).toBe('Status do pronome de tratamento atualizado com sucesso');
  });
});
