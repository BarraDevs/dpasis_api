import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { EmailTemplateVariableAlreadyExistsError } from '../../../domain/errors/email-template-variable-already-exists.error';
import { EmailTemplateVariableDto } from '../../dtos/email-template-variable.dto';
import type { IEmailTemplateVariableDao } from '../../persistence/dao/email-template-variable-dao.interface';
import { CreateEmailTemplateVariable } from './create-email-template-variable.service';
import { CreateEmailTemplateVariableInputDto, CreateEmailTemplateVariableOutputDto } from './dtos/create-email-template-variable.dto';

function makeValidCreateEmailTemplateVariableInput(
  overrides: Partial<CreateEmailTemplateVariableInputDto> = {},
): CreateEmailTemplateVariableInputDto {
  return {
    key: 'nfse.numero',
    label: 'Número da NFS-e',
    ...overrides,
  };
}

describe('CreateEmailTemplateVariable - Unit tests', () => {
  let sut: CreateEmailTemplateVariable;
  let emailTemplateVariableDao: IEmailTemplateVariableDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateEmailTemplateVariable,
        {
          provide: TOKENS.EmailTemplateVariableDao,
          useValue: createMock<IEmailTemplateVariableDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateEmailTemplateVariable);
    emailTemplateVariableDao = module.get(TOKENS.EmailTemplateVariableDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateVariableAlreadyExistsError when key exists', async() => {
    const input = makeValidCreateEmailTemplateVariableInput();
    jest.spyOn(emailTemplateVariableDao, 'findByKey').mockResolvedValue(createMock<EmailTemplateVariableDto>({ id: 1, key: input.key }));

    await expect(sut.execute(input)).rejects.toThrow(EmailTemplateVariableAlreadyExistsError);
    await expect(sut.execute(input)).rejects.toThrow('Já existe uma variável de template de e-mail com a chave: nfse.numero');
  });

  it('should call save and return id', async() => {
    const input = makeValidCreateEmailTemplateVariableInput();
    jest.spyOn(emailTemplateVariableDao, 'findByKey').mockResolvedValue(null);
    jest.spyOn(emailTemplateVariableDao, 'save').mockResolvedValue(9);

    const result = await sut.execute(input);

    expect(emailTemplateVariableDao.save).toHaveBeenCalledWith({ ...input, key: 'nfse.numero' });
    expect(result).toEqual<CreateEmailTemplateVariableOutputDto>({ id: 9 });
  });
});
