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

  @ApiProperty({ example: '112731375' })
  @IsString({ message: '$property deve ser uma string' })
  @Trim()
  nbsCode: string;

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
