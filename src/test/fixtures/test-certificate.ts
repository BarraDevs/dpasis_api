import * as forge from 'node-forge';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Certificado X.509 autoassinado para specs.
 *
 * Existe porque os carregadores de certificado passaram a parsear o PEM para ler `notAfter` — texto
 * falso (`"-----BEGIN CERTIFICATE-----\nfake\n..."`) deixou de ser aceito. `notAfter` é parâmetro
 * para que o caso do certificado vencido também possa ser testado.
 */
export function buildTestCertificatePem(notAfter: Date = new Date(Date.now() + ONE_YEAR_MS)): string {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(notAfter.getTime() - ONE_YEAR_MS);
  cert.validity.notAfter = notAfter;
  const attrs = [{ name: 'commonName', value: 'Test Certificate' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  return forge.pki.certificateToPem(cert);
}

export { ONE_YEAR_MS };
