import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { NfProcessCode } from 'src/infra/nf-generation/enums/nf-process-code.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class FindAllNfmsQueryDto {
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
  limit?: number;

  @ApiPropertyOptional({ example: 'PED-123' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  orderNumber?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  nfeNumber?: number;

  @ApiPropertyOptional({ example: '98765432000111' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  recipientDocument?: string;

  @ApiPropertyOptional({
    enum: NfProcessCode,
    example: NfProcessCode.AUTHORIZED,
    description: 'Código de situação (status) no NFeMail',
  })
  @IsOptional()
  @IsEnum(NfProcessCode, { message: '$property deve ser um código de situação válido' })
  @StringToNumber()
  processCode?: NfProcessCode;
}
