import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateNbsInputDto {
  @ApiProperty({ example: '1.01.13' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(20, { message: '$property deve ter no máximo 20 caracteres' })
  @Trim()
  code: string;

  @ApiProperty({ example: 'Licenciamento ou cessão de direito de uso de programas de computador' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(500, { message: '$property deve ter no máximo 500 caracteres' })
  @Trim()
  description: string;
}

export class CreateNbsOutputDto {
  @ApiProperty()
  id: number;
}
