import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateClientAttachmentInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  @Trim()
  clientId: number;

  @ApiProperty({ example: 'Descrição do anexo' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  description: string;

  @ApiPropertyOptional({ example: 'https://example.com/file.pdf', description: 'URL do anexo já existente na nuvem. Se informado, o upload de arquivo é ignorado.' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  link?: string;
}

export class CreateClientAttachmentOutputDto {
  id: number;
}
