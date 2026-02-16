import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateFaqInputDto {
  @ApiProperty({ example: 'Como faço para recuperar minha senha?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @Trim()
  question: string;

  @ApiProperty({ example: 'Clique em "Esqueci minha senha" na tela de login.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  @Trim()
  answer: string;
}

export class CreateFaqOutputDto {
  id: string;
}
