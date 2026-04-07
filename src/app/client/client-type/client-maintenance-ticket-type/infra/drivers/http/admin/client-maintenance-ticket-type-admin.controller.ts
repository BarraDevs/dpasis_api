import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientMaintenanceTicketTypeDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/dtos/client-maintenance-ticket-type.dto';
import { CreateClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/create-client-maintenance-ticket-type/create-client-maintenance-ticket-type.service';
import { CreateClientMaintenanceTicketTypeInputDto, CreateClientMaintenanceTicketTypeOutputDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/create-client-maintenance-ticket-type/dtos/create-client-maintenance-ticket-type.dto';
import { DeleteClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/delete-client-maintenance-ticket-type/delete-client-maintenance-ticket-type.service';
import { EditClientMaintenanceTicketTypeInputDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/edit-client-maintenance-ticket-type/dtos/edit-client-maintenance-ticket-type.dto';
import { EditClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/edit-client-maintenance-ticket-type/edit-client-maintenance-ticket-type.service';
import { FindAllClientMaintenanceTicketTypeQueryDto } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-all-client-maintenance-ticket-type/dtos/find-all-client-maintenance-ticket-type.dto';
import { FindAllClientMaintenanceTicketType } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-all-client-maintenance-ticket-type/find-all-client-maintenance-ticket-type.service';
import { FindClientMaintenanceTicketTypeById } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/find-client-maintenance-ticket-type-by-id/find-client-maintenance-ticket-type-by-id.service';
import { UpdateClientMaintenanceTicketTypeStatus } from 'src/app/client/client-type/client-maintenance-ticket-type/application/usecases/update-client-maintenance-ticket-type-status/update-client-maintenance-ticket-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-maintenance-ticket-type')
@RequiredRoles(AccountRole.ADMIN)
export class ClientMaintenanceTicketTypeAdminController {
  constructor(
    private readonly createClientMaintenanceTicketType: CreateClientMaintenanceTicketType,
    private readonly findAllClientMaintenanceTicketType: FindAllClientMaintenanceTicketType,
    private readonly findClientMaintenanceTicketTypeById: FindClientMaintenanceTicketTypeById,
    private readonly editClientMaintenanceTicketType: EditClientMaintenanceTicketType,
    private readonly updateClientMaintenanceTicketTypeStatus: UpdateClientMaintenanceTicketTypeStatus,
    private readonly deleteClientMaintenanceTicketType: DeleteClientMaintenanceTicketType,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_TYPE_CREATE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de chamado de manutenção'],
    summary: 'Criar novo tipo de chamado de manutenção de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientMaintenanceTicketTypeOutputDto,
  })
  public create(@Body() body: CreateClientMaintenanceTicketTypeInputDto): Promise<CreateClientMaintenanceTicketTypeOutputDto> {
    return this.createClientMaintenanceTicketType.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_TYPE_LIST)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de chamado de manutenção'],
    summary: 'Listar tipos de chamados de manutenção de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientMaintenanceTicketTypeDto,
  })
  public findAll(@Query() queries: FindAllClientMaintenanceTicketTypeQueryDto): Promise<IPagination<ClientMaintenanceTicketTypeDto>> {
    return this.findAllClientMaintenanceTicketType.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_TYPE_DETAIL)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de chamado de manutenção'],
    summary: 'Buscar tipo de chamado de manutenção de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientMaintenanceTicketTypeDto,
  })
  public findOne(@Param() params: Params): Promise<ClientMaintenanceTicketTypeDto> {
    return this.findClientMaintenanceTicketTypeById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_TYPE_UPDATE_STATUS)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de chamado de manutenção'],
    summary: 'Inverter status ativo do tipo de chamado de manutenção de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientMaintenanceTicketTypeStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_TYPE_UPDATE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de chamado de manutenção'],
    summary: 'Editar tipo de chamado de manutenção de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientMaintenanceTicketTypeInputDto): Promise<SuccessMessage> {
    return this.editClientMaintenanceTicketType.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_TYPE_DELETE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de chamado de manutenção'],
    summary: 'Deletar tipo de chamado de manutenção de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientMaintenanceTicketType.execute(params.id);
  }
}
