import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateAlreadyExistsError } from '../../../domain/errors/email-template-already-exists.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import type { IEmailTemplateDao } from '../../persistence/dao/email-template-dao.interface';
import { CreateEmailTemplate } from './create-email-template.service';
import { CreateEmailTemplateInputDto, CreateEmailTemplateOutputDto } from './dtos/create-email-template.dto';

function makeValidCreateEmailTemplateInput(overrides: Partial<CreateEmailTemplateInputDto> = {}): CreateEmailTemplateInputDto {
  return {
    name: 'Cobranca NFS-e',
    subject: 'Sua NFS-e {{nfse.numero}}',
    html: '<p>{{cliente.nome}}</p>',
    css: '',
    ...overrides,
  };
}

describe('CreateEmailTemplate - Unit tests', () => {
  let sut: CreateEmailTemplate;
  let emailTemplateDao: IEmailTemplateDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateEmailTemplate,
        {
          provide: TOKENS.EmailTemplateDao,
          useValue: createMock<IEmailTemplateDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateEmailTemplate);
    emailTemplateDao = module.get(TOKENS.EmailTemplateDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateAlreadyExistsError when name exists', async() => {
    const input = makeValidCreateEmailTemplateInput();
    jest.spyOn(emailTemplateDao, 'findByName').mockResolvedValue(createMock<EmailTemplateDto>({ id: 1, name: input.name }));

    await expect(sut.execute(input)).rejects.toThrow(EmailTemplateAlreadyExistsError);
  });

  it('should call save and return id', async() => {
    const input = makeValidCreateEmailTemplateInput();
    jest.spyOn(emailTemplateDao, 'findByName').mockResolvedValue(null);
    jest.spyOn(emailTemplateDao, 'save').mockResolvedValue(4);

    const result = await sut.execute(input);

    expect(emailTemplateDao.save).toHaveBeenCalledWith({ ...input, name: 'Cobranca NFS-e' });
    expect(result).toEqual<CreateEmailTemplateOutputDto>({ id: 4 });
  });
});
