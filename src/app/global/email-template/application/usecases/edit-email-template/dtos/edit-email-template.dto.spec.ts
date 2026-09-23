import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditEmailTemplateInputDto } from './edit-email-template.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditEmailTemplateInputDto,
};

describe('EditEmailTemplateInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditEmailTemplateInputDto);
  });

  it('should accept only subject', async() => {
    const result = await target.transform({ subject: 'Novo assunto' }, metadata);

    expect(result.subject).toBe('Novo assunto');
    expect(result.html).toBeUndefined();
  });

  it('should reject empty html when provided', async() => {
    expect.assertions(1);
    return target.transform({ html: '  ' }, metadata).catch((error) => {
      expect(error.getResponse().message).toContain('html é obrigatório');
    });
  });
});
