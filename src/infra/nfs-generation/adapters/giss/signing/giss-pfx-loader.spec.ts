import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as forge from 'node-forge';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { GissPfxLoader } from './giss-pfx-loader';

const PASSWORD_ENV_VAR = 'TEST_GISS_CERT_PASSWORD';
const PASSWORD = 'super-secret';

function buildTestPfx(): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const attrs = [{ name: 'commonName', value: 'Test Provider' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], PASSWORD);
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
}

describe('GissPfxLoader.load - Unit tests', () => {
  let dir: string;
  let pfxPath: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'giss-pfx-test-'));
    pfxPath = join(dir, 'test.pfx');
    writeFileSync(pfxPath, buildTestPfx());
    process.env[PASSWORD_ENV_VAR] = PASSWORD;
  });

  afterAll(() => {
    delete process.env[PASSWORD_ENV_VAR];
    rmSync(dir, { recursive: true, force: true });
  });

  it('should be defined', () => {
    expect(GissPfxLoader).toBeDefined();
  });

  it('should load cert and private key PEM from a valid .pfx', () => {
    // Act
    const result = GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);

    // Assert
    expect(result.certPem).toContain('BEGIN CERTIFICATE');
    expect(result.keyPem).toContain('BEGIN');
    expect(result.keyPem).toContain('PRIVATE KEY');
  });

  it('should throw NfsProviderConfigError when the password env var is not set', () => {
    // Act & Assert
    expect(() => GissPfxLoader.load(pfxPath, 'UNSET_ENV_VAR')).toThrow(NfsProviderConfigError);
    expect(() => GissPfxLoader.load(pfxPath, 'UNSET_ENV_VAR')).toThrow('Variável de ambiente "UNSET_ENV_VAR" com a senha do certificado não está definida');
  });

  it('should throw NfsProviderConfigError when the file does not exist', () => {
    // Act & Assert
    expect(() => GissPfxLoader.load(join(dir, 'missing.pfx'), PASSWORD_ENV_VAR)).toThrow(NfsProviderConfigError);
    expect(() => GissPfxLoader.load(join(dir, 'missing.pfx'), PASSWORD_ENV_VAR)).toThrow('Certificado digital não encontrado em');
  });

  it('should throw NfsProviderConfigError when the password is wrong', () => {
    // Arrange
    process.env.TEST_WRONG_PASSWORD = 'wrong-password';

    // Act & Assert
    expect(() => GissPfxLoader.load(pfxPath, 'TEST_WRONG_PASSWORD')).toThrow(NfsProviderConfigError);
    expect(() => GissPfxLoader.load(pfxPath, 'TEST_WRONG_PASSWORD')).toThrow('senha incorreta ou arquivo corrompido');

    delete process.env.TEST_WRONG_PASSWORD;
  });

  it('should throw NfsProviderConfigError when the file is corrupted', () => {
    // Arrange
    const corruptedPath = join(dir, 'corrupted.pfx');
    writeFileSync(corruptedPath, 'not-a-pfx-file');

    // Act & Assert
    expect(() => GissPfxLoader.load(corruptedPath, PASSWORD_ENV_VAR)).toThrow(NfsProviderConfigError);
    expect(() => GissPfxLoader.load(corruptedPath, PASSWORD_ENV_VAR)).toThrow('senha incorreta ou arquivo corrompido');
  });
});
