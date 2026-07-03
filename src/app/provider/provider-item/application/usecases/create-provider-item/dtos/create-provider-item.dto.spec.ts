import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateProviderItemInputDto } from './create-provider-item.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateProviderItemInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const text = Array.isArray(message) ? message.join(' ') : message;
  expect(text).toContain(substring);
}

function makeValidData(overrides: Partial<CreateProviderItemInputDto> = {}): CreateProviderItemInputDto {
  return {
    providerId: 1,
    description: 'Serviço de manutenção',
    totalValueInCents: 100000,
    installmentsCount: 3,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: '2026-07-10',
    bankId: 1,
    ...overrides,
  };
}

describe('CreateProviderItemInputDto - Unit tests', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should accept valid INTERVAL_DAYS payload', async() => {
    const data = makeValidData();

    const result = await pipe.transform(data, metadata);

    expect(result.scheduleType).toBe(ProviderItemScheduleType.INTERVAL_DAYS);
    expect(result.intervalDays).toBe(30);
  });

  it('should accept valid DUE_DAY payload', async() => {
    const data = makeValidData({
      scheduleType: ProviderItemScheduleType.DUE_DAY,
      intervalDays: null,
      dueDay: 10,
    });

    const result = await pipe.transform(data, metadata);

    expect(result.scheduleType).toBe(ProviderItemScheduleType.DUE_DAY);
    expect(result.dueDay).toBe(10);
  });

  it('should throw when intervalDays is missing for INTERVAL_DAYS', async() => {
    const data = makeValidData({ intervalDays: undefined });

    await expect(pipe.transform(data, metadata))
      .rejects
      .toMatchObject({
        response: {
          message: expect.any(Array),
        },
      })
      .catch((error) => {
        expectMessageToContain(error.getResponse().message, 'intervalDays');
        throw error;
      });
  });

  it('should throw when dueDay is missing for DUE_DAY', async() => {
    const data = makeValidData({
      scheduleType: ProviderItemScheduleType.DUE_DAY,
      intervalDays: null,
      dueDay: undefined,
    });

    await expect(pipe.transform(data, metadata))
      .rejects
      .toMatchObject({
        response: {
          message: expect.any(Array),
        },
      })
      .catch((error) => {
        expectMessageToContain(error.getResponse().message, 'dueDay');
        throw error;
      });
  });

  it('should throw when totalValueInCents is zero', async() => {
    const data = makeValidData({ totalValueInCents: 0 });

    expect.assertions(1);
    return pipe.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'totalValueInCents deve ser maior que zero');
    });
  });

  it('should throw when installmentsCount is zero', async() => {
    const data = makeValidData({ installmentsCount: 0 });

    expect.assertions(1);
    return pipe.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'installmentsCount deve ser maior que zero');
    });
  });

  it('should throw when dueDay exceeds 31', async() => {
    const data = makeValidData({
      scheduleType: ProviderItemScheduleType.DUE_DAY,
      intervalDays: null,
      dueDay: 32,
    });

    expect.assertions(1);
    return pipe.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dueDay deve ser entre 1 e 31');
    });
  });

  it('should trim description whitespace', async() => {
    const data = makeValidData({ description: '  Serviço  ' });

    const result = await pipe.transform(data, metadata);

    expect(result.description).toBe('Serviço');
  });
});
