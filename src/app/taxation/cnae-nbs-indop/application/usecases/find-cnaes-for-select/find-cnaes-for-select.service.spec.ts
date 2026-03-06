import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CnaeDto } from 'src/app/taxation/cnae/application/dtos/cnae.dto';
import { FindCnaeById } from 'src/app/taxation/cnae/application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindCnaesForSelect } from './find-cnaes-for-select.service';

describe('FindCnaesForSelect - Unit tests', () => {
  let sut: FindCnaesForSelect;
  let cnaeNbsIndopDao: ICnaeNbsIndopDao;
  let findCnaeById: FindCnaeById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindCnaesForSelect,
        { provide: TOKENS.CnaeNbsIndopDao, useValue: createMock<ICnaeNbsIndopDao>() },
        { provide: FindCnaeById, useValue: createMock<FindCnaeById>() },
      ],
    }).compile();

    sut = module.get(FindCnaesForSelect);
    cnaeNbsIndopDao = module.get(TOKENS.CnaeNbsIndopDao);
    findCnaeById = module.get(FindCnaeById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return CNAEs that have combinations and are active', async() => {
    const cnaeIds = [1, 2];
    const cnae1 = createMock<CnaeDto>({ id: 1, code: 'A', active: true });
    const cnae2 = createMock<CnaeDto>({ id: 2, code: 'B', active: true });
    jest.spyOn(cnaeNbsIndopDao, 'findDistinctCnaeIds').mockResolvedValue(cnaeIds);
    jest.spyOn(findCnaeById, 'execute').mockImplementation((id) => {
      if (id === 1) return Promise.resolve(cnae1);
      if (id === 2) return Promise.resolve(cnae2);
      return Promise.reject(new Error('Not found'));
    });

    const result = await sut.execute();

    expect(cnaeNbsIndopDao.findDistinctCnaeIds).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual([1, 2]);
  });

  it('should return empty array when no combinations exist', async() => {
    jest.spyOn(cnaeNbsIndopDao, 'findDistinctCnaeIds').mockResolvedValue([]);

    const result = await sut.execute();

    expect(result).toEqual([]);
  });

  it('should skip CNAE that throw (not found or inactive)', async() => {
    const cnaeIds = [1, 2, 3];
    const cnae1 = createMock<CnaeDto>({ id: 1, code: 'A', active: true });
    jest.spyOn(cnaeNbsIndopDao, 'findDistinctCnaeIds').mockResolvedValue(cnaeIds);
    jest.spyOn(findCnaeById, 'execute').mockImplementation((id) => {
      if (id === 1) return Promise.resolve(cnae1);
      return Promise.reject(new Error('Not found or inactive'));
    });

    const result = await sut.execute();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
