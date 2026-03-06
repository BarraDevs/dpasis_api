import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { IndopDto } from 'src/app/taxation/indop/indop/application/dtos/indop.dto';
import { FindIndopById } from 'src/app/taxation/indop/indop/application/usecases/find-indop-by-id/find-indop-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from './dtos/find-indops-by-cnae-and-nbs-for-select.dto';
import { FindIndopsByCnaeAndNbsForSelect } from './find-indops-by-cnae-and-nbs-for-select.service';

describe('FindIndopsByCnaeAndNbsForSelect - Unit tests', () => {
  let sut: FindIndopsByCnaeAndNbsForSelect;
  let cnaeNbsIndopDao: ICnaeNbsIndopDao;
  let findIndopById: FindIndopById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindIndopsByCnaeAndNbsForSelect,
        { provide: TOKENS.CnaeNbsIndopDao, useValue: createMock<ICnaeNbsIndopDao>() },
        { provide: FindIndopById, useValue: createMock<FindIndopById>() },
      ],
    }).compile();

    sut = module.get(FindIndopsByCnaeAndNbsForSelect);
    cnaeNbsIndopDao = module.get(TOKENS.CnaeNbsIndopDao);
    findIndopById = module.get(FindIndopById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return INDOPs that have combinations with the given CNAE and NBS', async() => {
    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId: 1, nbsId: 2 };
    const indopIds = [1, 2];
    const indop1 = createMock<IndopDto>({ id: 1, code: 'A', active: true });
    const indop2 = createMock<IndopDto>({ id: 2, code: 'B', active: true });
    jest
      .spyOn(cnaeNbsIndopDao, 'findDistinctIndopIdsByCnaeIdAndNbsId')
      .mockResolvedValue(indopIds);
    jest.spyOn(findIndopById, 'execute').mockImplementation((id) => {
      if (id === 1) return Promise.resolve(indop1);
      if (id === 2) return Promise.resolve(indop2);
      return Promise.reject(new Error('Not found'));
    });

    const result = await sut.execute(queries);

    expect(cnaeNbsIndopDao.findDistinctIndopIdsByCnaeIdAndNbsId).toHaveBeenCalledWith(1, 2);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no INDOP combinations exist', async() => {
    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId: 1, nbsId: 2 };
    jest
      .spyOn(cnaeNbsIndopDao, 'findDistinctIndopIdsByCnaeIdAndNbsId')
      .mockResolvedValue([]);

    const result = await sut.execute(queries);

    expect(result).toEqual([]);
  });

  it('should skip INDOP that throw (not found or inactive)', async() => {
    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId: 1, nbsId: 2 };
    const indopIds = [1, 2, 3];
    const indop1 = createMock<IndopDto>({ id: 1, code: 'A', active: true });
    jest
      .spyOn(cnaeNbsIndopDao, 'findDistinctIndopIdsByCnaeIdAndNbsId')
      .mockResolvedValue(indopIds);
    jest.spyOn(findIndopById, 'execute').mockImplementation((id) => {
      if (id === 1) return Promise.resolve(indop1);
      return Promise.reject(new Error('Not found or inactive'));
    });

    const result = await sut.execute(queries);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
