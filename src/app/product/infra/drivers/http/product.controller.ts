import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ProductDto } from 'src/app/product/application/dtos/product.dto';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateProductInputDto, CreateProductOutputDto } from 'src/app/product/application/usecases/create-product/dtos/create-product.dto';
import { DeleteProduct } from 'src/app/product/application/usecases/delete-product/delete-product.service';
import { EditProductInputDto } from 'src/app/product/application/usecases/edit-product/dtos/edit-product.dto';
import { EditProduct } from 'src/app/product/application/usecases/edit-product/edit-product.service';
import { FindAllProductQueryDto } from 'src/app/product/application/usecases/find-all-product/dtos/find-all-product.dto';
import { FindAllProduct } from 'src/app/product/application/usecases/find-all-product/find-all-product.service';
import { FindProductById } from 'src/app/product/application/usecases/find-product-by-id/find-product-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('product')
@RequiredRoles(AccountRole.ADMIN)
export class ProductController {
  constructor(
    private readonly createProductService: CreateProduct,
    private readonly findAllProductService: FindAllProduct,
    private readonly findProductByIdService: FindProductById,
    private readonly editProductService: EditProduct,
    private readonly deleteProductService: DeleteProduct,
  ) {}

  @Post()
  @Swagger({
    tags: ['Produtos'],
    summary: 'Cria um novo produto',
    applyBadRequest: true,
    createdResponse: CreateProductOutputDto,
  })
  public create(@Body() body: CreateProductInputDto): Promise<CreateProductOutputDto> {
    return this.createProductService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Produtos'],
    summary: 'Lista produtos',
    applyBadRequest: true,
    okPaginatedResponse: ProductDto,
  })
  public findAll(@Query() queries: FindAllProductQueryDto): Promise<IPagination<ProductDto>> {
    return this.findAllProductService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Produtos'],
    summary: 'Busca produto por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ProductDto,
  })
  public findOne(@Param() params: Params): Promise<ProductDto> {
    return this.findProductByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Produtos'],
    summary: 'Edita um produto (Estoque não é alterado)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditProductInputDto): Promise<SuccessMessage> {
    return this.editProductService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Produtos'],
    summary: 'Deleta um produto',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteProductService.execute(params.id);
  }
}
