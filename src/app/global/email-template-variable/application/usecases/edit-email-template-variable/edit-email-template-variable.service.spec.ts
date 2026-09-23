import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateVariableAlreadyExistsError } from '../../../domain/errors/email-template-variable-already-exists.error';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { EditEmailTemplateVariableInputDto } from './dtos/edit-email-template-variable.dto';
import { EditEmailTemplateVariable } from './edit-email-template-variable.service';

describe('EditEmailTemplateVariable - Unit tests', () => {
  let sut: EditEmailTemplateVariable;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditEmailTemplateVariable,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(EditEmailTemplateVariable);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateVariableNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0, { label: 'Novo' })).rejects.toThrow(EmailTemplateVariableNotFoundError);
  });

  it('should throw EmailTemplateVariableAlreadyExistsError when key belongs to another row', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(createMock<EmailTemplateVariableDto>({ id: 1 }));
    jest.spyOn(emailTemplateVariableDao, 'findByKey').mockResolvedValue(createMock<EmailTemplateVariableDto>({ id: 2, key: 'nfse.numero' }));

    await expect(sut.execute(1, { key: 'nfse.numero' })).rejects.toThrow(EmailTemplateVariableAlreadyExistsError);
  });

  it('should edit without uniqueness check when key is omitted', async() => {
    const data: EditEmailTemplateVariableInputDto = { label: 'Novo rótulo' };
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(createMock<EmailTemplateVariableDto>({ id: 1 }));

    const result = await sut.execute(1, data);

    expect(emailTemplateVariableDao.findByKey).not.toHaveBeenCalled();
    expect(emailTemplateVariableDao.edit).toHaveBeenCalledWith(1, data);
    expect(result).toEqual<SuccessMessage>({ message: 'Edição realizada com sucesso' });
  });
});
