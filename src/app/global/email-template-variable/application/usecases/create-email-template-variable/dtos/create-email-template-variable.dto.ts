import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateEmailTemplateVariableInputDto {
  @ApiProperty({ example: 'nfse.numero' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(128, { message: '$property deve ter no máximo 128 caracteres' })
  @Matches(/^[A-Za-z][A-Za-z0-9_.]{0,127}$/, {
    message: '$property deve começar com letra e conter apenas letras, números, ponto ou sublinhado',
  })
  @Trim()
  key: string;

  @ApiProperty({ example: 'Número da NFS-e' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  label: string;

  @ApiPropertyOptional({ example: '123', nullable: true })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(1024, { message: '$property deve ter no máximo 1024 caracteres' })
  @Trim()
  example?: string | null;

  @ApiPropertyOptional({ example: 'Número atribuído à nota após a autorização.', nullable: true })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  description?: string | null;
}

export class CreateEmailTemplateVariableOutputDto {
  id: number;
}
