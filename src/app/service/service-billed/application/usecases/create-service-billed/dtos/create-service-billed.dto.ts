import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { StringToBoolean } from 'src/infra/validators/class/decorators/string-boolean/string-boolean';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateServiceBilledInputDto {
  @ApiProperty({ example: 'Descrição do serviço faturado' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  description: string;

  @ApiProperty({ example: false })
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  isJunction: boolean;

  @ApiProperty({ example: [5, 15, 25] })
  @IsArray({ message: '$property deve ser um array' })
  @IsInt({ each: true, message: 'Cada elemento de $property deve ser um número inteiro' })
  @Min(0, { each: true, message: 'Cada elemento de $property deve ser maior ou igual a 0' })
  installmentDays: number[];
}

export class CreateServiceBilledOutputDto {
  id: number;
}
