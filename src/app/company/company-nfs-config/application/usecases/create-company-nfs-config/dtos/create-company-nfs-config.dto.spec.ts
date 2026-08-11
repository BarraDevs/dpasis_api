import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateCompanyNfsConfigInputDto } from './create-company-nfs-config.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCompanyNfsConfigInputDto,
};

function makeValidInputDto(overrides: Partial<CreateCompanyNfsConfigInputDto> = {}): CreateCompanyNfsConfigInputDto {
  return {
    companyId: 1,
    vendor: 'giss',
    municipalRegistration: '12345',
    municipalCodeIbge: '3529401',
    serieRps: 'NFSE',
    environment: NfsProviderEnvironment.Demonstration,
    certFilePath: '/certs/x.pfx',
    certPasswordEnvVar: 'X_PASS',
    vendorConfig: { municipioSlug: 'demonstracao' },
    ...overrides,
  };
}

describe('CreateCompanyNfsConfigInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass when all fields are valid', async() => {
    const data = makeValidInputDto();
    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(CreateCompanyNfsConfigInputDto);
    expect(result.companyId).toBe(1);
  });

  it('should reject invalid environment', async() => {
    const data = makeValidInputDto({ environment: 'INVALID' as NfsProviderEnvironment });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      const message = error.getResponse().message as string[];
      expect(message).toContain('environment deve ser um valor válido');
    });
  });

  it('should reject missing vendorConfig object', async() => {
    const data = makeValidInputDto({ vendorConfig: undefined as unknown as Record<string, unknown> });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      const message = error.getResponse().message as string[];
      expect(message).toContain('vendorConfig deve ser um objeto');
    });
  });
});
