import { Body, Controller, Post } from '@nestjs/common';
import { CreateItem } from 'src/app/item/application/usecases/create-item/create-item.service';
import { CreateItemInputDto, CreateItemOutputDto } from 'src/app/item/application/usecases/create-item/dtos/create-item.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('item')
export class ItemController {
  constructor(
    private readonly createItemService: CreateItem,
    // private readonly findAllItemService: FindAllItem,
    // private readonly findItemByIdService: FindItemById,
    // private readonly editItemService: EditItem,
    // private readonly deleteItemService: DeleteItem,
  ) {}

  @Post()
  @Swagger({
    tags: ['TAG_AQUI'],
    summary: 'Rota para criar NOME_AQUI',
    applyBadRequest: true,
    createdResponse: CreateItemOutputDto,
  })
  public create(@Body() body: CreateItemInputDto): Promise<CreateItemOutputDto> {
    return this.createItemService.execute(body);
  }

//  @Get()
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para listar NOME_AQUI',
//    applyBadRequest: true,
//    okPaginatedResponse: ItemDto,
//  })
//  public findAll(@Query() queries: FindAllItemQueryDto): Promise<IPagination<ItemDto>> {
//    return this.findAllItemService.execute(queries);
//  }
//
//  @Get(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para buscar NOME_AQUI por ID',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: ItemDto,
//  })
//  public findOne(@Param() params: Params): Promise<ItemDto> {
//    return this.findItemByIdService.execute(params.id);
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
//  public update(@Param() params: Params, @Body() body: EditItemInputDto): Promise<SuccessMessage> {
//    return this.editItemService.execute(params.id, body);
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
//    return this.deleteItemService.execute(params.id);
//  }
}
