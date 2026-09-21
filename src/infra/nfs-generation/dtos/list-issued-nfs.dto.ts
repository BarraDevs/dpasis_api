import { ApiProperty } from '@nestjs/swagger';
import { NfsBatchErrorDto } from './nfs-batch-status.dto';
import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

/** Teto de página do XSD Giss (`maxOccurs="50"` em `ListaNfse/CompNfse`). */
export const LIST_ISSUED_NFS_PAGE_SIZE = 50;

export class ListIssuedNfsInputDto {
  /** Datas de emissão, `yyyy-MM-dd`. O provedor filtra por `PeriodoEmissao`. */
  startDate: string;
  endDate: string;
  /** Página, começando em 1. Obrigatória no XSD. */
  page: number;
  providerDocument: string;
  providerMunicipalRegistration?: string;
  provider: NfsProviderCredentialsDto;
}

/**
 * Nota da consulta por período. Identidade igual a `NfsIssuedNoteDto`; o restante vem do `CompNfse`
 * quando o XML traz, senão `null` — a página não falha por campo ausente.
 */
export class NfsIssuedNoteListingDto {
  @ApiProperty({ example: 41 })
  rpsNumber: number;

  @ApiProperty({ example: 'NFSE' })
  rpsSeries: string;

  @ApiProperty({ example: '9041' })
  nfseNumber: string;

  @ApiProperty({ example: 'ABC123' })
  verificationCode: string;

  @ApiProperty({ example: '2026-09-03T10:00:00' })
  issueDate: string;

  @ApiProperty({ example: '2026-09-01', nullable: true })
  competence: string | null;

  @ApiProperty({ example: '12345678000199', nullable: true })
  takerDocument: string | null;

  @ApiProperty({ example: 'Cliente Exemplo LTDA', nullable: true })
  takerName: string | null;

  @ApiProperty({ example: 1500.5, nullable: true })
  servicesValue: number | null;

  @ApiProperty({ example: 1425.48, nullable: true })
  netValue: number | null;

  @ApiProperty({ example: 'Manutenção predial mensal', nullable: true })
  description: string | null;

  @ApiProperty({ example: false })
  canceled: boolean;

  @ApiProperty({ example: '2026-09-10T12:00:00', nullable: true })
  cancellationDate: string | null;

  @ApiProperty({ example: '2', nullable: true })
  cancellationReasonCode: string | null;
}

export class ListIssuedNfsOutputDto {
  notes: NfsIssuedNoteListingDto[];
  /**
   * O provedor sinaliza o fim da paginação com erro (`E212`), não com lista vazia. Sem este flag um
   * laço de paginação ou quebra na última página ou gira para sempre.
   */
  endOfPages: boolean;
  errors?: NfsBatchErrorDto[];
}
