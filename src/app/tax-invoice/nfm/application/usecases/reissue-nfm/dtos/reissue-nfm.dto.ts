import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';

export class ReissueNfmInputDto {
  @ApiProperty({ example: 'CNPJ do tomador corrigido no cadastro após rejeição E163' })
  @IsString()
  @MinLength(5, { message: '$property deve descrever o motivo da reemissão' })
  @MaxLength(500)
  reason: string;

  @ApiProperty({ example: true, description: 'Confirmação explícita: reemitir gera documento fiscal' })
  @IsBoolean()
  @Equals(true, { message: '$property deve ser true para confirmar a reemissão' })
  confirm: boolean;
}

export class ReissueNfmOutputDto {
  nfseId: number;
  /** O RPS é reaproveitado; um número novo é o que duplicaria a nota. */
  rpsNumber: number;
  rpsSeries: string;
  status: NfseStatus;
}
