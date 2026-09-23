import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { FindEmailTemplateById } from './find-email-template-by-id.service';

describe('FindEmailTemplateById - Unit tests', () => {
  let sut: FindEmailTemplateById;
  let emailTemplateDao: IEmailTemplateDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindEmailTemplateById,
        {
          provide: TOKENS.EmailTemplateDao,
          useValue: createMock<IEmailTemplateDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindEmailTemplateById);
    emailTemplateDao = module.get(TOKENS.EmailTemplateDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Template de e-mail não encontrado na base de dados.');
  });

  it('should return the template when found', async() => {
    const mockTemplate = createMock<EmailTemplateDto>({ id: 1, name: 'Cobranca' });
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(mockTemplate);

    const result = await sut.execute(1);

    expect(result).toEqual(mockTemplate);
  });
});
