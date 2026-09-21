import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ListIssuedNfseFromProviderQueryDto } from './list-issued-nfse-from-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: ListIssuedNfseFromProviderQueryDto,
};

function makeValidQuery(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    companyId: '10',
    startDate: '2026-09-03',
    endDate: '2026-09-03',
    ...overrides,
  };
}

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((item) => item.includes(substring))).toBe(true);
}

describe('ListIssuedNfseFromProviderQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid query and coerce companyId and page', async() => {
    // Act
    const result = await target.transform(makeValidQuery({ page: '2' }), metadata);

    // Assert
    expect(result).toEqual({
      companyId: 10,
      startDate: '2026-09-03',
      endDate: '2026-09-03',
      page: 2,
    });
  });

  it('should accept the query without page', async() => {
    // Act
    const result = await target.transform(makeValidQuery(), metadata);

    // Assert
    expect(result.page).toBeUndefined();
    expect(result.companyId).toBe(10);
  });

  it('should trim startDate and endDate', async() => {
    // Act
    const result = await target.transform(
      makeValidQuery({ startDate: '  2026-09-01  ', endDate: '  2026-09-30  ' }),
      metadata,
    );

    // Assert
    expect(result.startDate).toBe('2026-09-01');
    expect(result.endDate).toBe('2026-09-30');
  });

  it.each([undefined, null, '', 'abc', 0, -1])('should reject an invalid companyId (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ companyId: value }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'companyId');
    });
  });

  it.each(['03/09/2026', '2026-9-3', '', undefined, null])('should reject a malformed startDate (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ startDate: value }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'startDate');
    });
  });

  it('should reject a malformed endDate', async() => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ endDate: 'ontem' }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'endDate');
    });
  });

  it.each([0, -1, 'abc'])('should reject an invalid page (%s)', async(value: unknown) => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ page: value }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'page');
    });
  });
});
