import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { AppException } from 'src/core/filters/app.exception';
import type { CertificateMaterialDto, ICertificateParserGateway } from '../../certificate-parser.gateway';

@Injectable()
export class CertificateParserForgeAdapterGateway implements ICertificateParserGateway {
  public parsePfx(buffer: Buffer, password: string): CertificateMaterialDto {
    try {
      const p12Der = forge.util.createBuffer(buffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certs = (certBags[forge.pki.oids.certBag] ?? [])
        .map((bag) => bag.cert)
        .filter((cert): cert is forge.pki.Certificate => !!cert);

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key
        ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0]?.key;

      if (certs.length === 0 || !key) {
        throw new AppException('O arquivo PFX não contém certificado ou chave privada válidos.');
      }

      const chain = this.buildChain(certs);
      const notAfter = chain[0].validity.notAfter;
      this.ensureNotExpired(notAfter);

      return {
        certPem: chain.map((cert) => forge.pki.certificateToPem(cert)).join(''),
        keyPem: forge.pki.privateKeyToPem(key),
        notAfter,
      };
    }
    catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException('Falha ao ler o certificado PFX: senha incorreta ou arquivo corrompido.');
    }
  }

  public parsePemPair(cert: Buffer, key: Buffer): CertificateMaterialDto {
    let parsed: forge.pki.Certificate;
    try {
      parsed = forge.pki.certificateFromPem(cert.toString('utf8'));
    }
    catch {
      throw new AppException('O arquivo .crt não é um certificado PEM válido.');
    }

    try {
      forge.pki.privateKeyFromPem(key.toString('utf8'));
    }
    catch {
      throw new AppException('O arquivo .key não é uma chave privada PEM válida.');
    }

    const notAfter = parsed.validity.notAfter;
    this.ensureNotExpired(notAfter);

    return {
      certPem: cert.toString('utf8'),
      keyPem: key.toString('utf8'),
      notAfter,
    };
  }

  private ensureNotExpired(notAfter: Date): void {
    if (notAfter.getTime() <= Date.now()) {
      throw new AppException(`O certificado venceu em ${notAfter.toISOString()}.`);
    }
  }

  private buildChain(certs: forge.pki.Certificate[]): forge.pki.Certificate[] {
    const issuedBy = new Set(certs.map((cert) => cert.issuer.hash));

    const leaf = certs.find((cert) => cert.subject.hash !== cert.issuer.hash && !issuedBy.has(cert.subject.hash))
      ?? certs[0];

    const chain: forge.pki.Certificate[] = [leaf];
    let current = leaf;
    while (current.subject.hash !== current.issuer.hash) {
      const parent = certs.find((item) => item.subject.hash === current.issuer.hash);
      const isRoot = !parent || parent.subject.hash === parent.issuer.hash;
      if (!parent || chain.includes(parent) || isRoot) {
        break;
      }
      chain.push(parent);
      current = parent;
    }

    return chain;
  }
}
