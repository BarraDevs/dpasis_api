import { ONE_YEAR_MS, buildTestTlsMaterial } from 'src/test/fixtures/test-certificate';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';
import { InterCertLoader } from './inter-cert.loader';

describe('InterCertLoader - Unit tests', () => {
  beforeEach(() => {
    InterCertLoader.clearCache();
  });

  it('should be defined', () => {
    expect(InterCertLoader).toBeDefined();
  });

  it('should load cert and key buffers from PEM', () => {
    // Arrange
    const material = buildTestTlsMaterial();

    // Act
    const result = InterCertLoader.loadFromPem(material.certPem, material.keyPem);

    // Assert
    expect(Buffer.isBuffer(result.cert)).toBe(true);
    expect(Buffer.isBuffer(result.key)).toBe(true);
    expect(result.cert.length).toBeGreaterThan(0);
    expect(result.key.length).toBeGreaterThan(0);
  });

  it('should throw InterOauthConfigError when cert PEM is empty', () => {
    const { keyPem } = buildTestTlsMaterial();
    expect(() => InterCertLoader.loadFromPem('', keyPem)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.loadFromPem('', keyPem)).toThrow(
      'Certificado Inter (PEM) não está definido',
    );
  });

  it('should throw InterOauthConfigError when cert PEM is whitespace', () => {
    const { keyPem } = buildTestTlsMaterial();
    expect(() => InterCertLoader.loadFromPem('   ', keyPem)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.loadFromPem('   ', keyPem)).toThrow(
      'Certificado Inter (PEM) não está definido',
    );
  });

  it('should throw InterOauthConfigError when key PEM is empty', () => {
    const { certPem } = buildTestTlsMaterial();
    expect(() => InterCertLoader.loadFromPem(certPem, '')).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.loadFromPem(certPem, '')).toThrow(
      'Chave privada Inter (PEM) não está definida',
    );
  });

  it('should throw InterOauthConfigError when key PEM is whitespace', () => {
    const { certPem } = buildTestTlsMaterial();
    expect(() => InterCertLoader.loadFromPem(certPem, '   ')).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.loadFromPem(certPem, '   ')).toThrow(
      'Chave privada Inter (PEM) não está definida',
    );
  });

  it('should throw InterOauthConfigError when the certificate has expired', () => {
    // Arrange
    const material = buildTestTlsMaterial(new Date(Date.now() - ONE_YEAR_MS));

    // Act & Assert
    expect(() => InterCertLoader.loadFromPem(material.certPem, material.keyPem)).toThrow(InterOauthConfigError);
    expect(() => InterCertLoader.loadFromPem(material.certPem, material.keyPem)).toThrow(/venceu em/);
  });

  it('should throw InterOauthConfigError when the certificate is not a valid PEM', () => {
    const { keyPem } = buildTestTlsMaterial();

    expect(() => InterCertLoader.loadFromPem(
      '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----\n',
      keyPem,
    )).toThrow('não é um PEM válido');
  });
});

describe('InterCertLoader.loadFromPem - cache', () => {
  beforeEach(() => {
    InterCertLoader.clearCache();
  });

  it('should parse the certificate only once for the same PEM', () => {
    const material = buildTestTlsMaterial();
    const first = InterCertLoader.loadFromPem(material.certPem, material.keyPem);
    const second = InterCertLoader.loadFromPem(material.certPem, material.keyPem);

    expect(second).toBe(first);
  });

  it('should reload when the PEM material changes', () => {
    const firstMaterial = buildTestTlsMaterial(new Date(Date.now() + ONE_YEAR_MS));
    const first = InterCertLoader.loadFromPem(firstMaterial.certPem, firstMaterial.keyPem);
    const secondMaterial = buildTestTlsMaterial(new Date(Date.now() + 2 * ONE_YEAR_MS));
    const second = InterCertLoader.loadFromPem(secondMaterial.certPem, secondMaterial.keyPem);

    expect(second).not.toBe(first);
    expect(second.notAfter.getTime()).toBeGreaterThan(first.notAfter.getTime());
  });

  it('should still refuse an expired certificate that is already cached', () => {
    const notAfter = new Date(Date.now() + 60_000);
    const material = buildTestTlsMaterial(notAfter);
    InterCertLoader.loadFromPem(material.certPem, material.keyPem);
    jest.spyOn(Date, 'now').mockReturnValue(notAfter.getTime() + 1_000);

    expect(() => InterCertLoader.loadFromPem(material.certPem, material.keyPem)).toThrow(InterOauthConfigError);
    jest.restoreAllMocks();
  });
});
