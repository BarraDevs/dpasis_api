import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ONE_YEAR_MS, buildTestCertificatePem } from 'src/test/fixtures/test-certificate';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';
import { InterCertLoader } from './inter-cert.loader';

describe('InterCertLoader - Unit tests', () => {
  let sutDir: string;
  let certPath: string;
  let keyPath: string;

  beforeEach(() => {
    InterCertLoader.clearCache();
    sutDir = join(tmpdir(), `inter-cert-loader-${Date.now()}`);
    mkdirSync(sutDir, { recursive: true });
    certPath = join(sutDir, 'inter.crt');
    keyPath = join(sutDir, 'inter.key');
    writeFileSync(certPath, buildTestCertificatePem(new Date(Date.now() + ONE_YEAR_MS)));
    writeFileSync(keyPath, '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n');
  });

  afterEach(() => {
    rmSync(sutDir, { recursive: true, force: true });
  });

  it('should be defined', () => {
    expect(InterCertLoader).toBeDefined();
  });

  it('should load cert and key buffers from existing files', () => {
    // Act
    const result = InterCertLoader.load(certPath, keyPath);

    // Assert
    expect(Buffer.isBuffer(result.cert)).toBe(true);
    expect(Buffer.isBuffer(result.key)).toBe(true);
    expect(result.cert.length).toBeGreaterThan(0);
    expect(result.key.length).toBeGreaterThan(0);
  });

  it('should throw InterOauthConfigError when cert path is empty', () => {
    expect(() => InterCertLoader.load('', keyPath)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load('', keyPath)).toThrow(
      'Caminho do certificado Inter (INTER_CERT_PATH) não está definido',
    );
  });

  it('should throw InterOauthConfigError when cert path is whitespace', () => {
    expect(() => InterCertLoader.load('   ', keyPath)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load('   ', keyPath)).toThrow(
      'Caminho do certificado Inter (INTER_CERT_PATH) não está definido',
    );
  });

  it('should throw InterOauthConfigError when key path is empty', () => {
    expect(() => InterCertLoader.load(certPath, '')).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load(certPath, '')).toThrow(
      'Caminho da chave privada Inter (INTER_KEY_PATH) não está definido',
    );
  });

  it('should throw InterOauthConfigError when key path is whitespace', () => {
    expect(() => InterCertLoader.load(certPath, '   ')).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load(certPath, '   ')).toThrow(
      'Caminho da chave privada Inter (INTER_KEY_PATH) não está definido',
    );
  });

  it('should throw InterOauthConfigError when cert file does not exist', () => {
    const missing = join(sutDir, 'missing.crt');

    expect(() => InterCertLoader.load(missing, keyPath)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load(missing, keyPath)).toThrow(
      `Certificado Inter não encontrado em "${missing}"`,
    );
  });

  it('should throw InterOauthConfigError when key file does not exist', () => {
    const missing = join(sutDir, 'missing.key');

    expect(() => InterCertLoader.load(certPath, missing)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load(certPath, missing)).toThrow(
      `Chave privada Inter não encontrada em "${missing}"`,
    );
  });

  it('should throw InterOauthConfigError when the certificate has expired', () => {
    // Arrange
    writeFileSync(certPath, buildTestCertificatePem(new Date(Date.now() - ONE_YEAR_MS)));

    // Act & Assert
    expect(() => InterCertLoader.load(certPath, keyPath)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load(certPath, keyPath)).toThrow(/venceu em/);
  });

  it('should throw InterOauthConfigError when the certificate is not a valid PEM', () => {
    // Arrange
    writeFileSync(certPath, '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----\n');

    // Act & Assert
    expect(() => InterCertLoader.load(certPath, keyPath)).toThrow('não é um PEM válido');
  });
});

describe('InterCertLoader.load - cache', () => {
  let dir: string;
  let certPath: string;
  let keyPath: string;

  beforeEach(() => {
    InterCertLoader.clearCache();
    dir = mkdtempSync(join(tmpdir(), 'inter-cert-cache-'));
    certPath = join(dir, 'inter.crt');
    keyPath = join(dir, 'inter.key');
    writeFileSync(certPath, buildTestCertificatePem(new Date(Date.now() + ONE_YEAR_MS)));
    writeFileSync(keyPath, '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should read and parse the certificate only once for the same files', () => {
    // Arrange — todo request de cobrança monta um Agent novo; reler e reparsear o PEM a cada
    // chamada é o custo que o cache existe para evitar.
    const first = InterCertLoader.load(certPath, keyPath);

    // Act
    const second = InterCertLoader.load(certPath, keyPath);

    // Assert
    expect(second).toBe(first);
  });

  it('should reload when the certificate file changes on disk', () => {
    // Arrange — é isto que faz a troca a quente prometida no runbook §3 valer também para o Inter:
    // antes o material ficava preso na instância do cliente e só saía com um restart.
    const first = InterCertLoader.load(certPath, keyPath);

    // Act
    writeFileSync(certPath, buildTestCertificatePem(new Date(Date.now() + 2 * ONE_YEAR_MS)));
    const second = InterCertLoader.load(certPath, keyPath);

    // Assert
    expect(second).not.toBe(first);
    expect(second.notAfter.getTime()).toBeGreaterThan(first.notAfter.getTime());
  });

  it('should still refuse an expired certificate that is already cached', () => {
    // Arrange — carregado válido, vence com o processo de pé.
    const notAfter = new Date(Date.now() + 60_000);
    writeFileSync(certPath, buildTestCertificatePem(notAfter));
    InterCertLoader.load(certPath, keyPath);
    jest.spyOn(Date, 'now').mockReturnValue(notAfter.getTime() + 1_000);

    // Act & Assert
    expect(() => InterCertLoader.load(certPath, keyPath)).toThrow(InterOauthConfigError);
    jest.restoreAllMocks();
  });
});
