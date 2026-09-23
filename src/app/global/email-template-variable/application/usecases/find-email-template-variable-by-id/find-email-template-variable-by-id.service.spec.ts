import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { FindEmailTemplateVariableById } from './find-email-template-variable-by-id.service';

describe('FindEmailTemplateVariableById - Unit tests', () => {
  let sut: FindEmailTemplateVariableById;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindEmailTemplateVariableById,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindEmailTemplateVariableById);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateVariableNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateVariableNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Variável de template de e-mail não encontrada na base de dados.');
  });

  it('should return the variable when found', async() => {
    const mockVariable = createMock<EmailTemplateVariableDto>({ id: 1, key: 'nfse.numero' });
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(mockVariable);

    const result = await sut.execute(1);

    expect(emailTemplateVariableDao.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockVariable);
  });
});
