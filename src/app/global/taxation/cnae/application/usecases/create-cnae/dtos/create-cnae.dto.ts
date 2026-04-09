import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateCnaeInputDto {
  @ApiProperty({ example: '6201-5/01' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  code: string;

  @ApiProperty({ example: 'Desenvolvimento de programas de computador sob encomenda' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(500, { message: '$property deve ter no máximo 500 caracteres' })
  @Trim()
  description: string;
}

export class CreateCnaeOutputDto {
  @ApiProperty()
  id: number;
}
