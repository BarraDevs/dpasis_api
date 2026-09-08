import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as forge from 'node-forge';
import type { ICompanyNfsConfigDao } from 'src/app/company/company-nfs-config/application/persistence/dao/company-nfs-config-dao.interface';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { GissPfxLoader } from 'src/infra/nfs-generation/adapters/giss/signing/giss-pfx-loader';
import { buildTestCertificatePem, ONE_YEAR_MS } from 'src/test/fixtures/test-certificate';
import { CheckCertificates } from './check-certificates.service';
import { CertificateHealthStatus } from './dtos/check-certificates.dto';

const PASSWORD_ENV_VAR = 'TEST_CHECK_CERT_PASSWORD';
const PASSWORD = 'super-secret';

function buildPfx(notAfter: Date): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(notAfter.getTime() - ONE_YEAR_MS);
  cert.validity.notAfter = notAfter;
  const attrs = [{ name: 'commonName', value: 'Prestador' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], PASSWORD);
  return Buffer.from(forge.asn1.toDer(p12).getBytes(), 'binary');
}

function makeConfig(certFilePath: string, overrides: Partial<CompanyNfsConfigDto> = {}): CompanyNfsConfigDto {
  return createMock<CompanyNfsConfigDto>({
    companyId: 1,
    vendor: 'GISS',
    municipalRegistration: '16895',
    certFilePath,
    certPasswordEnvVar: PASSWORD_ENV_VAR,
    ...overrides,
  });
}

describe('CheckCertificates - Unit tests', () => {
  let sut: CheckCertificates;
  let companyNfsConfigDao: ICompanyNfsConfigDao;
  let dir: string;
  // Objeto mutável em vez de `createMock`: os getters do `ConfigService` não existem no mock, e cada
  // caso precisa ligar e desligar provedor.
  let config: {
    gissProviderEnabled: boolean;
    interProviderEnabled: boolean;
    interCertPath: string;
    interKeyPath: string;
  };

  beforeEach(async() => {
    GissPfxLoader.clearCache();
    dir = mkdtempSync(join(tmpdir(), 'check-certificates-'));
    process.env[PASSWORD_ENV_VAR] = PASSWORD;

    config = {
      gissProviderEnabled: true,
      interProviderEnabled: false,
      interCertPath: '',
      interKeyPath: '',
    };

    const module = await Test.createTestingModule({
      providers: [
        CheckCertificates,
        { provide: TOKENS.CompanyNfsConfigDao, useValue: createMock<ICompanyNfsConfigDao>() },
        { provide: ConfigService, useValue: config as unknown as ConfigService },
      ],
    }).compile();

    sut = module.get(CheckCertificates);
    companyNfsConfigDao = module.get(TOKENS.CompanyNfsConfigDao);
  });

  afterEach(() => {
    delete process.env[PASSWORD_ENV_VAR];
    rmSync(dir, { recursive: true, force: true });
  });

  it('should report a healthy Giss certificate with its expiry date', async() => {
    // Arrange
    const path = join(dir, 'valid.pfx');
    const notAfter = new Date(Date.now() + ONE_YEAR_MS);
    writeFileSync(path, buildPfx(notAfter));
    jest.spyOn(companyNfsConfigDao, 'findAll').mockResolvedValue([makeConfig(path)]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.status).toBe(CertificateHealthStatus.Ok);
    expect(result.certificates[0]).toMatchObject({
      provider: 'GISS',
      status: CertificateHealthStatus.Ok,
      daysToExpire: expect.any(Number) as unknown as number,
    });
  });

  it('should flag a certificate inside the 30-day warning window', async() => {
    // Arrange — 30 dias é o prazo mínimo para emitir e instalar um certificado novo.
    const path = join(dir, 'expiring.pfx');
    writeFileSync(path, buildPfx(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)));
    jest.spyOn(companyNfsConfigDao, 'findAll').mockResolvedValue([makeConfig(path)]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.status).toBe(CertificateHealthStatus.Expiring);
    expect(result.certificates[0].daysToExpire).toBeLessThanOrEqual(30);
  });

  it('should report an expired certificate as expired, not as a read failure', async() => {
    // Arrange
    const path = join(dir, 'expired.pfx');
    writeFileSync(path, buildPfx(new Date(Date.now() - ONE_YEAR_MS)));
    jest.spyOn(companyNfsConfigDao, 'findAll').mockResolvedValue([makeConfig(path)]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.certificates[0].status).toBe(CertificateHealthStatus.Expired);
  });

  it('should not blow up when the certificate file is missing', async() => {
    // Arrange — um healthcheck que cai por causa do problema que reporta não serve para nada.
    jest.spyOn(companyNfsConfigDao, 'findAll').mockResolvedValue([makeConfig(join(dir, 'missing.pfx'))]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.certificates[0]).toMatchObject({
      status: CertificateHealthStatus.Error,
      notAfter: null,
      message: expect.stringContaining('não encontrado') as unknown as string,
    });
  });

  it('should check the Inter certificate when the provider is enabled', async() => {
    // Arrange
    const certPath = join(dir, 'inter.crt');
    const keyPath = join(dir, 'inter.key');
    writeFileSync(certPath, buildTestCertificatePem());
    writeFileSync(keyPath, 'key');
    jest.spyOn(companyNfsConfigDao, 'findAll').mockResolvedValue([]);
    config.gissProviderEnabled = false;
    config.interProviderEnabled = true;
    config.interCertPath = certPath;
    config.interKeyPath = keyPath;

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.certificates).toEqual([expect.objectContaining({ provider: 'INTER' })]);
  });

  it('should skip providers that are turned off', async() => {
    // Arrange
    config.gissProviderEnabled = false;

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.certificates).toEqual([]);
    expect(result.status).toBe(CertificateHealthStatus.Ok);
    expect(companyNfsConfigDao.findAll).not.toHaveBeenCalled();
  });
});
