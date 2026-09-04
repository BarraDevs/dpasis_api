import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ReconcileNfmInputDto } from './reconcile-nfm.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: ReconcileNfmInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

describe('ReconcileNfmInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid reason', async() => {
    const result = await target.transform({ reason: 'nota parada desde o incidente de 03/09' }, metadata);

    expect(result.reason).toBe('nota parada desde o incidente de 03/09');
  });

  it.each([undefined, null, '', 'ok'])('should reject a reason that explains nothing (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform({ reason: value }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'reason');
    });
  });
});
