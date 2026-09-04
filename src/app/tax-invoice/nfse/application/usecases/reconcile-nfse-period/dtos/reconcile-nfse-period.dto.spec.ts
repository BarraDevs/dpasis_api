import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ReconcileNfsePeriodInputDto } from './reconcile-nfse-period.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: ReconcileNfsePeriodInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

describe('ReconcileNfsePeriodInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid period', async() => {
    const result = await target.transform({ startDate: '2026-09-03', endDate: '2026-09-03' }, metadata);

    expect(result).toMatchObject({ startDate: '2026-09-03', endDate: '2026-09-03' });
  });

  it('should accept an explicit dryRun', async() => {
    const result = await target.transform({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false }, metadata);

    expect(result.dryRun).toBe(false);
  });

  it.each(['03/09/2026', '2026-9-3', '', undefined, null])('should reject a malformed startDate (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform({ startDate: value, endDate: '2026-09-03' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'startDate');
    });
  });

  it('should reject a malformed endDate', async() => {
    expect.assertions(1);
    return target.transform({ startDate: '2026-09-03', endDate: 'ontem' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'endDate');
    });
  });

  it('should reject a non-boolean dryRun', async() => {
    expect.assertions(1);
    return target.transform({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: 'sim' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dryRun');
    });
  });
});
