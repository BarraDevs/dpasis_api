import { SignedXml } from 'xml-crypto';
import { GissCertMaterial } from './giss-pfx-loader';

export class GissXmlSigner {
  private static readonly C14N = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

  private static readonly ENVELOPED_SIGNATURE = 'http://www.w3.org/2000/09/xmldsig#enveloped-signature';

  private static readonly SHA1 = 'http://www.w3.org/2000/09/xmldsig#sha1';

  private static readonly RSA_SHA1 = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

  /**
   * Assina um elemento com Id (ex.: `<LoteRps Id="lote1">...`) seguindo o subconjunto de xmldsig exigido
   * pelo manual Giss (RSA-SHA1, c14n, enveloped-signature, sem X509SubjectName/KeyValue — o KeyInfo default
   * do xml-crypto já inclui só X509Data/X509Certificate quando `publicCert` é passado).
   */
  static signElementById(xml: string, elementId: string, certMaterial: GissCertMaterial): string {
    const sig = new SignedXml({
      privateKey: certMaterial.keyPem,
      publicCert: certMaterial.certPem,
    });

    sig.signatureAlgorithm = this.RSA_SHA1;
    sig.canonicalizationAlgorithm = this.C14N;

    sig.addReference({
      xpath: `//*[@Id='${elementId}']`,
      transforms: [this.ENVELOPED_SIGNATURE, this.C14N],
      digestAlgorithm: this.SHA1,
      uri: `#${elementId}`,
    });

    sig.computeSignature(xml, {
      location: { reference: `//*[@Id='${elementId}']`, action: 'after' },
    });

    return sig.getSignedXml();
  }

  /**
   * Assina o documento inteiro (enveloped, `Reference URI=""`) para elementos que não têm atributo `Id` no
   * XSD (ex.: `ConsultarLoteRpsEnvio`, cujo `complexType` só tem `Prestador`/`Protocolo`/`Signature`, sem
   * `Id` — diferente de `tcLoteRps`, que tem `Id` e por isso usa `signElementById`). `isEmptyUri: true`
   * faz o xml-crypto emitir `URI=""` e não adicionar atributo `Id` no elemento raiz.
   */
  static signWholeDocument(xml: string, certMaterial: GissCertMaterial): string {
    const sig = new SignedXml({
      privateKey: certMaterial.keyPem,
      publicCert: certMaterial.certPem,
    });

    sig.signatureAlgorithm = this.RSA_SHA1;
    sig.canonicalizationAlgorithm = this.C14N;

    sig.addReference({
      xpath: '/*',
      transforms: [this.ENVELOPED_SIGNATURE, this.C14N],
      digestAlgorithm: this.SHA1,
      isEmptyUri: true,
    });

    sig.computeSignature(xml, {
      location: { reference: '/*', action: 'append' },
    });

    return sig.getSignedXml();
  }
}
