import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailTemplateAlreadyExistsError } from '../../../domain/errors/email-template-already-exists.error';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { EditEmailTemplate } from './edit-email-template.service';

describe('EditEmailTemplate - Unit tests', () => {
  let sut: EditEmailTemplate;
  let emailTemplateDao: IEmailTemplateDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditEmailTemplate,
        {
          provide: TOKENS.EmailTemplateDao,
          useValue: createMock<IEmailTemplateDao>(),
        },
      ],
    }).compile();

    sut = module.get(EditEmailTemplate);
    emailTemplateDao = module.get(TOKENS.EmailTemplateDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0, { subject: 'Novo' })).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('should throw EmailTemplateAlreadyExistsError when name belongs to another row', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(createMock<EmailTemplateDto>({ id: 1 }));
    jest.spyOn(emailTemplateDao, 'findByName').mockResolvedValue(createMock<EmailTemplateDto>({ id: 2, name: 'Outro' }));

    await expect(sut.execute(1, { name: 'Outro' })).rejects.toThrow(EmailTemplateAlreadyExistsError);
  });

  it('should edit without uniqueness check when name is omitted', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(createMock<EmailTemplateDto>({ id: 1 }));

    const result = await sut.execute(1, { subject: 'Novo assunto' });

    expect(emailTemplateDao.findByName).not.toHaveBeenCalled();
    expect(emailTemplateDao.edit).toHaveBeenCalledWith(1, { subject: 'Novo assunto' });
    expect(result).toEqual<SuccessMessage>({ message: 'Edição realizada com sucesso' });
  });
});
