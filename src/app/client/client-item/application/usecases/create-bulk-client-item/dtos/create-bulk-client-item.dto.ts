import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateClientItemInputDto } from '../../create-client-item/dtos/create-client-item.dto';

export class CreateBulkClientItemInputDto {
  @ApiProperty({
    type: [CreateClientItemInputDto],
    description: 'Array de itens a serem criados',
  })
  @IsArray({ message: '$property deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateClientItemInputDto)
  items: CreateClientItemInputDto[];
}

export class CreateBulkClientItemSucceededDto {
  @ApiProperty({ example: 0, description: 'Índice no array de entrada' })
  index: number;

  @ApiProperty({ example: 1, description: 'ID do item criado' })
  id: number;
}

export class CreateBulkClientItemFailedDto {
  @ApiProperty({ example: 1, description: 'Índice no array de entrada' })
  index: number;

  @ApiProperty({ example: 'Cliente não encontrado', description: 'Mensagem de erro' })
  error: string;
}

export class CreateBulkClientItemOutputDto {
  @ApiProperty({ type: [CreateBulkClientItemSucceededDto] })
  succeeded: CreateBulkClientItemSucceededDto[];

  @ApiProperty({ type: [CreateBulkClientItemFailedDto] })
  failed: CreateBulkClientItemFailedDto[];
}
