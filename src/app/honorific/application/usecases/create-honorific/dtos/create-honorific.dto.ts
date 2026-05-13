import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateHonorificInputDto {
  @ApiProperty({ example: 'Sr.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(64, { message: '$property deve ter no máximo 64 caracteres' })
  @Trim()
  name: string;
}

export class CreateHonorificOutputDto {
  id: number;
}
