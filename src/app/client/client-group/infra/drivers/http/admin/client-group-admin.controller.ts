import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientGroupDto } from 'src/app/client/client-group/application/dtos/client-group.dto';
import { CreateClientGroup } from 'src/app/client/client-group/application/usecases/create-client-group/create-client-group.service';
import { CreateClientGroupInputDto, CreateClientGroupOutputDto } from 'src/app/client/client-group/application/usecases/create-client-group/dtos/create-client-group.dto';
import { DeleteClientGroup } from 'src/app/client/client-group/application/usecases/delete-client-group/delete-client-group.service';
import { EditClientGroupInputDto } from 'src/app/client/client-group/application/usecases/edit-client-group/dtos/edit-client-group.dto';
import { EditClientGroup } from 'src/app/client/client-group/application/usecases/edit-client-group/edit-client-group.service';
import { FindAllClientGroupQueryDto } from 'src/app/client/client-group/application/usecases/find-all-client-group/dtos/find-all-client-group.dto';
import { FindAllClientGroup } from 'src/app/client/client-group/application/usecases/find-all-client-group/find-all-client-group.service';
import { FindClientGroupById } from 'src/app/client/client-group/application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { UpdateClientGroupStatus } from 'src/app/client/client-group/application/usecases/update-client-group-status/update-client-group-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-group')
@RequiredRoles(AccountRole.ADMIN)
export class ClientGroupAdminController {
  constructor(
    private readonly createClientGroup: CreateClientGroup,
    private readonly findAllClientGroup: FindAllClientGroup,
    private readonly findClientGroupById: FindClientGroupById,
    private readonly editClientGroup: EditClientGroup,
    private readonly updateClientGroupStatus: UpdateClientGroupStatus,
    private readonly deleteClientGroup: DeleteClientGroup,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_GROUP_CREATE)
  @Swagger({
    tags: ['Clientes - Grupos'],
    summary: 'Criar novo grupo de clientes',
    applyBadRequest: true,
    createdResponse: CreateClientGroupOutputDto,
  })
  public create(@Body() body: CreateClientGroupInputDto): Promise<CreateClientGroupOutputDto> {
    return this.createClientGroup.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_GROUP_LIST)
  @Swagger({
    tags: ['Clientes - Grupos'],
    summary: 'Listar grupos de clientes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientGroupDto,
  })
  public findAll(@Query() queries: FindAllClientGroupQueryDto): Promise<IPagination<ClientGroupDto>> {
    return this.findAllClientGroup.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_GROUP_READ)
  @Swagger({
    tags: ['Clientes - Grupos'],
    summary: 'Buscar grupo de clientes por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientGroupDto,
  })
  public findOne(@Param() params: Params): Promise<ClientGroupDto> {
    return this.findClientGroupById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_GROUP_UPDATE_STATUS)
  @Swagger({
    tags: ['Clientes - Grupos'],
    summary: 'Inverter status ativo do grupo de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientGroupStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_GROUP_UPDATE)
  @Swagger({
    tags: ['Clientes - Grupos'],
    summary: 'Editar grupo de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientGroupInputDto): Promise<SuccessMessage> {
    return this.editClientGroup.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_GROUP_DELETE)
  @Swagger({
    tags: ['Clientes - Grupos'],
    summary: 'Deletar grupo de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientGroup.execute(params.id);
  }
}
