import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsPositive, IsString, Matches } from 'class-validator';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class FindGeneratedNfmsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  size?: number;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Início do período de criação da NFM (YYYY-MM-DD), no fuso de Brasília (UTC-3). Opcional e independente de dateEnd.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  dateStart?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Fim do período de criação da NFM (YYYY-MM-DD), no fuso de Brasília (UTC-3). Opcional e independente de dateStart.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  dateEnd?: string;

  @ApiPropertyOptional({
    enum: NfseStatus,
    example: NfseStatus.AWAITING_PROVIDER,
    description: 'Status da NFS-e vinculada.',
  })
  @IsOptional()
  @IsEnum(NfseStatus, { message: '$property deve ser um status de NFS-e válido' })
  @Trim()
  status?: NfseStatus;

  @ApiPropertyOptional({
    example: 2,
    description: 'Só NFS-e não terminais sem movimento há mais de N horas — o que está preso.',
  })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  stuckForHours?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Só NFS-e emitidas sem cobrança vinculada — nota emitida e cliente sem boleto.',
  })
  @IsOptional()
  @StringToBoolean()
  @IsBoolean({ message: '$property deve ser um booleano' })
  missingBankPayment?: boolean;
}
