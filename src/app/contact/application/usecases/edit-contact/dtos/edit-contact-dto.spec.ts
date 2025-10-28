import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditContactInputDto } from './edit-contact.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditContactInputDto,
};

describe('EditContactInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'department',
      'email',
      'phone',
      'whatsapp',
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
    )('should throw an error if %s is not a string (%s)', async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length`, async() => {
      const data = { [field]: 'a'.repeat(257) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo 256 caracteres`);
      });
    });
  });

  describe.each(
    [
      'info',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(`${field} é obrigatório`);
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
    )('should throw an error if %s is not a string (%s)', async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    const data = {
      name: 'name',
      department: 'department',
      email: 'email',
      phone: 'phone',
      whatsapp: 'whatsapp',
      info: 'info',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditContactInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if optional field info is not provided', async() => {
    const data = {
      name: 'name',
      department: 'department',
      email: 'email',
      phone: 'phone',
      whatsapp: 'whatsapp',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditContactInputDto);
    expect(result).toEqual({ ...data, info: undefined });
  });
});
