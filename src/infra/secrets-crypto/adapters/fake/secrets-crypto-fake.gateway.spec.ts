import { SecretsCryptoFakeAdapterGateway } from './secrets-crypto-fake.gateway';

describe('SecretsCryptoFakeAdapterGateway - Unit tests', () => {
  let sut: SecretsCryptoFakeAdapterGateway;

  beforeEach(() => {
    sut = new SecretsCryptoFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should round-trip a string with a reversible prefix', () => {
    const cipher = sut.encrypt('plain');
    expect(Buffer.from(cipher, 'base64').toString('utf8')).toContain('enc:');
    expect(sut.decrypt(cipher)).toBe('plain');
  });

  it('should round-trip bytes', () => {
    const plain = Buffer.from('hello');
    expect(sut.decryptBytes(sut.encryptBytes(plain)).equals(plain)).toBe(true);
  });
});
