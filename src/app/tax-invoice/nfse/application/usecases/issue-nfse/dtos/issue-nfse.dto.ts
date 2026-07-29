import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { NfseStatus } from '../../../../domain/enums/nfse-status.enum';

export class IssueNfseServiceInputDto {
  @ApiProperty({ example: '01.07' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  serviceListItemCode: string;

  @ApiProperty({ example: '1.1501.30.00' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  nbsCode: string;

  @ApiProperty({ example: '050101', description: 'Código indicador da operação (IBS/CBS)' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  indopCode: string;

  @ApiPropertyOptional({ example: '000001', description: 'Código de classificação tributária IBS/CBS' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  cClassTrib?: string;

  @ApiPropertyOptional({ example: '000', description: 'CST IBS/CBS' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  ibsCbsCst?: string;

  @ApiProperty({ example: 'Desenvolvimento de sistema sob encomenda' })
  @IsString({ message: '$property deve ser uma string' })
  @MaxLength(2000, { message: '$property deve ter no máximo 2000 caracteres' })
  @Trim()
  description: string;

  @ApiProperty({ example: '3529401' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  serviceMunicipalCodeIbge: string;

  @ApiProperty({ example: 1, description: '1=Exigível 2=Não incidência 3=Isenção 4=Exportação 5=Imunidade 6=Susp. judicial 7=Susp. administrativa' })
  @IsIn([1, 2, 3, 4, 5, 6, 7], { message: '$property deve ser um código válido de exigibilidade do ISS' })
  issExigibility: number;

  @ApiProperty({ example: false })
  @IsBoolean({ message: '$property deve ser um booleano' })
  issWithheld: boolean;

  @ApiProperty({ example: 1000.00 })
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser positivo' })
  servicesValue: number;

  @ApiPropertyOptional({ example: '6209100' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  cnaeCode?: string;

  @ApiPropertyOptional({ example: '010700' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  municipalTaxCode?: string;

  @ApiPropertyOptional({ example: 50.00 })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  issValue?: number;

  @ApiPropertyOptional({ example: 0.05 })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  issRate?: number;

  @ApiPropertyOptional({ example: 1, description: '1=Tomador 2=Intermediário — quando ISS retido' })
  @IsOptional()
  @IsIn([1, 2], { message: '$property deve ser 1 (tomador) ou 2 (intermediário)' })
  issRetentionResponsible?: 1 | 2;
}

export class IssueNfseInputDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser positivo' })
  companyId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser positivo' })
  clientId: number;

  @ApiProperty({ example: false })
  @IsBoolean({ message: '$property deve ser um booleano' })
  simpleNationalOptant: boolean;

  @ApiProperty({ example: false })
  @IsBoolean({ message: '$property deve ser um booleano' })
  fiscalIncentive: boolean;

  @ApiPropertyOptional({ example: 'Referente ao contrato nº 123' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  additionalInformation?: string;

  @ApiProperty({ type: () => IssueNfseServiceInputDto })
  @ValidateNested()
  @Type(() => IssueNfseServiceInputDto)
  service: IssueNfseServiceInputDto;
}

export class IssueNfseOutputDto {
  id: number;
  status: NfseStatus;
}
