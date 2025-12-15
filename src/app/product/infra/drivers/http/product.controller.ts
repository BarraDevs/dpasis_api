import { Body, Controller, Post } from '@nestjs/common';
import { CreateProduct } from 'src/app/product/application/usecases/create-product/create-product.service';
import { CreateProductInputDto, CreateProductOutputDto } from 'src/app/product/application/usecases/create-product/dtos/create-product.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('product')
export class ProductController {
  constructor(
    private readonly createProductService: CreateProduct,
    // private readonly findAllProductService: FindAllProduct,
    // private readonly findProductByIdService: FindProductById,
    // private readonly editProductService: EditProduct,
    // private readonly deleteProductService: DeleteProduct,
  ) {}

  @Post()
  @Swagger({
    tags: ['TAG_AQUI'],
    summary: 'Rota para criar NOME_AQUI',
    applyBadRequest: true,
    createdResponse: CreateProductOutputDto,
  })
  public create(@Body() body: CreateProductInputDto): Promise<CreateProductOutputDto> {
    return this.createProductService.execute(body);
  }

//  @Get()
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para listar NOME_AQUI',
//    applyBadRequest: true,
//    okPaginatedResponse: ProductDto,
//  })
//  public findAll(@Query() queries: FindAllProductQueryDto): Promise<IPagination<ProductDto>> {
//    return this.findAllProductService.execute(queries);
//  }
//
//  @Get(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para buscar NOME_AQUI por ID',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: ProductDto,
//  })
//  public findOne(@Param() params: Params): Promise<ProductDto> {
//    return this.findProductByIdService.execute(params.id);
//  }
//
//  @Patch(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para editar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public update(@Param() params: Params, @Body() body: EditProductInputDto): Promise<SuccessMessage> {
//    return this.editProductService.execute(params.id, body);
//  }
//
//  @Delete(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para deletar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public remove(@Param() params: Params): Promise<SuccessMessage> {
//    return this.deleteProductService.execute(params.id);
//  }
}
