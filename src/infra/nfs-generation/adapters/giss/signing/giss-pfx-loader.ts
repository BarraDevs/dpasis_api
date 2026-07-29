import { readFileSync } from 'node:fs';
import * as forge from 'node-forge';
import { NfsProviderConfigError } from 'src/shared/errors/nfs-provider-config.error';

export type GissCertMaterial = {
  certPem: string;
  keyPem: string;
};

export class GissPfxLoader {
  static load(certFilePath: string, certPasswordEnvVar: string): GissCertMaterial {
    const password = process.env[certPasswordEnvVar];
    if (!password) {
      throw new NfsProviderConfigError(`Variável de ambiente "${certPasswordEnvVar}" com a senha do certificado não está definida`);
    }

    let pfxBuffer: Buffer;
    try {
      pfxBuffer = readFileSync(certFilePath);
    }
    catch {
      throw new NfsProviderConfigError(`Certificado digital não encontrado em "${certFilePath}"`);
    }

    try {
      const p12Der = forge.util.createBuffer(pfxBuffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key
        ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0]?.key;

      if (!cert || !key) {
        throw new NfsProviderConfigError(`Certificado digital em "${certFilePath}" não contém certificado ou chave privada válidos`);
      }

      return {
        certPem: forge.pki.certificateToPem(cert),
        keyPem: forge.pki.privateKeyToPem(key),
      };
    }
    catch (error) {
      if (error instanceof NfsProviderConfigError) {
        throw error;
      }
      throw new NfsProviderConfigError(`Falha ao ler certificado digital em "${certFilePath}": senha incorreta ou arquivo corrompido`);
    }
  }
}
