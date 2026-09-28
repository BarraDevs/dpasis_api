export interface ISecretsCryptoGateway {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
  encryptBytes(plain: Buffer): Buffer;
  decryptBytes(cipher: Buffer): Buffer;
}
