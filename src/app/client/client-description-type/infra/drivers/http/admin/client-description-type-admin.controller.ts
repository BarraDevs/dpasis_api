import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDescriptionTypeDto } from 'src/app/client/client-description-type/application/dtos/client-description-type.dto';
import { CreateClientDescriptionType } from 'src/app/client/client-description-type/application/usecases/create-client-description-type/create-client-description-type.service';
import { CreateClientDescriptionTypeInputDto, CreateClientDescriptionTypeOutputDto } from 'src/app/client/client-description-type/application/usecases/create-client-description-type/dtos/create-client-description-type.dto';
import { DeleteClientDescriptionType } from 'src/app/client/client-description-type/application/usecases/delete-client-description-type/delete-client-description-type.service';
import { EditClientDescriptionTypeInputDto } from 'src/app/client/client-description-type/application/usecases/edit-client-description-type/dtos/edit-client-description-type.dto';
import { EditClientDescriptionType } from 'src/app/client/client-description-type/application/usecases/edit-client-description-type/edit-client-description-type.service';
import { FindAllClientDescriptionTypeQueryDto } from 'src/app/client/client-description-type/application/usecases/find-all-client-description-type/dtos/find-all-client-description-type.dto';
import { FindAllClientDescriptionType } from 'src/app/client/client-description-type/application/usecases/find-all-client-description-type/find-all-client-description-type.service';
import { FindClientDescriptionTypeById } from 'src/app/client/client-description-type/application/usecases/find-client-description-type-by-id/find-client-description-type-by-id.service';
import { UpdateClientDescriptionTypeStatus } from 'src/app/client/client-description-type/application/usecases/update-client-description-type-status/update-client-description-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-description-type')
@RequiredRoles(AccountRole.ADMIN)
export class ClientDescriptionTypeAdminController {
  constructor(
    private readonly createClientDescriptionType: CreateClientDescriptionType,
    private readonly findAllClientDescriptionType: FindAllClientDescriptionType,
    private readonly findClientDescriptionTypeById: FindClientDescriptionTypeById,
    private readonly editClientDescriptionType: EditClientDescriptionType,
    private readonly updateClientDescriptionTypeStatus: UpdateClientDescriptionTypeStatus,
    private readonly deleteClientDescriptionType: DeleteClientDescriptionType,
  ) {}

  @Post()
  @Swagger({
    tags: ['Tipos de Descrição de Clientes'],
    summary: 'Criar novo tipo de descrição de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientDescriptionTypeOutputDto,
  })
  public create(@Body() body: CreateClientDescriptionTypeInputDto): Promise<CreateClientDescriptionTypeOutputDto> {
    return this.createClientDescriptionType.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Tipos de Descrição de Clientes'],
    summary: 'Listar tipos de descrição de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientDescriptionTypeDto,
  })
  public findAll(@Query() queries: FindAllClientDescriptionTypeQueryDto): Promise<IPagination<ClientDescriptionTypeDto>> {
    return this.findAllClientDescriptionType.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Tipos de Descrição de Clientes'],
    summary: 'Buscar tipo de descrição de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientDescriptionTypeDto,
  })
  public findOne(@Param() params: Params): Promise<ClientDescriptionTypeDto> {
    return this.findClientDescriptionTypeById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Tipos de Descrição de Clientes'],
    summary: 'Inverter status ativo do tipo de descrição de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientDescriptionTypeStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Tipos de Descrição de Clientes'],
    summary: 'Editar tipo de descrição de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientDescriptionTypeInputDto): Promise<SuccessMessage> {
    return this.editClientDescriptionType.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Tipos de Descrição de Clientes'],
    summary: 'Deletar tipo de descrição de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientDescriptionType.execute(params.id);
  }
}
