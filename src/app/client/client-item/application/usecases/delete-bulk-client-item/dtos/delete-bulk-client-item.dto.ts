import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class DeleteBulkClientItemInputDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'Array de IDs dos itens a serem excluídos',
  })
  @IsArray({ message: '$property deve ser um array' })
  @IsInt({ each: true, message: 'Cada ID deve ser um número inteiro' })
  ids: number[];
}

export class DeleteBulkClientItemSucceededDto {
  @ApiProperty({ example: 0, description: 'Índice no array de entrada' })
  index: number;

  @ApiProperty({ example: 1, description: 'ID do item excluído' })
  id: number;
}

export class DeleteBulkClientItemFailedDto {
  @ApiProperty({ example: 1, description: 'Índice no array de entrada' })
  index: number;

  @ApiProperty({ example: 'Item do cliente não encontrado', description: 'Mensagem de erro' })
  error: string;
}

export class DeleteBulkClientItemOutputDto {
  @ApiProperty({ type: [DeleteBulkClientItemSucceededDto] })
  succeeded: DeleteBulkClientItemSucceededDto[];

  @ApiProperty({ type: [DeleteBulkClientItemFailedDto] })
  failed: DeleteBulkClientItemFailedDto[];
}
