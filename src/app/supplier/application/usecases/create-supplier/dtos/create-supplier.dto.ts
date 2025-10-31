import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class CreateSupplierInputDto {
  @ApiProperty({ description: 'CNPJ do fornecedor', example: '11.222.333/0001-44' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  cnpj: string;

  @ApiProperty({ description: 'Inscrição Estadual', example: '123.456.789.110' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  ie: string;

  @ApiProperty({ description: 'Grupo do fornecedor', example: 'Matéria Prima' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  group: string;

  @ApiProperty({ description: 'Tipo de fornecedor', example: 'Nacional' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  type: string;

  @ApiProperty({ description: 'Razão Social', example: 'Fornecedor XYZ Ltda.' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  companyName: string;

  @ApiProperty({ description: 'Nome Fantasia', example: 'Fornecedor XYZ' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  fantasyName: string;

  @ApiProperty({ description: 'Nome do Representante (Representative)', example: 'Carlos Silva' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo $constraint1 caracteres' })
  @Trim()
  representative: string;
}

export class CreateSupplierOutputDto {
  @ApiProperty({ description: 'ID do fornecedor criado (é o mesmo ID do Owner)', example: 'uuid-aqui' })
  id: string;
}
