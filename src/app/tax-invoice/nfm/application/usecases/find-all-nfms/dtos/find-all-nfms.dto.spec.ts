import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { NfProcessCode } from 'src/infra/nf-generation/enums/nf-process-code.enum';
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

  it('should pass with empty query', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(FindAllNfmsQueryDto);
  });

  it('should pass with all valid fields', async() => {
    const data = {
      page: 1,
      limit: 10,
      orderNumber: 'PED-123',
      nfeNumber: 100,
      recipientDocument: '98765432000111',
      processCode: NfProcessCode.AUTHORIZED,
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllNfmsQueryDto);
    expect(result).toEqual(data);
  });

  it('should transform string numbers to number', async() => {
    const data = {
      page: '2',
      limit: '15',
      nfeNumber: '200',
      processCode: String(NfProcessCode.REJECTED),
    };

    const result = await target.transform(data, metadata);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
    expect(result.nfeNumber).toBe(200);
    expect(result.processCode).toBe(NfProcessCode.REJECTED);
  });

  it('should throw if page is not positive', async() => {
    expect.assertions(1);

    return target.transform({ page: 0 }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'page deve ser um número positivo');
    });
  });

  it('should throw if processCode is invalid', async() => {
    expect.assertions(1);

    return target.transform({ processCode: 999 }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'processCode deve ser um código de situação válido');
    });
  });
});
