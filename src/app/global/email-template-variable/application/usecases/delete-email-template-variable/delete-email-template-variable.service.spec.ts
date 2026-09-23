import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { DeleteEmailTemplateVariable } from './delete-email-template-variable.service';

describe('DeleteEmailTemplateVariable - Unit tests', () => {
  let sut: DeleteEmailTemplateVariable;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteEmailTemplateVariable,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteEmailTemplateVariable);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateVariableNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateVariableNotFoundError);
    expect(emailTemplateVariableDao.delete).not.toHaveBeenCalled();
  });

  it('should delete and return success message', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(createMock<EmailTemplateVariableDto>({ id: 1 }));

    const result = await sut.execute(1);

    expect(emailTemplateVariableDao.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual<SuccessMessage>({ message: 'Exclusão realizada com sucesso' });
  });
});
