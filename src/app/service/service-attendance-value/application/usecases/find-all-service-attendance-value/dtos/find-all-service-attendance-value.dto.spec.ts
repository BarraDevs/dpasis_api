import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllServiceAttendanceValueQueryDto } from './find-all-service-attendance-value.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllServiceAttendanceValueQueryDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidQuery(
  overrides: Partial<FindAllServiceAttendanceValueQueryDto> = {},
): FindAllServiceAttendanceValueQueryDto {
  return {
    page: 1,
    size: 10,
    serviceId: 1,
    ...overrides,
  };
}

describe('FindAllServiceAttendanceValueQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should throw if serviceId is missing', async() => {
    const data = { page: 1, size: 10 };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'serviceId é obrigatório');
    });
  });

  it('should accept valid serviceId', async() => {
    const data = makeValidQuery({ serviceId: 42 });

    const result = await target.transform(data, metadata);

    expect(result.serviceId).toBe(42);
  });

  it('should throw if serviceId is zero', async() => {
    const data = makeValidQuery({ serviceId: 0 });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'serviceId deve ser um número positivo');
    });
  });
});
