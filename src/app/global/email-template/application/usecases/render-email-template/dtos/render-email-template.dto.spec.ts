import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { RenderEmailTemplateInputDto } from './render-email-template.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: RenderEmailTemplateInputDto,
};

describe('RenderEmailTemplateInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it.each([
    undefined,
    null,
  ])('should reject missing variables (%s)', async(value: any) => {
    expect.assertions(1);
    return target.transform({ variables: value }, metadata).catch((error) => {
      expect(error.getResponse().message.join(' ')).toMatch(/variables/);
    });
  });

  it.each([
    'texto',
    123,
    true,
    [],
  ])('should reject non-object variables (%s)', async(value: any) => {
    expect.assertions(1);
    return target.transform({ variables: value }, metadata).catch((error) => {
      expect(error.getResponse().message.join(' ')).toMatch(/variables/);
    });
  });

  it('should reject non-string values in the map', async() => {
    expect.assertions(1);
    return target.transform({ variables: { 'nfse.numero': 123 } }, metadata).catch((error) => {
      expect(error.getResponse().message).toContain('variables deve ser um mapa de texto para texto');
    });
  });

  it('should accept empty variables map', async() => {
    const result = await target.transform({ variables: {} }, metadata);

    expect(result.variables).toEqual({});
  });

  it('should accept empty string as a value', async() => {
    const result = await target.transform({ variables: { 'nfse.numero': '' } }, metadata);

    expect(result.variables['nfse.numero']).toBe('');
  });
});
