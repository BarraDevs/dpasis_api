import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { AppException } from 'src/core/filters/app.exception';
import type { ISecretsCryptoGateway } from '../../secrets-crypto.gateway';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

@Injectable()
export class SecretsCryptoAesGcmAdapterGateway implements ISecretsCryptoGateway {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    this.key = SecretsCryptoAesGcmAdapterGateway.parseKey(configService.secretsEncryptionKey);
  }

  public encrypt(plaintext: string): string {
    return this.encryptBytes(Buffer.from(plaintext, 'utf8')).toString('base64');
  }

  public decrypt(ciphertext: string): string {
    return this.decryptBytes(Buffer.from(ciphertext, 'base64')).toString('utf8');
  }

  public encryptBytes(plain: Buffer): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
  }

  public decryptBytes(cipher: Buffer): Buffer {
    if (cipher.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new AppException('Material cifrado inválido.');
    }

    const iv = cipher.subarray(0, IV_LENGTH);
    const tag = cipher.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = cipher.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    try {
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }
    catch {
      throw new AppException('Falha ao decifrar o material. Verifique SECRETS_ENCRYPTION_KEY.');
    }
  }

  private static parseKey(hex: string): Buffer {
    if (!/^[0-9a-fA-F]{64}$/.test(hex ?? '')) {
      throw new AppException('SECRETS_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (32 bytes).');
    }

    return Buffer.from(hex, 'hex');
  }
}
