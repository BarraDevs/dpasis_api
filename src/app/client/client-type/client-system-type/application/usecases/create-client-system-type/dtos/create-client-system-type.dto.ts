import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientSystemTypeInputDto {
  @ApiProperty({ example: 'Sistema ERP' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png', description: 'URL da imagem. Se informado, o upload de arquivo é ignorado.' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(2048, { message: '$property deve ter no máximo 2048 caracteres' })
  @Trim()
  imageUrl?: string;
}

export class CreateClientSystemTypeOutputDto {
  id: number;
}
