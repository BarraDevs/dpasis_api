import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';

export class CancelNfmInputDto {
  @ApiProperty({ example: 2, description: '1=Erro na emissão 2=Serviço não prestado 4=Duplicidade da nota' })
  @IsIn([1, 2, 4], { message: '$property deve ser 1, 2 ou 4 (códigos 3 e 5 são restritos à Administração Tributária)' })
  cancelReasonCode: number;
}

export class CancelNfmOutputDto {
  id: number;
  status: NfseStatus;
  canceledAt: Date;
  /** Falso quando não havia boleto vinculado ou quando o cancelamento dele falhou. */
  bankPaymentCanceled: boolean;
  /** Preenchido só quando havia boleto e o cancelamento falhou — exige tratamento manual. */
  bankPaymentError?: string;
}
