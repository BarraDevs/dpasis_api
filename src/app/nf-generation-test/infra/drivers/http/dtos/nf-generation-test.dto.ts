import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { NfEnvironment } from 'src/infra/nf-generation/enums/nf-environment.enum';
import { NfIssueFormat } from 'src/infra/nf-generation/enums/nf-issue-format.enum';
import { NfPartyType } from 'src/infra/nf-generation/enums/nf-party-type.enum';
import { NfProcessCode } from 'src/infra/nf-generation/enums/nf-process-code.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class IssueNfAddressTestDto {
  @ApiProperty({ example: '22410000' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  zipCode: string;

  @ApiProperty({ example: 'Rua Exemplo' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  street: string;

  @ApiProperty({ example: '100' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  number: string;

  @ApiPropertyOptional({ example: 'Sala 1' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  neighborhood: string;

  @ApiProperty({ example: 'Rio de Janeiro' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  city: string;

  @ApiProperty({ example: 'RJ' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  state: string;

  @ApiProperty({ example: '3304557' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cityCode: string;

  @ApiPropertyOptional({ example: '1058' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  countryCode?: string;
}

export class IssueNfPartyTestDto {
  @ApiProperty({ example: '28695096000179' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  document: string;

  @ApiProperty({ enum: NfPartyType, example: NfPartyType.PJ })
  @IsEnum(NfPartyType, { message: '$property deve ser PJ ou PF' })
  type: NfPartyType;

  @ApiPropertyOptional({ example: '78714867' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  ie?: string;

  @ApiProperty({ example: 'Empresa Exemplo LTDA' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  companyName: string;

  @ApiPropertyOptional({ example: 'Empresa Exemplo' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  fantasyName?: string;

  @ApiPropertyOptional({ example: 'contato@empresa.com.br' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  email?: string;

  @ApiPropertyOptional({ example: '21999999999' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  phone?: string;

  @ApiProperty({ type: IssueNfAddressTestDto })
  @ValidateNested()
  @Type(() => IssueNfAddressTestDto)
  address: IssueNfAddressTestDto;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  crt?: number;

  @ApiPropertyOptional({ example: '12345678', description: 'Inscrição municipal (obrigatória para NFS-e)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  municipalRegistration?: string;
}

export class IssueNfItemTaxationTestDto {
  @ApiProperty({ example: '6201500' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cnaeCode: string;

  @ApiProperty({ example: '123456789' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  nbsCode: string;

  @ApiProperty({ example: '1' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  indopCode: string;

  @ApiPropertyOptional({ example: '01.04', description: 'Item da lista de serviço LC 116 (obrigatório para NFS-e)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  serviceListItem?: string;
}

export class IssueNfItemFiscalTestDto {
  @ApiProperty({ example: '5102' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cfop: string;

  @ApiProperty({ example: '84439199' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  ncm: string;

  @ApiProperty({ example: '102' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cstIcms: string;

  @ApiProperty({ example: '07' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cstPis: string;

  @ApiProperty({ example: '07' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cstCofins: string;

  @ApiProperty({ example: 18 })
  @IsNumber({}, { message: '$property deve ser um número' })
  icmsRate: number;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  icmsBase: number;

  @ApiProperty({ example: 0.18 })
  @IsNumber({}, { message: '$property deve ser um número' })
  icmsValue: number;

  @ApiProperty({ example: 0 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  origin: number;
}

export class IssueNfItemIbsCbsTestDto {
  @ApiProperty({ example: '000' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cst: string;

  @ApiProperty({ example: '000001' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  cClassTrib: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  baseValue: number;

  @ApiProperty({ example: 0.1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  ibsStateRate: number;

  @ApiProperty({ example: 0 })
  @IsNumber({}, { message: '$property deve ser um número' })
  ibsStateValue: number;

  @ApiProperty({ example: 0 })
  @IsNumber({}, { message: '$property deve ser um número' })
  ibsCityRate: number;

  @ApiProperty({ example: 0 })
  @IsNumber({}, { message: '$property deve ser um número' })
  ibsCityValue: number;

  @ApiProperty({ example: 0 })
  @IsNumber({}, { message: '$property deve ser um número' })
  ibsTotalValue: number;

  @ApiProperty({ example: 0.9 })
  @IsNumber({}, { message: '$property deve ser um número' })
  cbsRate: number;

  @ApiProperty({ example: 0.1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  cbsValue: number;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  itemTotalValue: number;
}

export class IssueNfItemTestDto {
  @ApiProperty({ example: 'Servico de suporte mensal' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  quantity: number;

  @ApiProperty({ example: 10000, description: 'Valor unitário em centavos' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  unitValueInCents: number;

  @ApiProperty({ type: IssueNfItemTaxationTestDto })
  @ValidateNested()
  @Type(() => IssueNfItemTaxationTestDto)
  taxation: IssueNfItemTaxationTestDto;

  @ApiProperty({ type: IssueNfItemFiscalTestDto })
  @ValidateNested()
  @Type(() => IssueNfItemFiscalTestDto)
  fiscal: IssueNfItemFiscalTestDto;

  @ApiProperty({ type: IssueNfItemIbsCbsTestDto })
  @ValidateNested()
  @Type(() => IssueNfItemIbsCbsTestDto)
  ibsCbs: IssueNfItemIbsCbsTestDto;
}

export class IssueNfFiscalComplementTestDto {
  @ApiProperty({ enum: NfEnvironment, example: NfEnvironment.HOMOLOGATION })
  @IsEnum(NfEnvironment, { message: '$property deve ser 1 (Produção) ou 2 (Homologação)' })
  environment: NfEnvironment;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  series: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  nfeNumber?: number;

  @ApiProperty({ example: 'VENDA' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  naturezaOperacao: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  operationType: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  finalidade: number;

  @ApiProperty({ example: 9 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  presenceIndicator: number;

  @ApiProperty({ example: 0 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  intermediaryIndicator: number;

  @ApiProperty({ example: '99' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  paymentMethod: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: '$property deve ser um número' })
  paymentValue: number;

  @ApiProperty({ example: 9 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  freightMode: number;

  @ApiPropertyOptional({ example: 'Referente ao contrato mensal' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  additionalInfo?: string;

  @ApiPropertyOptional({ example: 'PED-123' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  orderReference?: string;

  @ApiPropertyOptional({ example: '010701', description: 'Código de tributação municipal (NFS-e)' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  municipalTaxCode?: string;

  @ApiPropertyOptional({ example: 5, description: 'Alíquota ISS em percentual (NFS-e)' })
  @IsOptional()
  @IsNumber({}, { message: '$property deve ser um número' })
  issRate?: number;

  @ApiPropertyOptional({ example: 2, description: 'ISS retido: 1=Sim, 2=Não (NFS-e)' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  issWithheld?: number;

  @ApiPropertyOptional({ example: 1, description: 'Optante Simples Nacional: 1=Sim, 2=Não (NFS-e)' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  simpleNationalOptant?: number;

  @ApiPropertyOptional({ example: 2, description: 'Incentivo fiscal: 1=Sim, 2=Não (NFS-e)' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  fiscalIncentive?: number;

  @ApiPropertyOptional({ example: 1, description: 'Exigibilidade ISS: 1-7 conforme ABRASF (NFS-e)' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  issExigibility?: number;
}

export class IssueNfTestInputDto {
  @ApiProperty({ enum: NfIssueFormat, example: NfIssueFormat.SEFAZ_TXT })
  @IsEnum(NfIssueFormat, { message: '$property deve ser SEFAZ_TXT, NFE_XML ou RPS_XML' })
  format: NfIssueFormat;

  @ApiPropertyOptional({ example: 'PED-123' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  orderNumber?: string;

  @ApiProperty({ type: IssueNfPartyTestDto })
  @ValidateNested()
  @Type(() => IssueNfPartyTestDto)
  emitter: IssueNfPartyTestDto;

  @ApiProperty({ type: IssueNfPartyTestDto })
  @ValidateNested()
  @Type(() => IssueNfPartyTestDto)
  recipient: IssueNfPartyTestDto;

  @ApiProperty({ type: [IssueNfItemTestDto] })
  @IsArray({ message: '$property deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => IssueNfItemTestDto)
  items: IssueNfItemTestDto[];

  @ApiProperty({ type: IssueNfFiscalComplementTestDto })
  @ValidateNested()
  @Type(() => IssueNfFiscalComplementTestDto)
  fiscal: IssueNfFiscalComplementTestDto;
}

export class CancelNfTestInputDto {
  @ApiProperty({ example: 42 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  externalId: number;

  @ApiProperty({ example: 'Cancelamento por erro de emissao' })
  @IsString({ message: '$property deve ser um texto' })
  @MinLength(15, { message: '$property deve ter no mínimo 15 caracteres' })
  @Trim()
  reason: string;
}

export class FindAllNfTestQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 'PED-123' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  orderNumber?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  nfeNumber?: number;

  @ApiPropertyOptional({ example: '98765432000111' })
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  @Trim()
  recipientDocument?: string;

  @ApiPropertyOptional({ enum: NfProcessCode, example: NfProcessCode.AUTHORIZED, description: 'Código de situação (status) no NFeMail' })
  @IsOptional()
  @IsEnum(NfProcessCode, { message: '$property deve ser um código de situação válido' })
  @StringToNumber()
  processCode?: NfProcessCode;
}

export class AccessKeyQueryDto {
  @ApiProperty({ example: '35260112345678000199550010000001001000000010' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  accessKey: string;
}
