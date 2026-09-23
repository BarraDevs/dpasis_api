import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditEmailTemplateVariableInputDto } from './edit-email-template-variable.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditEmailTemplateVariableInputDto,
};

describe('EditEmailTemplateVariableInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditEmailTemplateVariableInputDto);
  });

  it('should accept only label', async() => {
    const result = await target.transform({ label: 'Novo rótulo' }, metadata);

    expect(result.label).toBe('Novo rótulo');
    expect(result.key).toBeUndefined();
  });

  it('should reject invalid key charset', async() => {
    expect.assertions(1);
    return target.transform({ key: '1invalida' }, metadata).catch((error) => {
      expect(error.getResponse().message.join(' ')).toContain('key deve começar com letra');
    });
  });
});
