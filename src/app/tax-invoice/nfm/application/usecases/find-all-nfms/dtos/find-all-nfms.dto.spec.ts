import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllNfmsQueryDto } from './find-all-nfms.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllNfmsQueryDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('FindAllNfmsQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should throw without companyId', async() => {
    expect.assertions(1);

    return target.transform({}, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'companyId');
    });
  });

  it('should pass with companyId and period', async() => {
    const data = {
      companyId: 1,
      page: 1,
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      recipientDocument: '98765432000111',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllNfmsQueryDto);
    expect(result).toEqual(data);
  });

  it('should pass with companyId and nfseNumber', async() => {
    const data = {
      companyId: 1,
      nfseNumber: '1000',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllNfmsQueryDto);
    expect(result.nfseNumber).toBe('1000');
  });

  it('should transform string companyId and page to number', async() => {
    const data = {
      companyId: '2',
      page: '3',
      nfseNumber: '10',
    };

    const result = await target.transform(data, metadata);

    expect(result.companyId).toBe(2);
    expect(result.page).toBe(3);
  });

  it('should throw if page is not positive', async() => {
    expect.assertions(1);

    return target.transform({ companyId: 1, page: 0, nfseNumber: '1' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'page deve ser um número positivo');
    });
  });

  it('should throw if dateFrom has invalid format', async() => {
    expect.assertions(1);

    return target.transform({
      companyId: 1,
      dateFrom: '01/08/2026',
      dateTo: '2026-08-31',
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dateFrom deve estar no formato YYYY-MM-DD');
    });
  });

  it('should throw if dateTo has invalid format', async() => {
    expect.assertions(1);

    return target.transform({
      companyId: 1,
      dateFrom: '2026-08-01',
      dateTo: '31/08/2026',
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'dateTo deve estar no formato YYYY-MM-DD');
    });
  });

  it.each([0, -1])('should throw if companyId is not positive (%s)', async(companyId) => {
    expect.assertions(1);

    return target.transform({ companyId, nfseNumber: '1' }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'companyId deve ser um número positivo');
    });
  });

  it('should trim whitespace on string query fields', async() => {
    // Arrange
    const data = {
      companyId: 1,
      dateFrom: '  2026-08-01  ',
      dateTo: '  2026-08-31  ',
      nfseNumber: undefined,
      recipientDocument: '  98765432000111  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result.dateFrom).toBe('2026-08-01');
    expect(result.dateTo).toBe('2026-08-31');
    expect(result.recipientDocument).toBe('98765432000111');
  });

  it('should trim nfseNumber', async() => {
    // Arrange & Act
    const result = await target.transform({ companyId: 1, nfseNumber: '  1000  ' }, metadata);

    // Assert
    expect(result.nfseNumber).toBe('1000');
  });
});
