import { DOMParser } from '@xmldom/xmldom';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { GissCertMaterial } from './giss-pfx-loader';
import { GissXmlSigner } from './giss-xml-signer';

function buildCertMaterial(): GissCertMaterial {
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

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

describe('GissXmlSigner.signElementById - Unit tests', () => {
  it('should be defined', () => {
    expect(GissXmlSigner).toBeDefined();
  });

  it('should append a valid, verifiable Signature after the referenced element', () => {
    // Arrange
    const certMaterial = buildCertMaterial();
    const xml = '<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd"><LoteRps Id="lote1" versao="1.00"><NumeroLote>1</NumeroLote></LoteRps></EnviarLoteRpsEnvio>';

    // Act
    const signedXml = GissXmlSigner.signElementById(xml, 'lote1', certMaterial);

    // Assert
    expect(signedXml).toContain('<Signature');
    expect(signedXml.indexOf('</LoteRps>')).toBeLessThan(signedXml.indexOf('<Signature'));

    const verifier = new SignedXml({
      publicCert: certMaterial.certPem,
      getCertFromKeyInfo: () => certMaterial.certPem,
    });
    const doc = new DOMParser().parseFromString(signedXml);
    const [signatureNode] = verifier.findSignatures(doc);
    verifier.loadSignature(signatureNode);
    expect(verifier.checkSignature(signedXml)).toBe(true);
  });

  it('should not include KeyValue/X509SubjectName in KeyInfo, only X509Certificate', () => {
    // Arrange
    const certMaterial = buildCertMaterial();
    const xml = '<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd"><LoteRps Id="lote1" versao="1.00"><NumeroLote>1</NumeroLote></LoteRps></EnviarLoteRpsEnvio>';

    // Act
    const signedXml = GissXmlSigner.signElementById(xml, 'lote1', certMaterial);

    // Assert
    expect(signedXml).toContain('X509Certificate');
    expect(signedXml).not.toContain('KeyValue');
    expect(signedXml).not.toContain('X509SubjectName');
  });

  it('should sign an element referenced by rps Id', () => {
    // Arrange
    const certMaterial = buildCertMaterial();
    const xml = '<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd"><Rps><InfDeclaracaoPrestacaoServico Id="rps1"><Numero>1</Numero></InfDeclaracaoPrestacaoServico></Rps></EnviarLoteRpsEnvio>';

    // Act
    const signedXml = GissXmlSigner.signElementById(xml, 'rps1', certMaterial);

    // Assert
    expect(signedXml).toContain('<Signature');
    expect(signedXml).toContain('URI="#rps1"');

    const verifier = new SignedXml({
      publicCert: certMaterial.certPem,
      getCertFromKeyInfo: () => certMaterial.certPem,
    });
    const doc = new DOMParser().parseFromString(signedXml);
    const [signatureNode] = verifier.findSignatures(doc);
    verifier.loadSignature(signatureNode);
    expect(verifier.checkSignature(signedXml)).toBe(true);
  });
});

describe('GissXmlSigner.signWholeDocument - Unit tests', () => {
  it('should append a valid, verifiable Signature as the last child of the root element, with an empty Reference URI', () => {
    // Arrange
    const certMaterial = buildCertMaterial();
    const xml = '<ConsultarLoteRpsEnvio xmlns="http://www.giss.com.br/consultar-lote-rps-envio-v2_04.xsd"><Prestador><Cnpj>02099923000178</Cnpj></Prestador><Protocolo>102071</Protocolo></ConsultarLoteRpsEnvio>';

    // Act
    const signedXml = GissXmlSigner.signWholeDocument(xml, certMaterial);

    // Assert
    expect(signedXml).toContain('<Signature');
    expect(signedXml).toContain('URI=""');
    expect(signedXml.indexOf('</Protocolo>')).toBeLessThan(signedXml.indexOf('<Signature'));
    expect(signedXml.indexOf('<Signature')).toBeLessThan(signedXml.indexOf('</ConsultarLoteRpsEnvio>'));

    const verifier = new SignedXml({
      publicCert: certMaterial.certPem,
      getCertFromKeyInfo: () => certMaterial.certPem,
    });
    const doc = new DOMParser().parseFromString(signedXml);
    const [signatureNode] = verifier.findSignatures(doc);
    verifier.loadSignature(signatureNode);
    expect(verifier.checkSignature(signedXml)).toBe(true);
  });

  it('should not add an Id attribute to the root element', () => {
    // Arrange
    const certMaterial = buildCertMaterial();
    const xml = '<ConsultarLoteRpsEnvio xmlns="http://www.giss.com.br/consultar-lote-rps-envio-v2_04.xsd"><Prestador><Cnpj>02099923000178</Cnpj></Prestador><Protocolo>102071</Protocolo></ConsultarLoteRpsEnvio>';

    // Act
    const signedXml = GissXmlSigner.signWholeDocument(xml, certMaterial);

    // Assert
    expect(signedXml).not.toMatch(/<ConsultarLoteRpsEnvio[^>]*\sId=/);
  });
});
