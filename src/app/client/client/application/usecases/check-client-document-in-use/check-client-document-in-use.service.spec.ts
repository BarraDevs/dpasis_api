import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { CheckClientDocumentInUse } from './check-client-document-in-use.service';
import { CheckClientDocumentInUseInputDto } from './dtos/check-client-document-in-use.dto';

function makeCheckInput(overrides: Partial<CheckClientDocumentInUseInputDto> = {}): CheckClientDocumentInUseInputDto {
  return {
    document: '09.748.165/0001-10',
    ...overrides,
  };
}

describe('CheckClientDocumentInUse - Unit tests', () => {
  let sut: CheckClientDocumentInUse;
  let clientDao: IClientDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CheckClientDocumentInUse,
        { provide: TOKENS.ClientDao, useValue: createMock<IClientDao>() },
      ],
    }).compile();

    sut = module.get(CheckClientDocumentInUse);
    clientDao = module.get(TOKENS.ClientDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return documentInUse false when findByDocument returns null', async() => {
    jest.spyOn(clientDao, 'findByDocument').mockResolvedValueOnce(null);

    const result = await sut.execute(makeCheckInput());

    expect(result).toEqual({ documentInUse: false });
    expect(clientDao.findByDocument).toHaveBeenCalledWith('09748165000110');
  });

  it('should return documentInUse true when findByDocument returns a client', async() => {
    jest.spyOn(clientDao, 'findByDocument').mockResolvedValueOnce({
      id: 1,
    } as Awaited<ReturnType<IClientDao['findByDocument']>>);

    const result = await sut.execute(makeCheckInput());

    expect(result).toEqual({ documentInUse: true });
  });
});
