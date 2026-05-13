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

  it('should accept optional positive integer id as hexadecimal string', async() => {
    const data = { ...validBase(), id: '19' };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.id).toBe('19');
  });

  it('should coerce multipart optional id as hex string', async() => {
    const data = { ...validBase(), id: '19' };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.id).toBe('19');
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

  it('should reject optional id with more than 8 hexadecimal digits', async() => {
    const data = { ...validBase(), id: '123456789' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid optional hex id (negative sign)', async() => {
    const data = { ...validBase(), id: '-1' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject non-hex id string', async() => {
    const data = { ...validBase(), id: '1.5' };

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

  it('should accept null optional socialName', async() => {
    const result = await pipe.transform({ ...validBase(), socialName: null }, bodyMetadata);

    expect(result.socialName).toBeNull();
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
      servedByRoot: false,
      manufacturerResale: true,
      indicatorResale: false,
      recurringResale: true,
    };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.receivesSupportEmail).toBe(true);
    expect(result.servedByRoot).toBe(false);
    expect(result.manufacturerResale).toBe(true);
    expect(result.indicatorResale).toBe(false);
    expect(result.recurringResale).toBe(true);
  });

  it('should accept extended optional fields with valid shapes', async() => {
    const data = {
      ...validBase(),
      nickname: 'Revenda Sul',
      socialName: ' Razão nome social ',
      validityDate: '2026-07-01T12:00:00.000Z',
      accessEmail: 'painel@example.com',
      accessPassword: 'segredo',
      paymentDay: 15,
      bonus: 200,
      billingStartDay: 10,
    };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.nickname).toBe('Revenda Sul');
    expect(result.socialName).toBe('Razão nome social');
    expect(result.validityDate).toBe('2026-07-01T12:00:00.000Z');
    expect(result.accessEmail).toBe('painel@example.com');
    expect(result.accessPassword).toBe('segredo');
    expect(result.paymentDay).toBe(15);
    expect(result.bonus).toBe(200);
    expect(result.billingStartDay).toBe(10);
  });

  it('should coerce paymentDay and bonus from multipart strings', async() => {
    const data = {
      ...validBase(),
      paymentDay: '8',
      bonus: '0',
      billingStartDay: '31',
    };

    const result = await pipe.transform(data, bodyMetadata);

    expect(result.paymentDay).toBe(8);
    expect(result.bonus).toBe(0);
    expect(result.billingStartDay).toBe(31);
  });

  it('should reject nickname longer than 255 characters', async() => {
    const data = { ...validBase(), nickname: 'x'.repeat(256) };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid validityDate when provided', async() => {
    const data = { ...validBase(), validityDate: 'not-a-date' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid accessEmail when provided', async() => {
    const data = { ...validBase(), accessEmail: 'sem-arroba' };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject accessPassword longer than 8192 characters', async() => {
    const data = { ...validBase(), accessPassword: 'p'.repeat(8193) };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });

  it.each([
    [0, 'billingStartDay below range'],
    [32, 'billingStartDay above range'],
  ])('should reject billingStartDay=%s (%s)', async(day) => {
    const data = { ...validBase(), billingStartDay: day };

    await expect(pipe.transform(data, bodyMetadata)).rejects.toBeDefined();
  });
});
