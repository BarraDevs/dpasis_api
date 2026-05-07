import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class LookupClientDocumentAndCnpjInputDto {
  @ApiProperty({ example: '09.748.165/0001-10' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  document: string;
}

export class CnpjLookupAddressDto {
  @ApiProperty({ example: '01310-100' })
  zipCode: string;

  @ApiProperty({ example: 'Av. Paulista' })
  street: string;

  @ApiProperty({ example: '1000' })
  number: string;

  @ApiPropertyOptional({ example: 'Sala 1', nullable: true })
  complement: string | null;

  @ApiProperty({ example: 'Bela Vista' })
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'SP' })
  state: string;
}

export class CnpjLookupDataDto {
  @ApiProperty({ example: 'Fantasia LTDA' })
  fantasyName: string;

  @ApiProperty({ example: 'Empresa LTDA' })
  companyName: string;

  @ApiProperty({ type: CnpjLookupAddressDto })
  address: CnpjLookupAddressDto;
}

export class LookupClientDocumentAndCnpjOutputDto {
  @ApiProperty({
    example: true,
    description: '`true` quando já existe cliente com o documento normalizado.',
  })
  documentInUse: boolean;

  @ApiPropertyOptional({
    type: CnpjLookupDataDto,
    description: 'Dados da Receita quando o lookup teve sucesso; `null` se falhou.',
    nullable: true,
  })
  cnpjLookup: CnpjLookupDataDto | null;

  @ApiPropertyOptional({
    example: 'Falha ao consultar CNPJ',
    description: 'Mensagem quando o lookup externo falhou; `null` em caso de sucesso.',
    nullable: true,
  })
  cnpjErrorMessage: string | null;
}
