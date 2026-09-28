import { AppException } from 'src/core/filters/app.exception';
import { buildTestTlsMaterial } from 'src/test/fixtures/test-certificate';
import { CertificateParserFakeAdapterGateway } from './certificate-parser-fake.gateway';

describe('CertificateParserFakeAdapterGateway - Unit tests', () => {
  let sut: CertificateParserFakeAdapterGateway;

  beforeEach(() => {
    sut = new CertificateParserFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should accept a PFX with a password', () => {
    const result = sut.parsePfx(Buffer.from('pfx'), 'ok');
    expect(result.certPem).toContain('BEGIN CERTIFICATE');
  });

  it('should reject an invalid PFX password', () => {
    expect(() => sut.parsePfx(Buffer.from('pfx'), 'invalid')).toThrow(AppException);
  });

  it('should accept a PEM pair that looks like PEM', () => {
    const material = buildTestTlsMaterial();
    const result = sut.parsePemPair(Buffer.from(material.certPem), Buffer.from(material.keyPem));
    expect(result.certPem).toContain('BEGIN CERTIFICATE');
  });

  it('should reject a CRT without PEM headers', () => {
    expect(() => sut.parsePemPair(Buffer.from('nope'), Buffer.from('nope'))).toThrow(AppException);
  });
});
