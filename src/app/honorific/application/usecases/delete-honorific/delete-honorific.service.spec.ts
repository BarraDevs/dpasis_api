import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { HonorificInUseError } from 'src/app/honorific/domain/errors/honorific-in-use.error';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { DeleteHonorific } from './delete-honorific.service';

describe('DeleteHonorific - Unit tests', () => {
  let sut: DeleteHonorific;
  let honorificDao: IHonorificDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteHonorific,
        {
          provide: TOKENS.HonorificDao,
          useValue: createMock<IHonorificDao>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteHonorific);
    honorificDao = module.get(TOKENS.HonorificDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw HonorificNotFoundError when not found', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(HonorificNotFoundError);
  });

  it('should call delete after findById', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>());
    jest.spyOn(honorificDao, 'countClientsById').mockResolvedValue(0);
    const deleteSpy = jest.spyOn(honorificDao, 'delete').mockResolvedValue();

    await sut.execute(3);

    expect(deleteSpy).toHaveBeenCalledWith(3);
  });

  it('should return success message', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>());
    jest.spyOn(honorificDao, 'countClientsById').mockResolvedValue(0);
    jest.spyOn(honorificDao, 'delete').mockResolvedValue();

    const result = await sut.execute(1);

    expect(result).toEqual<SuccessMessage>({ message: 'Pronome de tratamento excluído com sucesso' });
  });

  it('should throw HonorificInUseError when clients reference honorific', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>());
    jest.spyOn(honorificDao, 'countClientsById').mockResolvedValue(1);

    await expect(sut.execute(5)).rejects.toThrow(HonorificInUseError);
  });
});
