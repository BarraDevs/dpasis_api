import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { SigninWithCredentialAndPasswordInputDto } from './signin-with-credential-and-password.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: SigninWithCredentialAndPasswordInputDto,
};

describe('SigninWithCredentialAndPasswordInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'credential',
      'password',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    const data = {
      credential: 'credential',
      password: 'password',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(SigninWithCredentialAndPasswordInputDto);
    expect(result).toEqual(data);
  });
});
