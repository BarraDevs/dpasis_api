import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { HonorificAlreadyExistsError } from 'src/app/honorific/domain/errors/honorific-already-exists.error';
import { TOKENS } from 'src/core/di/token';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { CreateHonorific } from './create-honorific.service';
import { CreateHonorificInputDto, CreateHonorificOutputDto } from './dtos/create-honorific.dto';

function makeValidCreateHonorificInput(overrides: Partial<CreateHonorificInputDto> = {}): CreateHonorificInputDto {
  return {
    name: 'Sr.',
    ...overrides,
  };
}

describe('CreateHonorific - Unit tests', () => {
  let sut: CreateHonorific;
  let honorificDao: IHonorificDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateHonorific,
        {
          provide: TOKENS.HonorificDao,
          useValue: createMock<IHonorificDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateHonorific);
    honorificDao = module.get(TOKENS.HonorificDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw HonorificAlreadyExistsError when name is taken', async() => {
    const input = makeValidCreateHonorificInput({ name: 'Dr.' });
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(createMock<HonorificDto>({ id: 1, name: 'Dr.' }));

    await expect(sut.execute(input)).rejects.toThrow(HonorificAlreadyExistsError);
  });

  it('should call honorificDao.save with trimmed name when name is free', async() => {
    const input = makeValidCreateHonorificInput({ name: '  Sr.  ' });
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(null);
    const saveSpy = jest.spyOn(honorificDao, 'save').mockResolvedValue(1);

    await sut.execute(input);

    expect(saveSpy).toHaveBeenCalledWith({ name: 'Sr.' });
  });

  it('should return id from honorificDao.save', async() => {
    const input = makeValidCreateHonorificInput();
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(null);
    jest.spyOn(honorificDao, 'save').mockResolvedValue(5);

    const result = await sut.execute(input);

    expect(result).toEqual<CreateHonorificOutputDto>({ id: 5 });
  });
});
