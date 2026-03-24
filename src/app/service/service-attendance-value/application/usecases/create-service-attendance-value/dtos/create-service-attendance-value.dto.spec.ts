import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateServiceAttendanceValueInputDto } from './create-service-attendance-value.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateServiceAttendanceValueInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidData(overrides?: Partial<CreateServiceAttendanceValueInputDto>): CreateServiceAttendanceValueInputDto {
  return {
    serviceId: 1,
    values: { campo: 100 },
    ...overrides,
  };
}

describe('CreateServiceAttendanceValueInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept valid body', async() => {
    const data = makeValidData();

    const result = await target.transform(data, metadata);

    expect(result.serviceId).toBe(1);
    expect(result.values).toEqual({ campo: 100 });
  });

  it('should throw if serviceId is missing', async() => {
    const data = { ...makeValidData(), serviceId: undefined };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'serviceId é obrigatório');
    });
  });

  it('should throw if values is missing', async() => {
    const data = { serviceId: 1, values: undefined };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'values é obrigatório');
    });
  });
});
