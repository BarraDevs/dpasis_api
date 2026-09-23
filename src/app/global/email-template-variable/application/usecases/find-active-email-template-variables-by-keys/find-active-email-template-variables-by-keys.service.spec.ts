import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { FindActiveEmailTemplateVariablesByKeys } from './find-active-email-template-variables-by-keys.service';

describe('FindActiveEmailTemplateVariablesByKeys - Unit tests', () => {
  let sut: FindActiveEmailTemplateVariablesByKeys;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindActiveEmailTemplateVariablesByKeys,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindActiveEmailTemplateVariablesByKeys);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty array without querying when keys is empty', async() => {
    const result = await sut.execute([]);

    expect(result).toEqual([]);
    expect(emailTemplateVariableDao.findActiveByKeys).not.toHaveBeenCalled();
  });

  it('should return active variables for the given keys', async() => {
    const rows = [createMock<EmailTemplateVariableDto>({ key: 'nfse.numero', active: true })];
    jest.spyOn(emailTemplateVariableDao, 'findActiveByKeys').mockResolvedValue(rows);

    const result = await sut.execute(['nfse.numero']);

    expect(emailTemplateVariableDao.findActiveByKeys).toHaveBeenCalledWith(['nfse.numero']);
    expect(result).toEqual(rows);
  });
});
