import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientSystemTypeDto } from 'src/app/client/client-type/client-system-type/application/dtos/client-system-type.dto';
import { CreateClientSystemType } from 'src/app/client/client-type/client-system-type/application/usecases/create-client-system-type/create-client-system-type.service';
import { CreateClientSystemTypeInputDto, CreateClientSystemTypeOutputDto } from 'src/app/client/client-type/client-system-type/application/usecases/create-client-system-type/dtos/create-client-system-type.dto';
import { DeleteClientSystemType } from 'src/app/client/client-type/client-system-type/application/usecases/delete-client-system-type/delete-client-system-type.service';
import { EditClientSystemTypeInputDto } from 'src/app/client/client-type/client-system-type/application/usecases/edit-client-system-type/dtos/edit-client-system-type.dto';
import { EditClientSystemType } from 'src/app/client/client-type/client-system-type/application/usecases/edit-client-system-type/edit-client-system-type.service';
import { FindAllClientSystemTypeQueryDto } from 'src/app/client/client-type/client-system-type/application/usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';
import { FindAllClientSystemType } from 'src/app/client/client-type/client-system-type/application/usecases/find-all-client-system-type/find-all-client-system-type.service';
import { FindClientSystemTypeById } from 'src/app/client/client-type/client-system-type/application/usecases/find-client-system-type-by-id/find-client-system-type-by-id.service';
import { UpdateClientSystemTypeStatus } from 'src/app/client/client-type/client-system-type/application/usecases/update-client-system-type-status/update-client-system-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-system-type')
@RequiredRoles(AccountRole.ADMIN)
export class ClientSystemTypeAdminController {
  constructor(
    private readonly createClientSystemType: CreateClientSystemType,
    private readonly findAllClientSystemType: FindAllClientSystemType,
    private readonly findClientSystemTypeById: FindClientSystemTypeById,
    private readonly editClientSystemType: EditClientSystemType,
    private readonly updateClientSystemTypeStatus: UpdateClientSystemTypeStatus,
    private readonly deleteClientSystemType: DeleteClientSystemType,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Criar novo tipo de sistema de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientSystemTypeOutputDto,
  })
  public create(@Body() body: CreateClientSystemTypeInputDto): Promise<CreateClientSystemTypeOutputDto> {
    return this.createClientSystemType.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Listar tipos de sistema de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientSystemTypeDto,
  })
  public findAll(@Query() queries: FindAllClientSystemTypeQueryDto): Promise<IPagination<ClientSystemTypeDto>> {
    return this.findAllClientSystemType.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Buscar tipo de sistema de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientSystemTypeDto,
  })
  public findOne(@Param() params: Params): Promise<ClientSystemTypeDto> {
    return this.findClientSystemTypeById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Inverter status ativo do tipo de sistema de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientSystemTypeStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Editar tipo de sistema de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientSystemTypeInputDto): Promise<SuccessMessage> {
    return this.editClientSystemType.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Deletar tipo de sistema de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientSystemType.execute(params.id);
  }
}
