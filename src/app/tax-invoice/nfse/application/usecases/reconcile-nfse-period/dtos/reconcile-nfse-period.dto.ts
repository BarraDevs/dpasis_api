import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches } from 'class-validator';
import { NfseStatus } from '../../../../domain/enums/nfse-status.enum';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ReconcileNfsePeriodInputDto {
  /** `yyyy-MM-dd`, fuso `America/Sao_Paulo`. Inclusivo nos dois extremos, como o provedor. */
  @ApiProperty({ example: '2026-09-03' })
  @Matches(ISO_DATE, { message: '$property deve estar no formato yyyy-MM-dd' })
  startDate: string;

  @ApiProperty({ example: '2026-09-03' })
  @Matches(ISO_DATE, { message: '$property deve estar no formato yyyy-MM-dd' })
  endDate: string;

  /** Padrão da rota administrativa: relata o que faria sem gravar nada. */
  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

export class ReconcileNfsePeriodDivergenceDto {
  nfseId: number;
  rpsNumber: number;
  rpsSeries: string;
  status: NfseStatus;
  /** `true` quando o provedor devolveu a nota e o estado local foi (ou seria) corrigido. */
  foundAtProvider: boolean;
}

export class ReconcileNfsePeriodOutputDto {
  /** Notas locais não terminais na janela, o universo conferido. */
  checked: number;
  /** Quantas foram corrigidas — sempre 0 em `dryRun`. */
  corrected: number;
  /** Chamadas de página feitas ao provedor, somando todas as empresas. */
  pagesRead: number;
  divergences: ReconcileNfsePeriodDivergenceDto[];
  dryRun: boolean;
}
