import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as forge from 'node-forge';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { GissPfxLoader } from './giss-pfx-loader';

const PASSWORD_ENV_VAR = 'TEST_GISS_CERT_PASSWORD';
const PASSWORD = 'super-secret';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function buildTestPfx(notAfter: Date = new Date(Date.now() + ONE_YEAR_MS)): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(notAfter.getTime() - ONE_YEAR_MS);
  cert.validity.notAfter = notAfter;
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

  beforeEach(() => {
    GissPfxLoader.clearCache();
  });

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

  it('should throw NfsProviderConfigError when the certificate has expired', () => {
    // Arrange
    writeFileSync(pfxPath, buildTestPfx(new Date(Date.now() - ONE_YEAR_MS)));

    // Act & Assert
    expect(() => GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR)).toThrow(NfsProviderConfigError);
    expect(() => GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR)).toThrow(/venceu em/);
  });
});

describe('GissPfxLoader.load - cache', () => {
  let dir: string;
  let pfxPath: string;

  beforeEach(() => {
    GissPfxLoader.clearCache();
    dir = mkdtempSync(join(tmpdir(), 'giss-pfx-cache-'));
    pfxPath = join(dir, 'test.pfx');
    writeFileSync(pfxPath, buildTestPfx());
    process.env[PASSWORD_ENV_VAR] = PASSWORD;
  });

  afterEach(() => {
    delete process.env[PASSWORD_ENV_VAR];
    rmSync(dir, { recursive: true, force: true });
  });

  it('should read and parse the PKCS#12 only once for the same file', () => {
    // Arrange — o gateway carrega o certificado a cada operação; parsear de novo é o custo que o
    // cache existe para evitar.
    const first = GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);

    // Act
    const second = GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);

    // Assert
    expect(second).toBe(first);
  });

  it('should reload when the certificate file changes on disk', () => {
    // Arrange
    const first = GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);

    // Act — troca de certificado sem reiniciar o processo.
    writeFileSync(pfxPath, buildTestPfx(new Date(Date.now() + 2 * ONE_YEAR_MS)));
    const second = GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);

    // Assert
    expect(second).not.toBe(first);
    expect(second.notAfter.getTime()).toBeGreaterThan(first.notAfter.getTime());
  });

  it('should expose the leaf certificate expiry date', () => {
    // Arrange
    const notAfter = new Date(Date.now() + ONE_YEAR_MS);
    writeFileSync(pfxPath, buildTestPfx(notAfter));
    GissPfxLoader.clearCache();

    // Act
    const material = GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);

    // Assert — segundos, porque o X.509 não guarda milissegundos.
    expect(Math.floor(material.notAfter.getTime() / 1000)).toBe(Math.floor(notAfter.getTime() / 1000));
  });

  it('should still refuse an expired certificate that is already cached', () => {
    // Arrange — o certificado é carregado válido e vence com o processo de pé.
    const notAfter = new Date(Date.now() + 60_000);
    writeFileSync(pfxPath, buildTestPfx(notAfter));
    GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR);
    jest.spyOn(Date, 'now').mockReturnValue(notAfter.getTime() + 1_000);

    // Act & Assert
    expect(() => GissPfxLoader.load(pfxPath, PASSWORD_ENV_VAR)).toThrow(NfsProviderConfigError);
    jest.restoreAllMocks();
  });
});
