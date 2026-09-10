import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class ReissueBankPaymentByNfmIdInputDto {
  @ApiProperty({ example: 'Inter reportou FALHA_EMISSAO; reemissão autorizada pelo financeiro' })
  @IsString()
  @MinLength(5, { message: '$property deve descrever o motivo da reemissão' })
  @MaxLength(500)
  reason: string;

  @ApiProperty({ example: true, description: 'Confirmação explícita: reemitir gera uma nova cobrança no banco' })
  @IsBoolean()
  @Equals(true, { message: '$property deve ser true para confirmar a reemissão' })
  confirm: boolean;
}

export class ReissueBankPaymentByNfmIdOutputDto {
  nfseId: number;
  /** A cobrança com falha que deixou de estar vinculada. Continua no provedor, sem cobrar ninguém. */
  replacedRequestCode: string;
}
