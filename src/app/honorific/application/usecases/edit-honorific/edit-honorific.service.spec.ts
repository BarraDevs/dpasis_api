import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { HonorificAlreadyExistsError } from 'src/app/honorific/domain/errors/honorific-already-exists.error';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { EditHonorificInputDto } from './dtos/edit-honorific.dto';
import { EditHonorific } from './edit-honorific.service';

describe('EditHonorific - Unit tests', () => {
  let sut: EditHonorific;
  let honorificDao: IHonorificDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditHonorific,
        {
          provide: TOKENS.HonorificDao,
          useValue: createMock<IHonorificDao>(),
        },
      ],
    }).compile();

    sut = module.get(EditHonorific);
    honorificDao = module.get(TOKENS.HonorificDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw HonorificNotFoundError when honorific does not exist', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1, { name: 'X' })).rejects.toThrow(HonorificNotFoundError);
  });

  it('should throw HonorificAlreadyExistsError when name belongs to another row', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>({ id: 1, name: 'Sr.' }));
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(createMock<HonorificDto>({ id: 2, name: 'Dr.' }));

    await expect(sut.execute(1, { name: 'Dr.' })).rejects.toThrow(HonorificAlreadyExistsError);
  });

  it('should call edit with trimmed name when name is provided', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>({ id: 1 }));
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(null);
    const editSpy = jest.spyOn(honorificDao, 'edit').mockResolvedValue();

    await sut.execute(1, { name: '  Dr.  ' });

    expect(editSpy).toHaveBeenCalledWith(1, { name: 'Dr.' });
  });

  it('should allow keeping same name (id matches)', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>({ id: 1, name: 'Sr.' }));
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(createMock<HonorificDto>({ id: 1, name: 'Sr.' }));
    const editSpy = jest.spyOn(honorificDao, 'edit').mockResolvedValue();

    await sut.execute(1, { name: 'Sr.' });

    expect(editSpy).toHaveBeenCalledWith(1, { name: 'Sr.' });
  });

  it('should call edit without findByName when name omitted', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>({ id: 1 }));
    const findByNameSpy = jest.spyOn(honorificDao, 'findByName');
    const editSpy = jest.spyOn(honorificDao, 'edit').mockResolvedValue();

    await sut.execute(1, {});

    expect(findByNameSpy).not.toHaveBeenCalled();
    expect(editSpy).toHaveBeenCalledWith(1, {});
  });

  it('should return success message', async() => {
    jest.spyOn(honorificDao, 'findById').mockResolvedValue(createMock<HonorificDto>());
    jest.spyOn(honorificDao, 'findByName').mockResolvedValue(null);
    jest.spyOn(honorificDao, 'edit').mockResolvedValue();

    const result = await sut.execute(1, { name: 'Sra.' } as EditHonorificInputDto);

    expect(result).toEqual<SuccessMessage>({
      message: 'Pronome de tratamento atualizado com sucesso',
    });
  });
});
