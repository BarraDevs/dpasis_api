import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { UploadBankCertificateInputDto } from './upload-bank-certificate.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: UploadBankCertificateInputDto,
};

describe('UploadBankCertificateInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept an empty body', async() => {
    const result = await target.transform({}, metadata);
    expect(result.pfxPassword).toBeUndefined();
  });

  it('should trim pfxPassword', async() => {
    const result = await target.transform({ pfxPassword: '  secret  ' }, metadata);
    expect(result.pfxPassword).toBe('secret');
  });

  it('should reject a non-string pfxPassword', async() => {
    expect.assertions(1);
    return target.transform({ pfxPassword: 1 }, metadata).catch((error) => {
      const messages = error.getResponse().message as string[];
      expect(messages.some((message) => message.includes('pfxPassword'))).toBe(true);
    });
  });
});
