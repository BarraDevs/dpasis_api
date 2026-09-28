import { Injectable } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';
import { buildTestTlsMaterial } from 'src/test/fixtures/test-certificate';
import type { CertificateMaterialDto, ICertificateParserGateway } from '../../certificate-parser.gateway';

@Injectable()
export class CertificateParserFakeAdapterGateway implements ICertificateParserGateway {
  public parsePfx(_buffer: Buffer, password: string): CertificateMaterialDto {
    if (!password?.trim() || password === 'invalid') {
      throw new AppException('Falha ao ler o certificado PFX: senha incorreta ou arquivo corrompido.');
    }

    return buildTestTlsMaterial();
  }

  public parsePemPair(cert: Buffer, key: Buffer): CertificateMaterialDto {
    const certText = cert.toString('utf8');
    const keyText = key.toString('utf8');
    if (!certText.includes('BEGIN CERTIFICATE') || !keyText.includes('BEGIN')) {
      throw new AppException('O arquivo .crt não é um certificado PEM válido.');
    }

    return buildTestTlsMaterial();
  }
}
