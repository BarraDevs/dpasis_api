import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditResaleInputDto } from './edit-resale.dto';

const bodyMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditResaleInputDto,
};

describe('EditResaleInputDto', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe(pipeOptions);
  });

  it('should accept an empty partial payload', async() => {
    const result = await pipe.transform({}, bodyMetadata);

    expect(result).toBeInstanceOf(EditResaleInputDto);
  });

  it('should accept a single field patch', async() => {
    const result = await pipe.transform({ name: 'Só nome' }, bodyMetadata);

    expect(result.name).toBe('Só nome');
  });

  it('should trim patched strings', async() => {
    const result = await pipe.transform({ name: '  Com espaços  ' }, bodyMetadata);

    expect(result.name).toBe('Com espaços');
  });

  it('should reject invalid email when provided', async() => {
    await expect(
      pipe.transform({ email: 'invalid' }, bodyMetadata),
    ).rejects.toBeDefined();
  });

  it('should accept valid email patch', async() => {
    const result = await pipe.transform({ email: 'ok@example.com' }, bodyMetadata);

    expect(result.email).toBe('ok@example.com');
  });

  it('should accept explicit null for optional fields', async() => {
    const result = await pipe.transform(
      { identifier: null, phone02: null },
      bodyMetadata,
    );

    expect(result.identifier).toBeNull();
    expect(result.phone02).toBeNull();
  });

  it('should coerce boolean strings for flags', async() => {
    const result = await pipe.transform(
      { receivesSupportEmail: 'true', servedByRoot: 'false' },
      bodyMetadata,
    );

    expect(result.receivesSupportEmail).toBe(true);
    expect(result.servedByRoot).toBe(false);
  });

  it('should accept patch for extended resale fields', async() => {
    const result = await pipe.transform(
      {
        nickname: ' Novo apelido ',
        validityDate: '2026-12-01T00:00:00.000Z',
        accessEmail: 'novo@revenda.com',
        paymentDay: '3',
        billingStartDay: '15',
        indicatorResale: 'true',
        recurringResale: 'false',
      },
      bodyMetadata,
    );

    expect(result.nickname).toBe('Novo apelido');
    expect(result.validityDate).toBe('2026-12-01T00:00:00.000Z');
    expect(result.accessEmail).toBe('novo@revenda.com');
    expect(result.paymentDay).toBe(3);
    expect(result.billingStartDay).toBe(15);
    expect(result.indicatorResale).toBe(true);
    expect(result.recurringResale).toBe(false);
  });

  it('should reject invalid billingStartDay on patch', async() => {
    await expect(
      pipe.transform({ billingStartDay: 0 }, bodyMetadata),
    ).rejects.toBeDefined();
  });
});
