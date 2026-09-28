import { createHash } from 'node:crypto';
import * as forge from 'node-forge';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';

export type InterCertMaterial = {
  cert: Buffer;
  key: Buffer;
  /** Vencimento do certificado mTLS — o que o healthcheck expõe e o alerta persegue. */
  notAfter: Date;
};

export class InterCertLoader {
  private static readonly cache = new Map<string, InterCertMaterial>();

  public static loadFromPem(certPem: string, keyPem: string): InterCertMaterial {
    if (!certPem?.trim()) {
      throw new InterOauthConfigError('Certificado Inter (PEM) não está definido');
    }
    if (!keyPem?.trim()) {
      throw new InterOauthConfigError('Chave privada Inter (PEM) não está definida');
    }

    const cacheKey = this.hashMaterial(certPem, keyPem);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.ensureNotAfterInFuture(cached.notAfter);
      return cached;
    }

    const material = this.parsePem(certPem, keyPem);
    this.cache.set(cacheKey, material);
    return material;
  }

  /** Descarta o material em memória. Existe para os testes e para uma troca de certificado. */
  public static clearCache(): void {
    this.cache.clear();
  }

  private static hashMaterial(certPem: string, keyPem: string): string {
    return createHash('sha256').update(certPem).update('\0').update(keyPem).digest('hex');
  }

  private static parsePem(certPem: string, keyPem: string): InterCertMaterial {
    const notAfter = this.ensureNotExpired(certPem);

    return {
      cert: Buffer.from(certPem),
      key: Buffer.from(keyPem),
      notAfter,
    };
  }

  private static ensureNotExpired(certPem: string): Date {
    let notAfter: Date;

    try {
      notAfter = forge.pki.certificateFromPem(certPem).validity.notAfter;
    }
    catch {
      throw new InterOauthConfigError('Certificado Inter não é um PEM válido');
    }

    this.ensureNotAfterInFuture(notAfter);

    return notAfter;
  }

  private static ensureNotAfterInFuture(notAfter: Date): void {
    if (notAfter.getTime() <= Date.now()) {
      throw new InterOauthConfigError(
        `Certificado Inter venceu em ${notAfter.toISOString()}`,
      );
    }
  }
}
