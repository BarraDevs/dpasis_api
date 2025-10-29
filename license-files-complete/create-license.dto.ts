TypeScript

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';
import { StringToNumber } from 'src/infra/validators/class-*/decorators/string-number/string-number';

export class CreateLicenseInputDto {
  @ApiProperty({
    description: 'Dia do mês para pagamento (ex: 5, 10, 20)',
    example: 10,
  })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @Min(1, { message: '$property deve ser no mínimo 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  paymentDay: number;

  @ApiProperty({
    description: 'Valor do bônus em centavos',
    example: 5000, // R$ 50,00
  })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  bonusInCents: number;

  @ApiProperty({
    description: 'Data de início da cobrança (Formato YYYY-MM-DD)',
    example: '2025-10-30',
  })
  @IsDateString({}, { message: '$property deve ser uma data válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  billingStartDate: Date;

  @ApiProperty({
    description: 'Conteúdo da licença (geralmente um JSON ou texto)',
    example: '{"modules": ["finance", "inventory"]}',
  })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  license: string;
}

export class CreateLicenseOutputDto {
  @ApiProperty({ description: 'ID da licença criada', example: 'uuid-aqui' })
  id: string;
}
