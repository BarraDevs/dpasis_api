import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class UploadBankCertificateInputDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Arquivo PKCS#12 (.pfx). Use junto com pfxPassword.',
  })
  pfx?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Certificado PEM (.crt). Use junto com key.',
  })
  cert?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Chave privada PEM (.key). Use junto com cert.',
  })
  key?: Express.Multer.File;

  @ApiPropertyOptional({ example: 'senha-do-pfx' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  pfxPassword?: string;
}

export type UploadBankCertificateFiles = {
  pfx?: Express.Multer.File[];
  cert?: Express.Multer.File[];
  key?: Express.Multer.File[];
};
