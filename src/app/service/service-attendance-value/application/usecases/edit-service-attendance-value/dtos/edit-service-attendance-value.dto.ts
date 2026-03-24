import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class EditServiceAttendanceValueInputDto {
  @ApiProperty({
    example: { maoDeObra: 12000, deslocamento: 5000 },
    type: 'object',
    additionalProperties: { type: 'integer', minimum: 1 },
  })
  @IsObject({ message: '$property deve ser um objeto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  values: Record<string, number>;
}
