import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindAllCnaeNbsIndopQueryDto } from './dtos/find-all-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndop } from './find-all-cnae-nbs-indop.service';

describe('FindAllCnaeNbsIndop - Unit tests', () => {
  let sut: FindAllCnaeNbsIndop;
  let cnaeNbsIndopDao: ICnaeNbsIndopDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllCnaeNbsIndop,
        { provide: TOKENS.CnaeNbsIndopDao, useValue: createMock<ICnaeNbsIndopDao>() },
      ],
    }).compile();

    sut = module.get(FindAllCnaeNbsIndop);
    cnaeNbsIndopDao = module.get(TOKENS.CnaeNbsIndopDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call cnaeNbsIndopDao.findAll and return paginated result', async() => {
    const queries: FindAllCnaeNbsIndopQueryDto = { page: 1, size: 10 };
    const data = [createMock<CnaeNbsIndopDto>()];
    const total = 1;
    jest.spyOn(cnaeNbsIndopDao, 'findAll').mockResolvedValue([data, total]);

    const result = await sut.execute(queries);

    expect(cnaeNbsIndopDao.findAll).toHaveBeenCalledWith(queries);
    expect(result.data).toEqual(data);
    expect(result.totalItems).toBe(total);
  });
});
