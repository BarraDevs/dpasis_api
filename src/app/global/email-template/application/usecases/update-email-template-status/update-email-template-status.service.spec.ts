import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { UpdateEmailTemplateStatus } from './update-email-template-status.service';

describe('UpdateEmailTemplateStatus - Unit tests', () => {
  let sut: UpdateEmailTemplateStatus;
  let emailTemplateDao: IEmailTemplateDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateEmailTemplateStatus,
        {
          provide: TOKENS.EmailTemplateDao,
          useValue: createMock<IEmailTemplateDao>(),
        },
      ],
    }).compile();

    sut = module.get(UpdateEmailTemplateStatus);
    emailTemplateDao = module.get(TOKENS.EmailTemplateDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('should invert active from true to false', async() => {
    jest.spyOn(emailTemplateDao, 'findById').mockResolvedValue(createMock<EmailTemplateDto>({ id: 1, active: true }));

    await sut.execute(1);

    expect(emailTemplateDao.updateStatus).toHaveBeenCalledWith(1, false);
  });
});
