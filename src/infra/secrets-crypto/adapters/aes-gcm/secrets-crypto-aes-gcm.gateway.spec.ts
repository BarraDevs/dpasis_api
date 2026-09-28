import { AppException } from 'src/core/filters/app.exception';
import { ConfigService } from 'src/core/config/config.service';
import { SecretsCryptoAesGcmAdapterGateway } from './secrets-crypto-aes-gcm.gateway';

const KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('SecretsCryptoAesGcmAdapterGateway - Unit tests', () => {
  let sut: SecretsCryptoAesGcmAdapterGateway;

  beforeEach(() => {
    sut = new SecretsCryptoAesGcmAdapterGateway({
      secretsEncryptionKey: KEY,
    } as ConfigService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should round-trip a string', () => {
    const cipher = sut.encrypt('client-secret');
    expect(cipher).not.toContain('client-secret');
    expect(sut.decrypt(cipher)).toBe('client-secret');
  });

  it('should round-trip bytes', () => {
    const plain = Buffer.from('pfx-bytes');
    const cipher = sut.encryptBytes(plain);
    expect(cipher.equals(plain)).toBe(false);
    expect(sut.decryptBytes(cipher).equals(plain)).toBe(true);
  });

  it('should reject truncated ciphertext', () => {
    expect(() => sut.decryptBytes(Buffer.alloc(4))).toThrow(AppException);
  });

  it('should reject ciphertext produced with another key', () => {
    const other = new SecretsCryptoAesGcmAdapterGateway({
      secretsEncryptionKey: 'ff'.repeat(32),
    } as ConfigService);
    const cipher = other.encrypt('secret');

    expect(() => sut.decrypt(cipher)).toThrow(AppException);
  });
});
