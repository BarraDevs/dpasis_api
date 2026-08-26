import { readFileSync } from 'node:fs';
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

    return { cert, key };
  }
}
