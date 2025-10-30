import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class-*/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateLicenseInputDto {
  @ApiProperty({
    description: 'Dia do mês para pagamento (ex: 5, 10, 20)',
    example: 10,
  })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @Min(1, { message: '$property deve ser no mínimo $constraint1' })
  @Max(28, { message: '$property deve ser no máximo $constraint1' })
  @StringToNumber()
  paymentDay: number;

  @ApiProperty({
    description: 'Valor do bônus em centavos',
    example: 5000, // R$ 50,00
  })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsNumber({}, { message: '$property deve ser um número' })
  @StringToNumber()
  bonusInCents: number;

  @ApiProperty({
    description: 'Data de início da cobrança (Formato YYYY-MM-DD)',
    example: '2025-10-30',
  })
  @IsDateString({ strict: true }, { message: '$property deve ser uma data válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  billingStartDate: Date;

  @ApiProperty({
    description: 'Conteúdo da licença (geralmente um JSON ou texto)',
    example: '{"modules": ["finance", "inventory"]}',
  })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  license: string;

  @ApiProperty({ description: 'ID do proprietário da licença', example: 'uuid-do-usuario' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  ownerId: string;
}

export class CreateLicenseOutputDto {
  @ApiProperty({ description: 'ID da licença criada', example: 'uuid-aqui' })
  id: string;
}
