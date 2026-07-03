import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditProviderItemInputDto } from './edit-provider-item.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditProviderItemInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const text = Array.isArray(message) ? message.join(' ') : message;
  expect(text).toContain(substring);
}

describe('EditProviderItemInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept partial body with only description', async() => {
    const result = await target.transform({ description: 'Nova descrição' }, metadata);

    expect(result.description).toBe('Nova descrição');
  });

  it('should strip providerId from body via whitelist', async() => {
    const result = await target.transform(
      { description: 'Teste', providerId: 99 },
      metadata,
    );

    expect(result.description).toBe('Teste');
    expect((result as EditProviderItemInputDto & { providerId?: number }).providerId).toBeUndefined();
  });

  it('should throw when totalValueInCents is zero on partial update', async() => {
    const data = { totalValueInCents: 0 };

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'totalValueInCents deve ser maior que zero');
    });
  });

  it('should accept valid DUE_DAY partial update', async() => {
    const result = await target.transform(
      {
        scheduleType: ProviderItemScheduleType.DUE_DAY,
        intervalDays: null,
        dueDay: 15,
      },
      metadata,
    );

    expect(result.scheduleType).toBe(ProviderItemScheduleType.DUE_DAY);
    expect(result.dueDay).toBe(15);
  });
});
