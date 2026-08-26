import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';
import { InterCertLoader } from './inter-cert.loader';

describe('InterCertLoader - Unit tests', () => {
  let sutDir: string;
  let certPath: string;
  let keyPath: string;

  beforeEach(() => {
    sutDir = join(tmpdir(), `inter-cert-loader-${Date.now()}`);
    mkdirSync(sutDir, { recursive: true });
    certPath = join(sutDir, 'inter.crt');
    keyPath = join(sutDir, 'inter.key');
    writeFileSync(certPath, '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----\n');
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

  it('should throw InterOauthConfigError when key path is empty', () => {
    expect(() => InterCertLoader.load(certPath, '')).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.load(certPath, '')).toThrow(
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
});
