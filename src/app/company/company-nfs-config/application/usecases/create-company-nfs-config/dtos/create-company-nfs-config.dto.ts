import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsPositive, IsString, MaxLength } from 'class-validator';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateCompanyNfsConfigInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  companyId: number;

  @ApiProperty({ example: 'giss' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  vendor: string;

  @ApiProperty({ example: '12345' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  municipalRegistration: string;

  @ApiProperty({ example: '3529401' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(7, { message: '$property deve ter no máximo 7 caracteres' })
  @Trim()
  municipalCodeIbge: string;

  @ApiProperty({ example: 'NFSE' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  serieRps: string;

  @ApiProperty({ example: NfsProviderEnvironment.Demonstration, enum: NfsProviderEnvironment })
  @IsEnum(NfsProviderEnvironment, { message: '$property deve ser um valor válido' })
  environment: NfsProviderEnvironment;

  @ApiProperty({ example: '/certs/empresa.pfx' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(2048, { message: '$property deve ter no máximo 2048 caracteres' })
  @Trim()
  certFilePath: string;

  @ApiProperty({ example: 'COMPANY_CERT_PASSWORD' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(255, { message: '$property deve ter no máximo 255 caracteres' })
  @Trim()
  certPasswordEnvVar: string;

  @ApiProperty({ example: { municipioSlug: 'demonstracao' } })
  @IsObject({ message: '$property deve ser um objeto' })
  vendorConfig: Record<string, unknown>;
}

export class CreateCompanyNfsConfigOutputDto {
  id: number;
}
