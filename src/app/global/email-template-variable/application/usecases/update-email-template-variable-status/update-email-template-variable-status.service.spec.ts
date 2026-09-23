import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { UpdateEmailTemplateVariableStatus } from './update-email-template-variable-status.service';

describe('UpdateEmailTemplateVariableStatus - Unit tests', () => {
  let sut: UpdateEmailTemplateVariableStatus;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateEmailTemplateVariableStatus,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(UpdateEmailTemplateVariableStatus);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateVariableNotFoundError when record does not exist', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateVariableNotFoundError);
  });

  it('should invert active from true to false', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findById').mockResolvedValue(createMock<EmailTemplateVariableDto>({ id: 1, active: true }));

    await sut.execute(1);

    expect(emailTemplateVariableDao.updateStatus).toHaveBeenCalledWith(1, false);
  });
});
