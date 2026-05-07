import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientMaintenanceTicketDto } from 'src/app/client/client-maintenance-ticket/application/dtos/client-maintenance-ticket.dto';
import { CreateClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/create-client-maintenance-ticket/create-client-maintenance-ticket.service';
import { CreateClientMaintenanceTicketInputDto, CreateClientMaintenanceTicketOutputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/create-client-maintenance-ticket/dtos/create-client-maintenance-ticket.dto';
import { DeleteClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/delete-client-maintenance-ticket/delete-client-maintenance-ticket.service';
import { EditClientMaintenanceTicketInputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/edit-client-maintenance-ticket/dtos/edit-client-maintenance-ticket.dto';
import { EditClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/edit-client-maintenance-ticket/edit-client-maintenance-ticket.service';
import { FindAllClientMaintenanceTicketQueryDto } from 'src/app/client/client-maintenance-ticket/application/usecases/find-all-client-maintenance-ticket/dtos/find-all-client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicket } from 'src/app/client/client-maintenance-ticket/application/usecases/find-all-client-maintenance-ticket/find-all-client-maintenance-ticket.service';
import { FindClientMaintenanceTicketById } from 'src/app/client/client-maintenance-ticket/application/usecases/find-client-maintenance-ticket-by-id/find-client-maintenance-ticket-by-id.service';
import { UpdateClientMaintenanceTicketStatus } from 'src/app/client/client-maintenance-ticket/application/usecases/update-client-maintenance-ticket-status/update-client-maintenance-ticket-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-maintenance-ticket')
@RequiredRoles(AccountRole.ADMIN)
export class ClientMaintenanceTicketAdminController {
  constructor(
    private readonly createClientMaintenanceTicket: CreateClientMaintenanceTicket,
    private readonly findAllClientMaintenanceTicket: FindAllClientMaintenanceTicket,
    private readonly findClientMaintenanceTicketById: FindClientMaintenanceTicketById,
    private readonly editClientMaintenanceTicket: EditClientMaintenanceTicket,
    private readonly updateClientMaintenanceTicketStatus: UpdateClientMaintenanceTicketStatus,
    private readonly deleteClientMaintenanceTicket: DeleteClientMaintenanceTicket,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Chamado de manutenção'],
    summary: 'Criar novo chamado de manutenção de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientMaintenanceTicketOutputDto,
  })
  public create(@Body() body: CreateClientMaintenanceTicketInputDto): Promise<CreateClientMaintenanceTicketOutputDto> {
    return this.createClientMaintenanceTicket.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Chamado de manutenção'],
    summary: 'Listar chamados de manutenção de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientMaintenanceTicketDto,
  })
  public findAll(@Query() queries: FindAllClientMaintenanceTicketQueryDto): Promise<IPagination<ClientMaintenanceTicketDto>> {
    return this.findAllClientMaintenanceTicket.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Chamado de manutenção'],
    summary: 'Buscar chamado de manutenção de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientMaintenanceTicketDto,
  })
  public findOne(@Param() params: Params): Promise<ClientMaintenanceTicketDto> {
    return this.findClientMaintenanceTicketById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Chamado de manutenção'],
    summary: 'Inverter status ativo do chamado de manutenção de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientMaintenanceTicketStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Chamado de manutenção'],
    summary: 'Editar chamado de manutenção de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientMaintenanceTicketInputDto): Promise<SuccessMessage> {
    return this.editClientMaintenanceTicket.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_MAINTENANCE_TICKET_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Chamado de manutenção'],
    summary: 'Deletar chamado de manutenção de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientMaintenanceTicket.execute(params.id);
  }
}
