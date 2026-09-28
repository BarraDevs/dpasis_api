import { Injectable } from '@nestjs/common';
import type { ISecretsCryptoGateway } from '../../secrets-crypto.gateway';

const PREFIX = 'enc:';

@Injectable()
export class SecretsCryptoFakeAdapterGateway implements ISecretsCryptoGateway {
  public encrypt(plaintext: string): string {
    return this.encryptBytes(Buffer.from(plaintext, 'utf8')).toString('base64');
  }

  public decrypt(ciphertext: string): string {
    return this.decryptBytes(Buffer.from(ciphertext, 'base64')).toString('utf8');
  }

  public encryptBytes(plain: Buffer): Buffer {
    return Buffer.from(`${PREFIX}${plain.toString('base64')}`, 'utf8');
  }

  public decryptBytes(cipher: Buffer): Buffer {
    const encoded = cipher.toString('utf8');
    if (!encoded.startsWith(PREFIX)) {
      return cipher;
    }

    return Buffer.from(encoded.slice(PREFIX.length), 'base64');
  }
}
