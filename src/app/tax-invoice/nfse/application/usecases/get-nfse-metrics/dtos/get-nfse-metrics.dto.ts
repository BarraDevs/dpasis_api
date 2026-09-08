import { ApiProperty } from '@nestjs/swagger';

export class NfseCountByKeyDto {
  @ApiProperty({ example: 'ISSUED' })
  key: string;

  @ApiProperty({ example: 128 })
  count: number;
}

export class NfseProviderCallStatsDto {
  @ApiProperty({ example: 'GISS_CONSULTAR_LOTE' })
  operation: string;

  @ApiProperty({ example: 340 })
  calls: number;

  @ApiProperty({ example: 12, description: 'Chamadas com erro registrado.' })
  errors: number;

  @ApiProperty({ example: 812, nullable: true, description: 'Duração média em ms.' })
  averageDurationMs: number | null;

  @ApiProperty({ example: 5300, nullable: true, description: 'Pior duração em ms.' })
  maxDurationMs: number | null;
}

export class QueueDepthDto {
  @ApiProperty({ example: 'nfse-issue' })
  queue: string;

  @ApiProperty({ example: 3 })
  waiting: number;

  @ApiProperty({ example: 1 })
  active: number;

  @ApiProperty({ example: 12 })
  delayed: number;

  @ApiProperty({ example: 0, description: 'Jobs que esgotaram as tentativas — a DLQ.' })
  failed: number;
}

export class GetNfseMetricsOutputDto {
  @ApiProperty({ example: '2026-09-04T12:00:00.000Z' })
  generatedAt: string;

  @ApiProperty({ type: [NfseCountByKeyDto], description: 'NFS-e por status.' })
  byStatus: NfseCountByKeyDto[];

  @ApiProperty({ example: 2, description: 'Não terminais sem movimento há mais de 2h.' })
  stuck: number;

  @ApiProperty({ example: 1, description: 'Emitidas sem cobrança vinculada há mais de 1h.' })
  issuedWithoutBankPayment: number;

  @ApiProperty({ type: [NfseCountByKeyDto], description: 'Cobranças por situação confirmada no provedor.' })
  bankPaymentByStatus: NfseCountByKeyDto[];

  @ApiProperty({ type: [NfseProviderCallStatsDto], description: 'Chamadas aos provedores nas últimas 24h.' })
  providerCalls: NfseProviderCallStatsDto[];

  @ApiProperty({ type: [QueueDepthDto] })
  queues: QueueDepthDto[];
}
