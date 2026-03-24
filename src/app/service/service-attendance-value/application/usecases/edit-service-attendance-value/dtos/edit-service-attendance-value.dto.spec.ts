import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditServiceAttendanceValueInputDto } from './edit-service-attendance-value.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditServiceAttendanceValueInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidData(overrides?: Partial<EditServiceAttendanceValueInputDto>): EditServiceAttendanceValueInputDto {
  return {
    values: { maoDeObra: 12000, deslocamento: 5000 },
    ...overrides,
  };
}

describe('EditServiceAttendanceValueInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept valid body', async() => {
    const data = makeValidData();

    const result = await target.transform(data, metadata);

    expect(result.values).toEqual({ maoDeObra: 12000, deslocamento: 5000 });
  });

  it('should throw if values is missing', async() => {
    const data = { values: undefined };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'values é obrigatório');
    });
  });

  it('should throw if values is not an object (string)', async() => {
    const data = { values: 'not-an-object' };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'values deve ser um objeto');
    });
  });

  it('should throw if values is an array', async() => {
    const data = { values: [1, 2] };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'values deve ser um objeto');
    });
  });

  it('should throw if values is null', async() => {
    const data = { values: null };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'values deve ser um objeto');
    });
  });

  it('should accept empty object as values (shape only; business rules apply in domain)', async() => {
    const data = { values: {} };

    const result = await target.transform(data, metadata);

    expect(result.values).toEqual({});
  });
});
