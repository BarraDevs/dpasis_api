import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Matches } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class FindAllNfmsQueryDto {
  @ApiProperty({ example: 1, description: 'ID da empresa prestadora (credenciais Giss)' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  companyId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Início do período de emissão (YYYY-MM-DD). Obrigatório junto com dateTo quando nfseNumber não for enviado.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Fim do período de emissão (YYYY-MM-DD). Obrigatório junto com dateFrom quando nfseNumber não for enviado.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })
  @Trim()
  dateTo?: string;

  @ApiPropertyOptional({
    example: '1000',
    description: 'Número da NFS-e. Exclusivo com dateFrom/dateTo.',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  nfseNumber?: string;

  @ApiPropertyOptional({
    example: '98765432000111',
    description: 'CPF/CNPJ do tomador (filtro opcional)',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  recipientDocument?: string;
}
