import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, Max, Min, ValidateIf } from 'class-validator';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { CreateProviderInputDto } from '../../create-provider/dtos/create-provider.dto';

export class EditProviderInputDto extends PartialType(CreateProviderInputDto, {
  skipNullProperties: false,
}) {
  @ValidateIf((o) => o.type === ProviderType.RECURRING)
  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior ou igual a $constraint1' })
  @Max(31, { message: '$property deve ser menor ou igual a $constraint1' })
  @IsNotEmpty({ message: '$property é obrigatório quando type é RECURRING' })
  paymentDay: number | null;

  @ValidateIf((o) => o.type === ProviderType.ONE_TIME)
  @IsDate({ message: '$property deve ser uma data válida' })
  @Type(() => Date)
  @IsNotEmpty({ message: '$property é obrigatório quando type é ONE_TIME' })
  paymentExpirationDate: Date | null;
}
