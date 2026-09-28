import * as forge from 'node-forge';
import { AppException } from 'src/core/filters/app.exception';
import { buildTestTlsMaterial, ONE_YEAR_MS } from 'src/test/fixtures/test-certificate';
import { CertificateParserForgeAdapterGateway } from './certificate-parser-forge.gateway';

function buildPfx(password: string, notAfter = new Date(Date.now() + ONE_YEAR_MS)): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(notAfter.getTime() - ONE_YEAR_MS);
  cert.validity.notAfter = notAfter;
  const attrs = [{ name: 'commonName', value: 'Inter' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);
  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password);
  return Buffer.from(forge.asn1.toDer(p12).getBytes(), 'binary');
}

describe('CertificateParserForgeAdapterGateway - Unit tests', () => {
  let sut: CertificateParserForgeAdapterGateway;

  beforeEach(() => {
    sut = new CertificateParserForgeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should parse a PEM pair', () => {
    const material = buildTestTlsMaterial();
    const result = sut.parsePemPair(Buffer.from(material.certPem), Buffer.from(material.keyPem));
    expect(result.certPem).toContain('BEGIN CERTIFICATE');
    expect(result.keyPem).toContain('BEGIN');
    expect(result.notAfter.getTime()).toBeGreaterThan(Date.now());
  });

  it('should reject an invalid CRT', () => {
    expect(() => sut.parsePemPair(Buffer.from('not-a-cert'), Buffer.from('-----BEGIN PRIVATE KEY-----\nA\n-----END PRIVATE KEY-----')))
      .toThrow(AppException);
  });

  it('should parse a PFX with the correct password', () => {
    const result = sut.parsePfx(buildPfx('secret'), 'secret');
    expect(result.certPem).toContain('BEGIN CERTIFICATE');
    expect(result.keyPem).toContain('BEGIN');
  });

  it('should reject a PFX with the wrong password', () => {
    expect(() => sut.parsePfx(buildPfx('secret'), 'wrong')).toThrow(AppException);
  });
});
