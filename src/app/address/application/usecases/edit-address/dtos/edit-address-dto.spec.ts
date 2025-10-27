import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditAddressInputDto } from './edit-address.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditAddressInputDto,
};

describe('EditAddressInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'zipCode',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
      'ownerId',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditAddressInputDto);
      expect(result).toEqual(data);
    });

    it.each(
      [
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is an empty string (%s)`, async(value: string) => {
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

  describe.each(
    [
      'nickname',
      'complement',
      'reference',
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

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditAddressInputDto);
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
    const data: EditAddressInputDto = {
      nickname: 'Casa',
      zipCode: '12345678',
      street: 'Rua A',
      number: '100',
      complement: 'Apto 101',
      reference: 'Próximo ao mercado',
      neighborhood: 'Bairro B',
      city: 'Cidade C',
      state: 'Estado D',
      ownerId: 'owner-123',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditAddressInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all required fields are valid and optional fields are missing', async() => {
    const data: EditAddressInputDto = {
      zipCode: '12345678',
      street: 'Rua A',
      number: '100',
      neighborhood: 'Bairro B',
      city: 'Cidade C',
      state: 'Estado D',
      ownerId: 'owner-123',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditAddressInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if no fields are provided', async() => {
    const data: EditAddressInputDto = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditAddressInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if some fields are provided', async() => {
    const data: EditAddressInputDto = {
      street: 'Rua A',
      city: 'Cidade C',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditAddressInputDto);
    expect(result).toEqual(data);
  });
});
