import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateResaleInputDto } from './create-resale.dto';

const bodyMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateResaleInputDto,
};

describe('CreateResaleInputDto', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe(pipeOptions);
  });

  function validBase() {
    return {
      code: 'REV-001',
      name: 'Revenda',
      identifier: null,
      zipCode: '01310-100',
      street: 'Rua A',
      neighborhood: 'Bairro',
      city: 'Cidade',
      state: 'SP',
      licenseType: 'A1',
      document: '09748165000110',
      ie: null,
      phone01: '11999999999',
      phone02: null,
      voucher: null,
      email: null,
      website: null,
    };
  }

  it('should accept a complete valid payload', async() => {
    const result = await pipe.transform(validBase(), bodyMetadata);

    expect(result).toBeInstanceOf(CreateResaleInputDto);
    expect(result.name).toBe('Revenda');
    expect(result.code).toBe('REV-001');
  });

  it('should trim string fields', async() => {
    const data = {
      ...validBase(),
      name: '  Revenda  ',
      code: '  C-1  ',
    };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.name).toBe('Revenda');
    expect(result.code).toBe('C-1');
  });

  it('should accept optional positive integer id', async() => {
    const data = { ...validBase(), id: 25 };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.id).toBe(25);
  });

  it('should coerce string id from multipart/form-data', async() => {
    const data = { ...validBase(), id: '25' };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.id).toBe(25);
  });

  it('should reject when code is missing', async() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { code: _c, ...rest } = validBase();

    await expect(pipe.transform(rest, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject when code is empty after trim', async() => {
    const data = { ...validBase(), code: '   ' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject when name is empty', async() => {
    const data = { ...validBase(), name: '' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid optional id (zero)', async() => {
    const data = { ...validBase(), id: 0 };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid optional id (negative)', async() => {
    const data = { ...validBase(), id: -3 };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject non-integer id', async() => {
    const data = { ...validBase(), id: 1.5 };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid email when provided', async() => {
    const data = { ...validBase(), email: 'not-an-email' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should accept valid email', async() => {
    const data = { ...validBase(), email: 'user@example.com' };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.email).toBe('user@example.com');
  });

  it('should skip email format check when email is null', async() => {
    const data = { ...validBase(), email: null };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.email).toBeNull();
  });

  it('should skip email format check when email is empty string', async() => {
    const data = { ...validBase(), email: '' };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.email).toBe('');
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('should coerce receivesSupportEmail from string %s', async(raw, expected) => {
    const data = { ...validBase(), receivesSupportEmail: raw };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.receivesSupportEmail).toBe(expected);
  });

  it('should accept boolean flags as booleans', async() => {
    const data = {
      ...validBase(),
      receivesSupportEmail: true,
      servedByDpa: false,
      manufacturerReseller: true,
    };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.receivesSupportEmail).toBe(true);
    expect(result.servedByDpa).toBe(false);
    expect(result.manufacturerReseller).toBe(true);
  });
});
