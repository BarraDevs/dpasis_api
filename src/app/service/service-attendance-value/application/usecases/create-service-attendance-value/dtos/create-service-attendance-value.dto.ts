import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsObject, Min } from 'class-validator';

export class CreateServiceAttendanceValueInputDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  serviceId: number;

  @ApiProperty({
    example: { maoDeObra: 10000, deslocamento: 5000 },
    type: 'object',
    additionalProperties: { type: 'integer', minimum: 1 },
  })
  @IsObject({ message: '$property deve ser um objeto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  values: Record<string, number>;
}

export class CreateServiceAttendanceValueOutputDto {
  id: number;
}
