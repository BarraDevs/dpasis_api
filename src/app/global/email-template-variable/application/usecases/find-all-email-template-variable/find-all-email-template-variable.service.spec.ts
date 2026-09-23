import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { FindAllEmailTemplateVariableQueryDto } from './dtos/find-all-email-template-variable.dto';
import { FindAllEmailTemplateVariable } from './find-all-email-template-variable.service';

describe('FindAllEmailTemplateVariable - Unit tests', () => {
  let sut: FindAllEmailTemplateVariable;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllEmailTemplateVariable,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllEmailTemplateVariable);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return paginated result', async() => {
    const query: FindAllEmailTemplateVariableQueryDto = { page: 1, size: 10 };
    const mockVariable = createMock<EmailTemplateVariableDto>();
    jest.spyOn(emailTemplateVariableDao, 'findAll').mockResolvedValue([[mockVariable], 1]);

    const result = await sut.execute(query);

    expect(emailTemplateVariableDao.findAll).toHaveBeenCalledWith(query);
    expect(result.data).toEqual([mockVariable]);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it('should handle empty result', async() => {
    jest.spyOn(emailTemplateVariableDao, 'findAll').mockResolvedValue([[], 0]);

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
