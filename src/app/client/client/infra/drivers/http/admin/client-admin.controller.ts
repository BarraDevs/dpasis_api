import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { ActivateClient } from 'src/app/client/client/application/usecases/activate-client/activate-client.service';
import { CreateClient } from 'src/app/client/client/application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/client/application/usecases/create-client/dtos/create-client.dto';
import { DeactivateClient } from 'src/app/client/client/application/usecases/deactivate-client/deactivate-client.service';
import { EditClientInputDto } from 'src/app/client/client/application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from 'src/app/client/client/application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from 'src/app/client/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from 'src/app/client/client/application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client')
@RequiredRoles(AccountRole.ADMIN)
export class ClientAdminController {
  constructor(
    private readonly activateClient: ActivateClient,
    private readonly createClient: CreateClient,
    private readonly deactivateClient: DeactivateClient,
    private readonly findAllClient: FindAllClient,
    private readonly findClientById: FindClientById,
    private readonly editClient: EditClient,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_CREATE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Criar novo cliente',
    applyBadRequest: true,
    createdResponse: CreateClientOutputDto,
  })
  public create(@Body() body: CreateClientInputDto): Promise<CreateClientOutputDto> {
    return this.createClient.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_LIST)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Listar clientes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientDto,
  })
  public findAll(@Query() queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>> {
    return this.findAllClient.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_READ)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Buscar cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientDto,
  })
  public findOne(@Param() params: Params): Promise<ClientDto> {
    return this.findClientById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.CLIENT_ACTIVATE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Ativar cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateClient.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.CLIENT_DEACTIVATE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Desativar cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateClient.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_UPDATE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Editar cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientInputDto): Promise<SuccessMessage> {
    return this.editClient.execute(params.id, body);
  }
}
