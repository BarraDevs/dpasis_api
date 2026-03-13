import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDriveTypeDto } from 'src/app/client/client-type/client-drive-type/application/dtos/client-drive-type.dto';
import { CreateClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/create-client-drive-type/create-client-drive-type.service';
import { CreateClientDriveTypeInputDto, CreateClientDriveTypeOutputDto } from 'src/app/client/client-type/client-drive-type/application/usecases/create-client-drive-type/dtos/create-client-drive-type.dto';
import { DeleteClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/delete-client-drive-type/delete-client-drive-type.service';
import { EditClientDriveTypeInputDto } from 'src/app/client/client-type/client-drive-type/application/usecases/edit-client-drive-type/dtos/edit-client-drive-type.dto';
import { EditClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/edit-client-drive-type/edit-client-drive-type.service';
import { FindAllClientDriveTypeQueryDto } from 'src/app/client/client-type/client-drive-type/application/usecases/find-all-client-drive-type/dtos/find-all-client-drive-type.dto';
import { FindAllClientDriveType } from 'src/app/client/client-type/client-drive-type/application/usecases/find-all-client-drive-type/find-all-client-drive-type.service';
import { FindClientDriveTypeById } from 'src/app/client/client-type/client-drive-type/application/usecases/find-client-drive-type-by-id/find-client-drive-type-by-id.service';
import { UpdateClientDriveTypeStatus } from 'src/app/client/client-type/client-drive-type/application/usecases/update-client-drive-type-status/update-client-drive-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-drive-type')
@RequiredRoles(AccountRole.ADMIN)
export class ClientDriveTypeAdminController {
  constructor(
    private readonly createClientDriveType: CreateClientDriveType,
    private readonly findAllClientDriveType: FindAllClientDriveType,
    private readonly findClientDriveTypeById: FindClientDriveTypeById,
    private readonly editClientDriveType: EditClientDriveType,
    private readonly updateClientDriveTypeStatus: UpdateClientDriveTypeStatus,
    private readonly deleteClientDriveType: DeleteClientDriveType,
  ) {}

  @Post()
  @Swagger({
    tags: ['Tipos de Drive de Clientes'],
    summary: 'Criar novo tipo de drive de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientDriveTypeOutputDto,
  })
  public create(@Body() body: CreateClientDriveTypeInputDto): Promise<CreateClientDriveTypeOutputDto> {
    return this.createClientDriveType.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Tipos de Drive de Clientes'],
    summary: 'Listar tipos de drive de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientDriveTypeDto,
  })
  public findAll(@Query() queries: FindAllClientDriveTypeQueryDto): Promise<IPagination<ClientDriveTypeDto>> {
    return this.findAllClientDriveType.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Tipos de Drive de Clientes'],
    summary: 'Buscar tipo de drive de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientDriveTypeDto,
  })
  public findOne(@Param() params: Params): Promise<ClientDriveTypeDto> {
    return this.findClientDriveTypeById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Tipos de Drive de Clientes'],
    summary: 'Inverter status ativo do tipo de drive de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientDriveTypeStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Tipos de Drive de Clientes'],
    summary: 'Editar tipo de drive de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientDriveTypeInputDto): Promise<SuccessMessage> {
    return this.editClientDriveType.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Tipos de Drive de Clientes'],
    summary: 'Deletar tipo de drive de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientDriveType.execute(params.id);
  }
}
