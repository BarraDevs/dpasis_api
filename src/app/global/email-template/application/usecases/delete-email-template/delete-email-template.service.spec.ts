import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { DeleteEmailTemplate } from './delete-email-template.service';

describe('DeleteEmailTemplate - Unit tests', () => {
  let sut: DeleteEmailTemplate;
  let emailTemplateDao: IEmailTemplateDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteEmailTemplate,
        {
          provide: TOKENS.EmailTemplateDao,
          useValue: createMock<IEmailTemplateDao>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteEmailTemplate);
    emailTemplateDao = module.get(TOKENS.EmailTemplateDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateNotFoundError);
    expect(emailTemplateDao.delete).not.toHaveBeenCalled();
  });

  it('should delete and return success message', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(createMock<EmailTemplateDto>({ id: 1 }));

    const result = await sut.execute(1);

    expect(emailTemplateDao.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual<SuccessMessage>({ message: 'Exclusão realizada com sucesso' });
  });
});
