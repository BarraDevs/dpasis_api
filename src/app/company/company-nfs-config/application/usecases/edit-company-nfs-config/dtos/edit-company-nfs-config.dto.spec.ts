import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditCompanyNfsConfigInputDto } from './edit-company-nfs-config.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditCompanyNfsConfigInputDto,
};

describe('EditCompanyNfsConfigInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept partial updates', async() => {
    const result = await target.transform({ serieRps: 'NFSE2' }, metadata);
    expect(result).toBeInstanceOf(EditCompanyNfsConfigInputDto);
    expect(result.serieRps).toBe('NFSE2');
  });

  it('should strip companyId from body via whitelist', async() => {
    const result = await target.transform(
      { serieRps: 'NFSE2', companyId: 99 },
      metadata,
    );

    expect(result.serieRps).toBe('NFSE2');
    expect((result as EditCompanyNfsConfigInputDto & { companyId?: number }).companyId).toBeUndefined();
  });

  it('should reject invalid environment on partial update', async() => {
    expect.assertions(1);
    return target.transform({ environment: 'INVALID' as NfsProviderEnvironment }, metadata).catch((error) => {
      const message = error.getResponse().message as string[];
      expect(message).toContain('environment deve ser um valor válido');
    });
  });
});
