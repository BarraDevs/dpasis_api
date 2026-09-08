import { readFileSync, statSync } from 'node:fs';
import * as forge from 'node-forge';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';

export type GissCertMaterial = {
  certPem: string;
  keyPem: string;
};

export type GissCertDetails = GissCertMaterial & {
  /** Vencimento do certificado folha — o que o healthcheck expõe e o alerta persegue. */
  notAfter: Date;
};

export class GissPfxLoader {
  /**
   * Ler o PKCS#12 do disco e rodar `pkcs12FromAsn1` custa caro, e o gateway fazia isso a cada
   * operação — três vezes numa emissão. A chave inclui `mtime` e tamanho do arquivo: trocar o
   * certificado no disco invalida o cache sozinho, sem reiniciar o processo.
   */
  private static readonly cache = new Map<string, GissCertDetails>();

  public static load(certFilePath: string, certPasswordEnvVar: string): GissCertDetails {
    const password = process.env[certPasswordEnvVar];
    if (!password) {
      throw new NfsProviderConfigError(`Variável de ambiente "${certPasswordEnvVar}" com a senha do certificado não está definida`);
    }

    const cacheKey = this.buildCacheKey(certFilePath, certPasswordEnvVar);
    const cached = cacheKey ? this.cache.get(cacheKey) : undefined;
    if (cached) {
      // A validade é conferida fora do cache: um certificado carregado hoje vence amanhã com o
      // processo ainda de pé.
      this.ensureNotExpired(cached.notAfter, certFilePath);
      return cached;
    }

    const material = this.parse(certFilePath, password);
    if (cacheKey) {
      this.cache.set(cacheKey, material);
    }
    return material;
  }

  /** Descarta o material em memória. Existe para os testes e para uma troca manual de certificado. */
  public static clearCache(): void {
    this.cache.clear();
  }

  private static buildCacheKey(certFilePath: string, certPasswordEnvVar: string): string | null {
    try {
      const stats = statSync(certFilePath);
      return `${certFilePath}|${certPasswordEnvVar}|${stats.mtimeMs}|${stats.size}`;
    }
    catch {
      // Arquivo ausente: deixa `parse` lançar o erro de configuração com a mensagem certa.
      return null;
    }
  }

  private static parse(certFilePath: string, password: string): GissCertDetails {
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
      const certs = (certBags[forge.pki.oids.certBag] ?? [])
        .map((bag) => bag.cert)
        .filter((cert): cert is forge.pki.Certificate => !!cert);

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key
        ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0]?.key;

      if (certs.length === 0 || !key) {
        throw new NfsProviderConfigError(`Certificado digital em "${certFilePath}" não contém certificado ou chave privada válidos`);
      }

      const chain = this.buildChain(certs);
      this.ensureNotExpired(chain[0].validity.notAfter, certFilePath);

      return {
        certPem: chain.map((cert) => forge.pki.certificateToPem(cert)).join(''),
        keyPem: forge.pki.privateKeyToPem(key),
        notAfter: chain[0].validity.notAfter,
      };
    }
    catch (error) {
      if (error instanceof NfsProviderConfigError) {
        throw error;
      }
      throw new NfsProviderConfigError(`Falha ao ler certificado digital em "${certFilePath}": senha incorreta ou arquivo corrompido`);
    }
  }

  /**
   * Vencimento de certificado é evento previsível, e sem esta checagem ele chega como falha de
   * handshake TLS genérica — que o gateway converte em `ExternalApiError` e o job trata como
   * indisponibilidade do provedor. Falhar aqui, com a data, troca um incidente por uma mensagem.
   */
  private static ensureNotExpired(notAfter: Date, certFilePath: string): void {
    if (notAfter.getTime() <= Date.now()) {
      throw new NfsProviderConfigError(
        `Certificado digital em "${certFilePath}" venceu em ${notAfter.toISOString()}`,
      );
    }
  }

  /**
   * PFX pode conter a cadeia completa (leaf + intermediárias + raiz). O servidor Giss precisa receber
   * leaf + intermediárias no handshake mTLS para montar o path de confiança; enviar só o leaf falha
   * quando a AC intermediária não está cacheada no lado do servidor (ex.: renovação de certificado com
   * troca de AC).
   */
  private static buildChain(certs: forge.pki.Certificate[]): forge.pki.Certificate[] {
    const issuedBy = new Set(certs.map((cert) => cert.issuer.hash));

    const leaf = certs.find((cert) => cert.subject.hash !== cert.issuer.hash && !issuedBy.has(cert.subject.hash))
      ?? certs[0];

    const chain: forge.pki.Certificate[] = [leaf];
    let current = leaf;
    while (current.subject.hash !== current.issuer.hash) {
      const parent = certs.find((cert) => cert.subject.hash === current.issuer.hash);
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
