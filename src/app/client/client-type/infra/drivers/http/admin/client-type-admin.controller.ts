import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientTypeDto } from 'src/app/client/client-type/application/dtos/client-type.dto';
import { CreateClientType } from 'src/app/client/client-type/application/usecases/create-client-type/create-client-type.service';
import { CreateClientTypeInputDto, CreateClientTypeOutputDto } from 'src/app/client/client-type/application/usecases/create-client-type/dtos/create-client-type.dto';
import { DeleteClientType } from 'src/app/client/client-type/application/usecases/delete-client-type/delete-client-type.service';
import { EditClientTypeInputDto } from 'src/app/client/client-type/application/usecases/edit-client-type/dtos/edit-client-type.dto';
import { EditClientType } from 'src/app/client/client-type/application/usecases/edit-client-type/edit-client-type.service';
import { FindAllClientTypeQueryDto } from 'src/app/client/client-type/application/usecases/find-all-client-type/dtos/find-all-client-type.dto';
import { FindAllClientType } from 'src/app/client/client-type/application/usecases/find-all-client-type/find-all-client-type.service';
import { FindClientTypeById } from 'src/app/client/client-type/application/usecases/find-client-type-by-id/find-client-type-by-id.service';
import { UpdateClientTypeStatus } from 'src/app/client/client-type/application/usecases/update-client-type-status/update-client-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-type')
@RequiredRoles(AccountRole.ADMIN)
export class ClientTypeAdminController {
  constructor(
    private readonly createClientType: CreateClientType,
    private readonly findAllClientType: FindAllClientType,
    private readonly findClientTypeById: FindClientTypeById,
    private readonly editClientType: EditClientType,
    private readonly updateClientTypeStatus: UpdateClientTypeStatus,
    private readonly deleteClientType: DeleteClientType,
  ) {}

  @Post()
  @Swagger({
    tags: ['Tipos de Cliente'],
    summary: 'Criar novo tipo de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientTypeOutputDto,
  })
  public create(@Body() body: CreateClientTypeInputDto): Promise<CreateClientTypeOutputDto> {
    return this.createClientType.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Tipos de Cliente'],
    summary: 'Listar tipos de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientTypeDto,
  })
  public findAll(@Query() queries: FindAllClientTypeQueryDto): Promise<IPagination<ClientTypeDto>> {
    return this.findAllClientType.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Tipos de Cliente'],
    summary: 'Buscar tipo de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientTypeDto,
  })
  public findOne(@Param() params: Params): Promise<ClientTypeDto> {
    return this.findClientTypeById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Tipos de Cliente'],
    summary: 'Inverter status ativo do tipo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientTypeStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Tipos de Cliente'],
    summary: 'Editar tipo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientTypeInputDto): Promise<SuccessMessage> {
    return this.editClientType.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Tipos de Cliente'],
    summary: 'Deletar tipo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientType.execute(params.id);
  }
}
