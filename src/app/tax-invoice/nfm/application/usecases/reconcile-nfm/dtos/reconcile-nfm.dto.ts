import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ReconcileNfseSource } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/dtos/reconcile-nfse.dto';

export class ReconcileNfmInputDto {
  @ApiProperty({ example: 'Nota parada em AWAITING_PROVIDER desde o incidente de 03/09' })
  @IsString()
  @MinLength(5, { message: '$property deve descrever o motivo da reconciliação' })
  @MaxLength(500)
  reason: string;
}

export class ReconcileNfmOutputDto {
  nfseId: number;
  previousStatus: NfseStatus;
  newStatus: NfseStatus;
  source: ReconcileNfseSource;
  nfseNumber?: string;
  message?: string;
}
