import { SignedXml } from 'xml-crypto';
import { GissCertMaterial } from './giss-pfx-loader';

const C14N = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
const ENVELOPED_SIGNATURE = 'http://www.w3.org/2000/09/xmldsig#enveloped-signature';
const SHA1 = 'http://www.w3.org/2000/09/xmldsig#sha1';
const RSA_SHA1 = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

/**
 * Assina um elemento com Id (ex.: `<LoteRps Id="lote1">...`) seguindo o subconjunto de xmldsig exigido
 * pelo manual Giss (RSA-SHA1, c14n, enveloped-signature, sem X509SubjectName/KeyValue — o KeyInfo default
 * do xml-crypto já inclui só X509Data/X509Certificate quando `publicCert` é passado).
 */
export function signGissElementById(xml: string, elementId: string, certMaterial: GissCertMaterial): string {
  const sig = new SignedXml({
    privateKey: certMaterial.keyPem,
    publicCert: certMaterial.certPem,
  });

  sig.signatureAlgorithm = RSA_SHA1;
  sig.canonicalizationAlgorithm = C14N;

  sig.addReference({
    xpath: `//*[@Id='${elementId}']`,
    transforms: [ENVELOPED_SIGNATURE, C14N],
    digestAlgorithm: SHA1,
    uri: `#${elementId}`,
  });

  sig.computeSignature(xml, {
    location: { reference: `//*[@Id='${elementId}']`, action: 'after' },
  });

  return sig.getSignedXml();
}
