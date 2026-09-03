import { readFileSync } from 'node:fs';
import * as forge from 'node-forge';
import { InterOauthConfigError } from './errors/inter-oauth-config.error';

export type InterCertMaterial = {
  cert: Buffer;
  key: Buffer;
};

export class InterCertLoader {
  public static load(certPath: string, keyPath: string): InterCertMaterial {
    if (!certPath?.trim()) {
      throw new InterOauthConfigError('Caminho do certificado Inter (INTER_CERT_PATH) não está definido');
    }
    if (!keyPath?.trim()) {
      throw new InterOauthConfigError('Caminho da chave privada Inter (INTER_KEY_PATH) não está definido');
    }

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

    this.ensureNotExpired(cert, certPath);

    return { cert, key };
  }

  /**
   * Sem isto, um certificado vencido aparece como erro de handshake TLS que o cliente de cobrança
   * colapsa em `ExternalApiError` genérico — indistinguível de instabilidade de rede. O job esgota
   * as tentativas e a NFS-e fica emitida sem boleto, sem ninguém saber por quê.
   */
  private static ensureNotExpired(cert: Buffer, certPath: string): void {
    let notAfter: Date;

    try {
      notAfter = forge.pki.certificateFromPem(cert.toString()).validity.notAfter;
    }
    catch {
      throw new InterOauthConfigError(`Certificado Inter em "${certPath}" não é um PEM válido`);
    }

    if (notAfter.getTime() <= Date.now()) {
      throw new InterOauthConfigError(
        `Certificado Inter em "${certPath}" venceu em ${notAfter.toISOString()}`,
      );
    }
  }
}
