import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ItemDto } from 'src/app/item/application/dtos/item.dto';
import { CreateItems } from 'src/app/item/application/usecases/create-item/create-item.service';
import { CreateItemsInputDto, CreateItemsOutputDto } from 'src/app/item/application/usecases/create-item/dtos/create-item.dto';
import { DeleteItem } from 'src/app/item/application/usecases/delete-item/delete-item.service';
import { EditItemInputDto } from 'src/app/item/application/usecases/edit-item/dtos/edit-item.dto';
import { EditItem } from 'src/app/item/application/usecases/edit-item/edit-item.service';
import { FindAllItemQueryDto } from 'src/app/item/application/usecases/find-all-item/dtos/find-all-item.dto';
import { FindAllItem } from 'src/app/item/application/usecases/find-all-item/find-all-item.service';
import { FindItemById } from 'src/app/item/application/usecases/find-item-by-id/find-item-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('item')
@RequiredRoles(AccountRole.ADMIN)
export class ItemController {
  constructor(
    private readonly createItemsService: CreateItems,
    private readonly findAllItemService: FindAllItem,
    private readonly findItemByIdService: FindItemById,
    private readonly editItemService: EditItem,
    private readonly deleteItemService: DeleteItem,
  ) {}

  @Post()
  @Swagger({
    tags: ['Itens'],
    summary: 'Cria um ou mais itens em lote (bulk create)',
    applyBadRequest: true,
    applyNotFound: true,
    createdResponse: CreateItemsOutputDto,
  })
  public create(@Body() body: CreateItemsInputDto): Promise<CreateItemsOutputDto> {
    return this.createItemsService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Itens'],
    summary: 'Lista itens por proprietário (ownerId)',
    applyBadRequest: true,
    applyNotFound: true,
    okPaginatedResponse: ItemDto,
  })
  public findAll(@Query() queries: FindAllItemQueryDto): Promise<IPagination<ItemDto>> {
    return this.findAllItemService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Itens'],
    summary: 'Busca um item específico por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ItemDto,
  })
  public findOne(@Param() params: Params): Promise<ItemDto> {
    return this.findItemByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Itens'],
    summary: 'Edita um item específico',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditItemInputDto): Promise<SuccessMessage> {
    return this.editItemService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Itens'],
    summary: 'Deleta um item específico',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteItemService.execute(params.id);
  }
}
