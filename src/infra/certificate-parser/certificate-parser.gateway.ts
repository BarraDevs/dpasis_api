export type CertificateMaterialDto = {
  certPem: string;
  keyPem: string;
  notAfter: Date;
};

export interface ICertificateParserGateway {
  parsePfx(buffer: Buffer, password: string): CertificateMaterialDto;
  parsePemPair(cert: Buffer, key: Buffer): CertificateMaterialDto;
}
