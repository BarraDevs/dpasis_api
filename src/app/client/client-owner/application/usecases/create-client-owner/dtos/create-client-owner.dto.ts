import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientOwnerInputDto {
  @ApiProperty({ example: 'Proprietário Premium' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  name: string;
}

export class CreateClientOwnerOutputDto {
  id: number;
}
