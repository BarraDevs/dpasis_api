import { OmitType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllClientDiscountQueryDto extends OmitType(Queries, ['active']) {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que 0' })
  clientId: number;

  @IsOptional()
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser entre 1 e 12' })
  @Max(12, { message: '$property deve ser entre 1 e 12' })
  month?: number;

  @IsOptional()
  @StringToNumber()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(2020, { message: '$property deve ser maior ou igual a 2020' })
  year?: number;
}
