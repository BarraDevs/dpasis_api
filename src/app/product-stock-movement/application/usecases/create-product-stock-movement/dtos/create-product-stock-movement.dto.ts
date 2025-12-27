import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ProductStockMovementTypeEnum } from 'src/app/product-stock-movement/domain/enums/product-stock-movement.enum';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateProductStockMovementInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  productId: string;

  @IsEnum(ProductStockMovementTypeEnum)
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  type: ProductStockMovementTypeEnum;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(1, { message: '$property deve ser maior que zero' })
  @StringToNumber()
  quantity: number;

  @IsInt({ message: '$property deve ser um número inteiro' })
  @Min(0, { message: '$property deve ser maior ou igual a zero' })
  @StringToNumber()
  unitPriceInCents: number;
}

export class CreateProductStockMovementOutputDto {
  id: string;
}
