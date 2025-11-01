import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class-*/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

// Este é o DTO para CADA item no array
export class CreateItemInputDto {
  @ApiProperty({ description: 'Descrição do item/serviço' })
  @IsString()
  @IsNotEmpty()
  @Trim()
  description: string;

  @ApiProperty({ description: 'Código do serviço (SKU, etc)', example: 'SKU-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Trim()
  serviceCode: string;

  @ApiProperty({ description: 'Quantidade', example: 2 })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser no mínimo 1' })
  @StringToNumber()
  quantity: number;

  @ApiProperty({ description: 'Preço unitário em centavos', example: '10000 (R$ 100,00)' })
  @IsInt({ message: 'Preço deve ser um número inteiro' })
  @Min(0, { message: 'Preço não pode ser negativo' })
  @StringToNumber()
  unitPriceInCents: number;
}

// Este é o DTO PRINCIPAL que o Controller recebe
export class CreateItemsInputDto {
  @ApiProperty({
    description: 'ID do proprietário (Owner) (seja Cliente ou Fornecedor)',
    example: 'uuid-do-owner-123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Trim()
  ownerId: string;

  @ApiProperty({
    description: 'Array de itens a serem criados',
    type: [CreateItemInputDto], // Indica que é um array do tipo acima
  })
  @IsArray()
  @ValidateNested({ each: true }) // Valida cada objeto no array
  @ArrayMinSize(1) // Deve ter pelo menos 1 item
  @Type(() => CreateItemInputDto) // Necessário para o class-validator/transformer
  items: CreateItemInputDto[];
}

// O DTO de saída pode ser simples
export class CreateItemsOutputDto {
   @ApiProperty({ description: 'Quantidade de itens criados' })
  count: number;

  @ApiProperty({ description: 'IDs dos itens criados', type: [String] })
  ids: string[];
}
