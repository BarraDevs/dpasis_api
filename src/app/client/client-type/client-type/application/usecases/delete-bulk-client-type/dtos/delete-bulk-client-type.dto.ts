import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class DeleteBulkClientTypeInputDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'Array de IDs dos tipos de cliente a serem excluídos',
  })
  @IsArray({ message: '$property deve ser um array' })
  @IsInt({ each: true, message: 'Cada ID deve ser um número inteiro' })
  ids: number[];
}

export class DeleteBulkClientTypeSucceededDto {
  @ApiProperty({ example: 0, description: 'Índice no array de entrada' })
  index: number;

  @ApiProperty({ example: 1, description: 'ID do tipo de cliente excluído' })
  id: number;
}

export class DeleteBulkClientTypeFailedDto {
  @ApiProperty({ example: 1, description: 'Índice no array de entrada' })
  index: number;

  @ApiProperty({ example: 'Tipo de cliente não encontrado', description: 'Mensagem de erro' })
  error: string;
}

export class DeleteBulkClientTypeOutputDto {
  @ApiProperty({ type: [DeleteBulkClientTypeSucceededDto] })
  succeeded: DeleteBulkClientTypeSucceededDto[];

  @ApiProperty({ type: [DeleteBulkClientTypeFailedDto] })
  failed: DeleteBulkClientTypeFailedDto[];
}
