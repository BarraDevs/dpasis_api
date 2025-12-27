import { Body, Controller, Post } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CreateProductStockMovement } from 'src/app/product-stock-movement/application/usecases/create-product-stock-movement/create-product-stock-movement.service';
import { CreateProductStockMovementInputDto, CreateProductStockMovementOutputDto } from 'src/app/product-stock-movement/application/usecases/create-product-stock-movement/dtos/create-product-stock-movement.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('stock-movement')
@RequiredRoles(AccountRole.ADMIN)
export class ProductStockMovementController {
  constructor(
    private readonly createProductStockMovementService: CreateProductStockMovement,
  ) {}

  @Post()
  @Swagger({
    tags: ['Movimentação de Estoque'],
    summary: 'Registra entrada ou saída e atualiza saldo/custo do produto',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    createdResponse: CreateProductStockMovementOutputDto,
  })
  public create(@Body() body: CreateProductStockMovementInputDto): Promise<CreateProductStockMovementOutputDto> {
    return this.createProductStockMovementService.execute(body);
  }
}
