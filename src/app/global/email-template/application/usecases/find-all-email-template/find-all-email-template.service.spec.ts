import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { FindAllEmailTemplate } from './find-all-email-template.service';

describe('FindAllEmailTemplate - Unit tests', () => {
  let sut: FindAllEmailTemplate;
  let emailTemplateDao: IEmailTemplateDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllEmailTemplate,
        {
          provide: TOKENS.EmailTemplateDao,
          useValue: createMock<IEmailTemplateDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllEmailTemplate);
    emailTemplateDao = module.get(TOKENS.EmailTemplateDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return paginated result', async() => {
    const mockTemplate = createMock<EmailTemplateDto>();
    jest.spyOn(emailTemplateDao, 'findAll').mockResolvedValue([[mockTemplate], 1]);

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toEqual([mockTemplate]);
    expect(result.totalItems).toBe(1);
  });
});
