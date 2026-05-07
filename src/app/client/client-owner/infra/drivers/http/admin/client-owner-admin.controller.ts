import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientOwnerDto } from 'src/app/client/client-owner/application/dtos/client-owner.dto';
import { CreateClientOwner } from 'src/app/client/client-owner/application/usecases/create-client-owner/create-client-owner.service';
import { CreateClientOwnerInputDto, CreateClientOwnerOutputDto } from 'src/app/client/client-owner/application/usecases/create-client-owner/dtos/create-client-owner.dto';
import { DeleteClientOwner } from 'src/app/client/client-owner/application/usecases/delete-client-owner/delete-client-owner.service';
import { EditClientOwnerInputDto } from 'src/app/client/client-owner/application/usecases/edit-client-owner/dtos/edit-client-owner.dto';
import { EditClientOwner } from 'src/app/client/client-owner/application/usecases/edit-client-owner/edit-client-owner.service';
import { FindAllClientOwnerQueryDto } from 'src/app/client/client-owner/application/usecases/find-all-client-owner/dtos/find-all-client-owner.dto';
import { FindAllClientOwner } from 'src/app/client/client-owner/application/usecases/find-all-client-owner/find-all-client-owner.service';
import { FindClientOwnerById } from 'src/app/client/client-owner/application/usecases/find-client-owner-by-id/find-client-owner-by-id.service';
import { UpdateClientOwnerStatus } from 'src/app/client/client-owner/application/usecases/update-client-owner-status/update-client-owner-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-owner')
@RequiredRoles(AccountRole.ADMIN)
export class ClientOwnerAdminController {
  constructor(
    private readonly createClientOwner: CreateClientOwner,
    private readonly findAllClientOwner: FindAllClientOwner,
    private readonly findClientOwnerById: FindClientOwnerById,
    private readonly editClientOwner: EditClientOwner,
    private readonly updateClientOwnerStatus: UpdateClientOwnerStatus,
    private readonly deleteClientOwner: DeleteClientOwner,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_OWNER_WRITE)
  @Swagger({
    tags: ['Clientes - Proprietários'],
    summary: 'Criar novo proprietário de clientes',
    applyBadRequest: true,
    createdResponse: CreateClientOwnerOutputDto,
  })
  public create(@Body() body: CreateClientOwnerInputDto): Promise<CreateClientOwnerOutputDto> {
    return this.createClientOwner.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_OWNER_READ)
  @Swagger({
    tags: ['Clientes - Proprietários'],
    summary: 'Listar proprietários de clientes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientOwnerDto,
  })
  public findAll(@Query() queries: FindAllClientOwnerQueryDto): Promise<IPagination<ClientOwnerDto>> {
    return this.findAllClientOwner.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_OWNER_READ)
  @Swagger({
    tags: ['Clientes - Proprietários'],
    summary: 'Buscar proprietário de clientes por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientOwnerDto,
  })
  public findOne(@Param() params: Params): Promise<ClientOwnerDto> {
    return this.findClientOwnerById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_OWNER_WRITE)
  @Swagger({
    tags: ['Clientes - Proprietários'],
    summary: 'Inverter status ativo do proprietário de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientOwnerStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_OWNER_WRITE)
  @Swagger({
    tags: ['Clientes - Proprietários'],
    summary: 'Editar proprietário de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientOwnerInputDto): Promise<SuccessMessage> {
    return this.editClientOwner.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_OWNER_WRITE)
  @Swagger({
    tags: ['Clientes - Proprietários'],
    summary: 'Deletar proprietário de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientOwner.execute(params.id);
  }
}
