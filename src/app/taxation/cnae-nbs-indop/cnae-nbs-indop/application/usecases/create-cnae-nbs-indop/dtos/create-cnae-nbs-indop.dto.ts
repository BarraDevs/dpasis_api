import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';

export class CreateCnaeNbsIndopInputDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  cnaeId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  nbsId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  indopId: number;
}

export class CreateCnaeNbsIndopOutputDto {
  @ApiProperty()
  id: number;
}
