import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateAttachmentInputDto {
  @ApiProperty({
    description: 'Nome do anexo (para facilitar identificação)',
    example: 'document.pdf',
  })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  name: string | null;

  @ApiProperty({
    description: 'Link/URL completa para o anexo',
    example: 'https://example.com/files/document.pdf',
  })
  @IsUrl({}, { message: '$property deve ser uma URL válida' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  link: string;

  @ApiProperty({
    description: 'ID do proprietário ao qual este anexo pertence',
    example: 'owner-uuid-789',
  })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ownerId: string;
}

export class CreateAttachmentOutputDto {
  @ApiProperty({ description: 'ID do anexo criado', example: 'uuid-anexo-abc' })
  id: string;
}
