import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindActiveEmailTemplateVariablesByKeys } from 'src/app/global/email-template-variable/application/usecases/find-active-email-template-variables-by-keys/find-active-email-template-variables-by-keys.service';
import { EmailTemplateVariableDto } from 'src/app/global/email-template-variable/application/dtos/email-template-variable.dto';
import { EmailTemplateVariableMissingValueError } from '../../../domain/errors/email-template-variable-missing-value.error';
import { EmailTemplateVariableUnknownError } from '../../../domain/errors/email-template-variable-unknown.error';
import { EmailTemplateDto } from '../../dtos/email-template.dto';
import { FindEmailTemplateById } from '../find-email-template-by-id/find-email-template-by-id.service';
import { RenderEmailTemplate } from './render-email-template.service';

describe('RenderEmailTemplate - Unit tests', () => {
  let sut: RenderEmailTemplate;
  let findEmailTemplateById: FindEmailTemplateById;
  let findActiveEmailTemplateVariablesByKeys: FindActiveEmailTemplateVariablesByKeys;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        RenderEmailTemplate,
        { provide: FindEmailTemplateById, useValue: createMock<FindEmailTemplateById>() },
        { provide: FindActiveEmailTemplateVariablesByKeys, useValue: createMock<FindActiveEmailTemplateVariablesByKeys>() },
      ],
    }).compile();

    sut = module.get(RenderEmailTemplate);
    findEmailTemplateById = module.get(FindEmailTemplateById);
    findActiveEmailTemplateVariablesByKeys = module.get(FindActiveEmailTemplateVariablesByKeys);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw EmailTemplateVariableUnknownError when placeholder is not active in catalog', async() => {
    jest.spyOn(findEmailTemplateById, 'execute').mockResolvedValue(createMock<EmailTemplateDto>({
      subject: 'Nota {{nfse.numero}}',
      html: '<p>oi</p>',
    }));
    jest.spyOn(findActiveEmailTemplateVariablesByKeys, 'execute').mockResolvedValue([]);

    await expect(sut.execute(1, { variables: { 'nfse.numero': '123' } })).rejects.toThrow(EmailTemplateVariableUnknownError);
  });

  it('should throw EmailTemplateVariableMissingValueError when value is absent', async() => {
    jest.spyOn(findEmailTemplateById, 'execute').mockResolvedValue(createMock<EmailTemplateDto>({
      subject: 'Nota {{nfse.numero}}',
      html: '<p>oi</p>',
    }));
    jest.spyOn(findActiveEmailTemplateVariablesByKeys, 'execute').mockResolvedValue([
      createMock<EmailTemplateVariableDto>({ key: 'nfse.numero', active: true }),
    ]);

    await expect(sut.execute(1, { variables: {} })).rejects.toThrow(EmailTemplateVariableMissingValueError);
  });

  it('should interpolate subject and html', async() => {
    jest.spyOn(findEmailTemplateById, 'execute').mockResolvedValue(createMock<EmailTemplateDto>({
      subject: 'Nota {{nfse.numero}}',
      html: '<style>p { color: red; }</style><p>{{cliente.nome}}</p>',
    }));
    jest.spyOn(findActiveEmailTemplateVariablesByKeys, 'execute').mockResolvedValue([
      createMock<EmailTemplateVariableDto>({ key: 'nfse.numero', active: true }),
      createMock<EmailTemplateVariableDto>({ key: 'cliente.nome', active: true }),
    ]);

    const result = await sut.execute(1, {
      variables: { 'nfse.numero': '123', 'cliente.nome': 'ACME', extra: 'ignored' },
    });

    expect(result).toEqual({
      subject: 'Nota 123',
      html: '<style>p { color: red; }</style><p>ACME</p>',
    });
  });

  it('should accept empty string as a provided value', async() => {
    jest.spyOn(findEmailTemplateById, 'execute').mockResolvedValue(createMock<EmailTemplateDto>({
      subject: '{{nfse.numero}}',
      html: '<p></p>',
    }));
    jest.spyOn(findActiveEmailTemplateVariablesByKeys, 'execute').mockResolvedValue([
      createMock<EmailTemplateVariableDto>({ key: 'nfse.numero', active: true }),
    ]);

    const result = await sut.execute(1, { variables: { 'nfse.numero': '' } });

    expect(result.subject).toBe('');
    expect(result.html).toBe('<p></p>');
  });
});
