import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NbsDto } from 'src/app/nbs/nbs/application/dtos/nbs.dto';
import type { INbsDao } from 'src/app/nbs/nbs/application/persistence/dao/nbs-dao.interface';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindNbsByCnaeForSelectQueryDto } from './dtos/find-nbs-by-cnae-for-select.dto';
import { FindNbsByCnaeForSelect } from './find-nbs-by-cnae-for-select.service';

describe('FindNbsByCnaeForSelect - Unit tests', () => {
  let sut: FindNbsByCnaeForSelect;
  let cnaeNbsIndopDao: ICnaeNbsIndopDao;
  let nbsDao: INbsDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindNbsByCnaeForSelect,
        { provide: TOKENS.CnaeNbsIndopDao, useValue: createMock<ICnaeNbsIndopDao>() },
        { provide: TOKENS.NbsDao, useValue: createMock<INbsDao>() },
      ],
    }).compile();

    sut = module.get(FindNbsByCnaeForSelect);
    cnaeNbsIndopDao = module.get(TOKENS.CnaeNbsIndopDao);
    nbsDao = module.get(TOKENS.NbsDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return NBSs that have combinations with the given CNAE', async() => {
    const queries: FindNbsByCnaeForSelectQueryDto = { cnaeId: 1 };
    const nbsIds = [1, 2];
    const nbs1 = createMock<NbsDto>({ id: 1, code: 'A', active: true });
    const nbs2 = createMock<NbsDto>({ id: 2, code: 'B', active: true });
    jest.spyOn(cnaeNbsIndopDao, 'findDistinctNbsIdsByCnaeId').mockResolvedValue(nbsIds);
    jest.spyOn(nbsDao, 'findById').mockImplementation((id) => {
      if (id === 1) return Promise.resolve(nbs1);
      if (id === 2) return Promise.resolve(nbs2);
      return Promise.resolve(null);
    });

    const result = await sut.execute(queries);

    expect(cnaeNbsIndopDao.findDistinctNbsIdsByCnaeId).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no NBS combinations exist for CNAE', async() => {
    const queries: FindNbsByCnaeForSelectQueryDto = { cnaeId: 1 };
    jest.spyOn(cnaeNbsIndopDao, 'findDistinctNbsIdsByCnaeId').mockResolvedValue([]);

    const result = await sut.execute(queries);

    expect(result).toEqual([]);
  });
});
