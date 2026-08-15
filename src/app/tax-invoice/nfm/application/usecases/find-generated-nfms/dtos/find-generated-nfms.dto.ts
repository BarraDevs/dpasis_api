import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Matches } from 'class-validator';
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
}
