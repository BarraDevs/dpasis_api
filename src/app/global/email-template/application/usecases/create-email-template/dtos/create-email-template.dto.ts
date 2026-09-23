import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateEmailTemplateInputDto {
  @ApiProperty({ example: 'Cobranca NFS-e' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  name: string;

  @ApiPropertyOptional({ example: 'E-mail com dados da NFS-e e boleto.', nullable: true })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  description?: string | null;

  @ApiProperty({ example: 'Sua NFS-e {{nfse.numero}} foi emitida' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  subject: string;

  @ApiProperty({ example: '<p>Olá {{cliente.nome}}, segue a nota {{nfse.numero}}.</p>' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(100000, { message: '$property deve ter no máximo 100000 caracteres' })
  @Trim()
  html: string;

  @ApiProperty({ example: 'p { color: #222; }' })
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(100000, { message: '$property deve ter no máximo 100000 caracteres' })
  @Trim()
  css: string;
}

export class CreateEmailTemplateOutputDto {
  id: number;
}
