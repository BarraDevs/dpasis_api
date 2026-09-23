import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { NfseClassificationKind } from '../../../../domain/enums/nfse-classification-kind.enum';
import { ClassifyNfseInputDto } from './classify-nfse.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: ClassifyNfseInputDto,
};

function makeItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    kind: NfseClassificationKind.NFM,
    ...overrides,
  };
}

function makeValidInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    companyId: 1,
    items: [makeItem()],
    ...overrides,
  };
}

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((item) => item.includes(substring))).toBe(true);
}

describe('ClassifyNfseInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid payload', async() => {
    const result = await target.transform(makeValidInput(), metadata);

    expect(result).toEqual({
      companyId: 1,
      items: [{ rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM }],
    });
  });

  it('should trim rpsSeries', async() => {
    const result = await target.transform(
      makeValidInput({ items: [makeItem({ rpsSeries: '  nfse  ' })] }),
      metadata,
    );

    expect(result.items[0].rpsSeries).toBe('nfse');
  });

  it.each([undefined, null, 0, -1])('should reject an invalid companyId (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidInput({ companyId: value }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'companyId');
    });
  });

  it.each([undefined, null, []])('should reject empty items (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidInput({ items: value }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'items');
    });
  });

  it('should reject more than 200 items', async() => {
    expect.assertions(1);
    const items = Array.from({ length: 201 }, (_, index) => makeItem({ rpsNumber: index + 1 }));
    return target.transform(makeValidInput({ items }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'items');
    });
  });

  it.each([undefined, null, 0, -1])('should reject an invalid rpsNumber (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidInput({ items: [makeItem({ rpsNumber: value })] }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'rpsNumber');
    });
  });

  it.each([undefined, null, '', 'TOOLONG'])('should reject an invalid rpsSeries (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidInput({ items: [makeItem({ rpsSeries: value })] }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'rpsSeries');
    });
  });

  it.each([undefined, null, 'nfm', 'OTHER'])('should reject an invalid kind (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidInput({ items: [makeItem({ kind: value })] }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'kind');
    });
  });
});
