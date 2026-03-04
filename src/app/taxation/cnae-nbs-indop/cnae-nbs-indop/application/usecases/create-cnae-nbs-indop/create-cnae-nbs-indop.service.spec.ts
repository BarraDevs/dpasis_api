import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindCnaeById } from 'src/app/taxation/cnae/cnae/application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { FindIndopById } from 'src/app/taxation/indop/indop/application/usecases/find-indop-by-id/find-indop-by-id.service';
import { FindNbsById } from 'src/app/taxation/nbs/nbs/application/usecases/find-nbs-by-id/find-nbs-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { CnaeNbsIndopAlreadyExistsError } from '../../../domain/errors/cnae-nbs-indop-already-exists.error';
import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { CreateCnaeNbsIndop } from './create-cnae-nbs-indop.service';
import { CreateCnaeNbsIndopInputDto } from './dtos/create-cnae-nbs-indop.dto';

describe('CreateCnaeNbsIndop - Unit tests', () => {
  let sut: CreateCnaeNbsIndop;
  let cnaeNbsIndopDao: ICnaeNbsIndopDao;
  let findCnaeById: FindCnaeById;
  let findNbsById: FindNbsById;
  let findIndopById: FindIndopById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateCnaeNbsIndop,
        { provide: TOKENS.CnaeNbsIndopDao, useValue: createMock<ICnaeNbsIndopDao>() },
        { provide: FindCnaeById, useValue: createMock<FindCnaeById>() },
        { provide: FindNbsById, useValue: createMock<FindNbsById>() },
        { provide: FindIndopById, useValue: createMock<FindIndopById>() },
      ],
    }).compile();

    sut = module.get(CreateCnaeNbsIndop);
    cnaeNbsIndopDao = module.get(TOKENS.CnaeNbsIndopDao);
    findCnaeById = module.get(FindCnaeById);
    findNbsById = module.get(FindNbsById);
    findIndopById = module.get(FindIndopById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CnaeNbsIndopAlreadyExistsError when combination already exists', async() => {
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: 1, nbsId: 1, indopId: 1 };
    jest.spyOn(findCnaeById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(findNbsById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(findIndopById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(cnaeNbsIndopDao, 'findByComposite').mockResolvedValue(createMock<CnaeNbsIndopDto>());

    await expect(sut.execute(input)).rejects.toThrow(CnaeNbsIndopAlreadyExistsError);
  });

  it('should validate CNAE, NBS and INDOP exist and are active before creating', async() => {
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: 1, nbsId: 2, indopId: 3 };
    jest.spyOn(findCnaeById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(findNbsById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(findIndopById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(cnaeNbsIndopDao, 'findByComposite').mockResolvedValue(null);
    jest.spyOn(cnaeNbsIndopDao, 'save').mockResolvedValue(1);

    await sut.execute(input);

    expect(findCnaeById.execute).toHaveBeenCalledWith(1, true);
    expect(findNbsById.execute).toHaveBeenCalledWith(2, true);
    expect(findIndopById.execute).toHaveBeenCalledWith(3, true);
  });

  it('should create and return id when combination does not exist', async() => {
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: 1, nbsId: 2, indopId: 3 };
    jest.spyOn(findCnaeById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(findNbsById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(findIndopById, 'execute').mockResolvedValue(createMock());
    jest.spyOn(cnaeNbsIndopDao, 'findByComposite').mockResolvedValue(null);
    jest.spyOn(cnaeNbsIndopDao, 'save').mockResolvedValue(42);

    const result = await sut.execute(input);

    expect(result).toEqual({ id: 42 });
    expect(cnaeNbsIndopDao.save).toHaveBeenCalledWith(input);
  });
});
