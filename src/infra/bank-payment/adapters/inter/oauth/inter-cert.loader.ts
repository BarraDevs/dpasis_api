import { readFileSync, statSync } from 'node:fs';
import * as forge from 'node-forge';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';

export type InterCertMaterial = {
  cert: Buffer;
  key: Buffer;
  /** Vencimento do certificado mTLS — o que o healthcheck expõe e o alerta persegue. */
  notAfter: Date;
};

export class InterCertLoader {
  /**
   * Mesma disciplina do `GissPfxLoader`: a chave inclui `mtime` e tamanho dos dois arquivos, então
   * sobrescrever o certificado em disco invalida o cache sozinho.
   *
   * Antes o material ficava guardado no campo de cada cliente (`InterCobrancaClient` e
   * `InterOauthClient`), sem nenhuma invalidação — trocar o `.crt` exigia reiniciar a aplicação,
   * ao contrário do que `docs/runbook-certificados.md` §3 prometia. Com o certificado de sandbox
   * vencendo em plena janela de homologação, essa diferença é a troca acontecer no ar ou virar
   * indisponibilidade.
   */
  private static readonly cache = new Map<string, InterCertMaterial>();

  public static load(certPath: string, keyPath: string): InterCertMaterial {
    if (!certPath?.trim()) {
      throw new InterOauthConfigError('Caminho do certificado Inter (INTER_CERT_PATH) não está definido');
    }
    if (!keyPath?.trim()) {
      throw new InterOauthConfigError('Caminho da chave privada Inter (INTER_KEY_PATH) não está definido');
    }

    const cacheKey = this.buildCacheKey(certPath, keyPath);
    const cached = cacheKey ? this.cache.get(cacheKey) : undefined;
    if (cached) {
      // A validade é conferida fora do cache: um certificado carregado hoje vence amanhã com o
      // processo ainda de pé.
      this.ensureNotAfterInFuture(cached.notAfter, certPath);
      return cached;
    }

    const material = this.parse(certPath, keyPath);
    if (cacheKey) {
      this.cache.set(cacheKey, material);
    }
    return material;
  }

  /** Descarta o material em memória. Existe para os testes e para uma troca manual de certificado. */
  public static clearCache(): void {
    this.cache.clear();
  }

  private static buildCacheKey(certPath: string, keyPath: string): string | null {
    try {
      const certStats = statSync(certPath);
      const keyStats = statSync(keyPath);
      return `${certPath}|${certStats.mtimeMs}|${certStats.size}`
        + `|${keyPath}|${keyStats.mtimeMs}|${keyStats.size}`;
    }
    catch {
      // Arquivo ausente: deixa `parse` lançar o erro de configuração com a mensagem certa.
      return null;
    }
  }

  private static parse(certPath: string, keyPath: string): InterCertMaterial {
    let cert: Buffer;
    try {
      cert = readFileSync(certPath);
    }
    catch {
      throw new InterOauthConfigError(`Certificado Inter não encontrado em "${certPath}"`);
    }

    let key: Buffer;
    try {
      key = readFileSync(keyPath);
    }
    catch {
      throw new InterOauthConfigError(`Chave privada Inter não encontrada em "${keyPath}"`);
    }

    const notAfter = this.ensureNotExpired(cert, certPath);

    return { cert, key, notAfter };
  }

  /**
   * Sem isto, um certificado vencido aparece como erro de handshake TLS que o cliente de cobrança
   * colapsa em `ExternalApiError` genérico — indistinguível de instabilidade de rede. O job esgota
   * as tentativas e a NFS-e fica emitida sem boleto, sem ninguém saber por quê.
   */
  private static ensureNotExpired(cert: Buffer, certPath: string): Date {
    let notAfter: Date;

    try {
      notAfter = forge.pki.certificateFromPem(cert.toString()).validity.notAfter;
    }
    catch {
      throw new InterOauthConfigError(`Certificado Inter em "${certPath}" não é um PEM válido`);
    }

    this.ensureNotAfterInFuture(notAfter, certPath);

    return notAfter;
  }

  private static ensureNotAfterInFuture(notAfter: Date, certPath: string): void {
    if (notAfter.getTime() <= Date.now()) {
      throw new InterOauthConfigError(
        `Certificado Inter em "${certPath}" venceu em ${notAfter.toISOString()}`,
      );
    }
  }
}
