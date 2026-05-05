import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class GenerateVoucherInputDto {
  @ApiProperty({ example: 42, description: 'Identificador numérico usado como base do código da revenda (convertido para string antes da codificação).' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um inteiro positivo' })
  id: number;
}

export class GenerateVoucherOutputDto {
  @ApiProperty({ example: 'CAPUYMOMTZTQ' })
  voucher: string;

  @ApiProperty({ example: 2025 })
  year: number;
}
