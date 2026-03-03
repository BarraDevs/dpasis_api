import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { CreateBulkClientItem } from 'src/app/client/client-item/application/usecases/create-bulk-client-item/create-bulk-client-item.service';
import {
  CreateBulkClientItemInputDto,
  CreateBulkClientItemOutputDto,
} from 'src/app/client/client-item/application/usecases/create-bulk-client-item/dtos/create-bulk-client-item.dto';
import { CreateClientItem } from 'src/app/client/client-item/application/usecases/create-client-item/create-client-item.service';
import {
  CreateClientItemInputDto,
  CreateClientItemOutputDto,
} from 'src/app/client/client-item/application/usecases/create-client-item/dtos/create-client-item.dto';
import { DeleteBulkClientItem } from 'src/app/client/client-item/application/usecases/delete-bulk-client-item/delete-bulk-client-item.service';
import {
  DeleteBulkClientItemInputDto,
  DeleteBulkClientItemOutputDto,
} from 'src/app/client/client-item/application/usecases/delete-bulk-client-item/dtos/delete-bulk-client-item.dto';
import { DeleteClientItem } from 'src/app/client/client-item/application/usecases/delete-client-item/delete-client-item.service';
import { EditClientItemInputDto } from 'src/app/client/client-item/application/usecases/edit-client-item/dtos/edit-client-item.dto';
import { EditClientItem } from 'src/app/client/client-item/application/usecases/edit-client-item/edit-client-item.service';
import { FindAllClientItemQueryDto } from 'src/app/client/client-item/application/usecases/find-all-client-item/dtos/find-all-client-item.dto';
import { FindAllClientItem } from 'src/app/client/client-item/application/usecases/find-all-client-item/find-all-client-item.service';
import { FindClientItemById } from 'src/app/client/client-item/application/usecases/find-client-item-by-id/find-client-item-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-item')
@RequiredRoles(AccountRole.ADMIN)
export class ClientItemAdminController {
  constructor(
    private readonly createClientItem: CreateClientItem,
    private readonly createBulkClientItem: CreateBulkClientItem,
    private readonly findAllClientItem: FindAllClientItem,
    private readonly findClientItemById: FindClientItemById,
    private readonly editClientItem: EditClientItem,
    private readonly deleteClientItem: DeleteClientItem,
    private readonly deleteBulkClientItem: DeleteBulkClientItem,
  ) {}

  @Post()
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Criar novo item do cliente',
    applyBadRequest: true,
    createdResponse: CreateClientItemOutputDto,
  })
  public create(
    @Body() body: CreateClientItemInputDto,
  ): Promise<CreateClientItemOutputDto> {
    return this.createClientItem.execute(body);
  }

  @Post('bulk')
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Criar múltiplos itens do cliente',
    applyBadRequest: true,
    createdResponse: CreateBulkClientItemOutputDto,
  })
  public createBulk(@Body() body: CreateBulkClientItemInputDto): Promise<CreateBulkClientItemOutputDto> {
    return this.createBulkClientItem.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Listar itens do cliente com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ClientItemDto,
  })
  public findAll(@Query() queries: FindAllClientItemQueryDto): Promise<IPagination<ClientItemDto>> {
    return this.findAllClientItem.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Buscar item do cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientItemDto,
  })
  public findOne(@Param() params: Params): Promise<ClientItemDto> {
    return this.findClientItemById.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Editar item do cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientItemInputDto): Promise<SuccessMessage> {
    return this.editClientItem.execute(params.id, body);
  }

  @Delete('bulk')
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Deletar múltiplos itens do cliente',
    applyBadRequest: true,
    okResponse: DeleteBulkClientItemOutputDto,
  })
  public removeBulk(@Body() body: DeleteBulkClientItemInputDto): Promise<DeleteBulkClientItemOutputDto> {
    return this.deleteBulkClientItem.execute(body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Itens do Cliente'],
    summary: 'Deletar item do cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientItem.execute(params.id);
  }
}
