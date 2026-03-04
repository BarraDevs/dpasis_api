import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { CnaeNbsIndopNotFoundError } from '../../../domain/errors/cnae-nbs-indop-not-found.error';
import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { DeleteCnaeNbsIndop } from './delete-cnae-nbs-indop.service';

describe('DeleteCnaeNbsIndop - Unit tests', () => {
  let sut: DeleteCnaeNbsIndop;
  let cnaeNbsIndopDao: ICnaeNbsIndopDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteCnaeNbsIndop,
        { provide: TOKENS.CnaeNbsIndopDao, useValue: createMock<ICnaeNbsIndopDao>() },
      ],
    }).compile();

    sut = module.get(DeleteCnaeNbsIndop);
    cnaeNbsIndopDao = module.get(TOKENS.CnaeNbsIndopDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CnaeNbsIndopNotFoundError when combination does not exist', async() => {
    const id = 999;
    jest.spyOn(cnaeNbsIndopDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(id)).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should call cnaeNbsIndopDao.delete when combination exists', async() => {
    const id = 1;
    jest.spyOn(cnaeNbsIndopDao, 'findById').mockResolvedValue(createMock<CnaeNbsIndopDto>());
    const deleteSpy = jest.spyOn(cnaeNbsIndopDao, 'delete');

    await sut.execute(id);

    expect(deleteSpy).toHaveBeenCalledWith(id);
  });

  it('should return success message when deleted', async() => {
    const id = 1;
    jest.spyOn(cnaeNbsIndopDao, 'findById').mockResolvedValue(createMock<CnaeNbsIndopDto>());
    jest.spyOn(cnaeNbsIndopDao, 'delete').mockResolvedValue();

    const result = await sut.execute(id);

    expect(result).toEqual({ message: 'Combinação excluída com sucesso.' });
  });
});
