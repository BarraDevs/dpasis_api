import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateFaqInputDto {
  @ApiProperty({ example: 'Como faço para recuperar minha senha?' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(512, { message: '$property deve ter no máximo 512 caracteres' })
  @Trim()
  question: string;

  @ApiProperty({ example: 'Clique em "Esqueci minha senha" na tela de login.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  answer: string;
}

export class CreateFaqOutputDto {
  id: number;
}
