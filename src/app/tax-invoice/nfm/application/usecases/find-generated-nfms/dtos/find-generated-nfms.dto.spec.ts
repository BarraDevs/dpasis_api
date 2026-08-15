import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindGeneratedNfmsQueryDto } from './find-generated-nfms.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindGeneratedNfmsQueryDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('FindGeneratedNfmsQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty query', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(FindGeneratedNfmsQueryDto);
  });

  it('should pass with dateStart and dateEnd', async() => {
    const data = {
      dateStart: '2026-08-01',
      dateEnd: '2026-08-31',
      page: 1,
      size: 10,
    };

    const result = await target.transform(data, metadata);

    expect(result).toEqual(data);
  });

  it('should pass with only dateStart', async() => {
    const result = await target.transform({ dateStart: '2026-08-01' }, metadata);

    expect(result.dateStart).toBe('2026-08-01');
    expect(result.dateEnd).toBeUndefined();
  });

  it('should pass with only dateEnd', async() => {
    const result = await target.transform({ dateEnd: '2026-08-31' }, metadata);

    expect(result.dateEnd).toBe('2026-08-31');
    expect(result.dateStart).toBeUndefined();
  });

  it('should transform string page and size to number', async() => {
    const result = await target.transform({ page: '2', size: '20' }, metadata);

    expect(result.page).toBe(2);
    expect(result.size).toBe(20);
  });

  it('should throw if page is not positive', async() => {
    expect.assertions(1);

    return target.transform({ page: 0 }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'page deve ser um número positivo');
    });
  });

  it('should throw if dateStart has invalid format', async() => {
    expect.assertions(1);

    return target.transform({ dateStart: '01/08/2026' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dateStart deve estar no formato YYYY-MM-DD');
    });
  });

  it('should throw if dateEnd has invalid format', async() => {
    expect.assertions(1);

    return target.transform({ dateEnd: '31/08/2026' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dateEnd deve estar no formato YYYY-MM-DD');
    });
  });

  it('should trim whitespace on date fields', async() => {
    const result = await target.transform({
      dateStart: '  2026-08-01  ',
      dateEnd: '  2026-08-31  ',
    }, metadata);

    expect(result.dateStart).toBe('2026-08-01');
    expect(result.dateEnd).toBe('2026-08-31');
  });
});
