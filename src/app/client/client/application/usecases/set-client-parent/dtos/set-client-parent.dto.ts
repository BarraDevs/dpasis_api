import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsInt, IsPositive, ValidateIf } from 'class-validator';

export class SetClientParentInputDto {
  @ApiProperty({
    nullable: true,
    description: 'Identificador do cliente titular (pai). Informe null para remover o vínculo e tornar o cliente raiz novamente.',
    example: 1,
  })
  @IsDefined({ message: 'O campo $property é obrigatório.' })
  @ValidateIf((_o: SetClientParentInputDto, v: unknown) => v !== null)
  @IsInt({ message: 'O campo $property deve ser um número inteiro.' })
  @IsPositive({ message: 'O campo $property deve ser positivo.' })
  parentClientId: number | null;
}
