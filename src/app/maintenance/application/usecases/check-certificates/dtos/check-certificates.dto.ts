import { ApiProperty } from '@nestjs/swagger';

export enum CertificateHealthStatus {
  Ok = 'OK',
  Expiring = 'EXPIRING',
  Expired = 'EXPIRED',
  /** Não deu para ler o certificado: caminho errado, senha ausente, arquivo corrompido. */
  Error = 'ERROR',
}

export class CertificateHealthDto {
  @ApiProperty({ example: 'GISS' })
  provider: string;

  @ApiProperty({ example: 'DPA TEC (companyId=1)', description: 'A quem o certificado pertence.' })
  owner: string;

  @ApiProperty({ example: 'resources/files/nfs-generation/giss/cert.pfx' })
  path: string;

  @ApiProperty({ example: '2027-06-30T23:59:59.000Z', nullable: true })
  notAfter: string | null;

  @ApiProperty({ example: 87, nullable: true, description: 'Dias até o vencimento; negativo se já venceu.' })
  daysToExpire: number | null;

  @ApiProperty({ enum: CertificateHealthStatus })
  status: CertificateHealthStatus;

  @ApiProperty({ nullable: true, example: 'Certificado digital não encontrado em "..."' })
  message: string | null;
}

export class CheckCertificatesOutputDto {
  @ApiProperty({ type: [CertificateHealthDto] })
  certificates: CertificateHealthDto[];

  @ApiProperty({ enum: CertificateHealthStatus, description: 'O pior status entre os certificados.' })
  status: CertificateHealthStatus;
}
