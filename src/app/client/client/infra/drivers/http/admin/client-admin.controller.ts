import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
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
import { FindSubClientsQueryDto } from 'src/app/client/client/application/usecases/find-sub-clients/dtos/find-sub-clients.dto';
import { FindSubClients } from 'src/app/client/client/application/usecases/find-sub-clients/find-sub-clients.service';
import { GetClientSequenceOutputDto } from 'src/app/client/client/application/usecases/get-client-sequence/dtos/get-client-sequence.dto';
import { GetClientSequence } from 'src/app/client/client/application/usecases/get-client-sequence/get-client-sequence.service';
import { LinkClientAttendanceAndMaintenanceInputDto } from 'src/app/client/client/application/usecases/link-client-attendance-and-maintenance/dtos/link-client-attendance-and-maintenance.dto';
import { LinkClientAttendanceAndMaintenance } from 'src/app/client/client/application/usecases/link-client-attendance-and-maintenance/link-client-attendance-and-maintenance.service';
import { LookupClientDocumentAndCnpjInputDto, LookupClientDocumentAndCnpjOutputDto } from 'src/app/client/client/application/usecases/lookup-client-document-and-cnpj/dtos/lookup-client-document-and-cnpj.dto';
import { LookupClientDocumentAndCnpj } from 'src/app/client/client/application/usecases/lookup-client-document-and-cnpj/lookup-client-document-and-cnpj.service';
import { SetClientParentInputDto } from 'src/app/client/client/application/usecases/set-client-parent/dtos/set-client-parent.dto';
import { SetClientParent } from 'src/app/client/client/application/usecases/set-client-parent/set-client-parent.service';
import { SetClientNextIdInputDto } from 'src/app/client/client/application/usecases/set-client-next-id/dtos/set-client-next-id.dto';
import { SetClientNextId } from 'src/app/client/client/application/usecases/set-client-next-id/set-client-next-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
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
    private readonly findSubClients: FindSubClients,
    private readonly setClientParent: SetClientParent,
    private readonly editClient: EditClient,
    private readonly getClientSequence: GetClientSequence,
    private readonly linkClientAttendanceAndMaintenance: LinkClientAttendanceAndMaintenance,
    private readonly setClientNextId: SetClientNextId,
    private readonly lookupClientDocumentAndCnpj: LookupClientDocumentAndCnpj,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_WRITE)
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
  @RequiredClaims(Claim.CLIENT_READ)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Listar clientes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientDto,
  })
  public findAll(@Query() queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>> {
    return this.findAllClient.execute(queries);
  }

  @Get('sequence')
  @RequiredClaims(Claim.CLIENT_READ)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Consultar próximo ID automático de cliente',
    okResponse: GetClientSequenceOutputDto,
  })
  public getSequence(): Promise<GetClientSequenceOutputDto> {
    return this.getClientSequence.execute();
  }

  @Patch('sequence')
  @RequiredClaims(Claim.CLIENT_WRITE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Definir próximo ID automático de cliente',
    applyBadRequest: true,
    okResponse: SuccessMessage,
  })
  public setSequence(@Body() body: SetClientNextIdInputDto): Promise<SuccessMessage> {
    return this.setClientNextId.execute(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('lookup-document-and-cnpj')
  @RequiredClaims(Claim.CLIENT_READ)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Verificar documento em uso e consultar dados do CNPJ',
    description: 'Retorna se o documento já está cadastrado em cliente e, em paralelo, dados da Receita para o CNPJ informado (ou mensagem de erro na consulta externa sem falhar a requisição).',
    applyBadRequest: true,
    okResponse: LookupClientDocumentAndCnpjOutputDto,
  })
  public lookupDocumentAndCnpj(@Body() body: LookupClientDocumentAndCnpjInputDto): Promise<LookupClientDocumentAndCnpjOutputDto> {
    return this.lookupClientDocumentAndCnpj.execute(body);
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

  @Get(':id/sub-clients')
  @RequiredClaims(Claim.CLIENT_READ)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Listar sub-clientes de um cliente com paginação e busca',
    applyBadRequest: true,
    applyNotFound: true,
    okPaginatedResponse: ClientDto,
  })
  public findSubClientsByClientId(@Param() params: Params, @Query() queries: FindSubClientsQueryDto): Promise<IPagination<ClientDto>> {
    return this.findSubClients.execute(params.id, queries);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.CLIENT_WRITE)
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
  @RequiredClaims(Claim.CLIENT_WRITE)
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

  @Patch(':id/parent')
  @RequiredClaims(Claim.CLIENT_WRITE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Definir ou remover o cliente titular (sub-cliente)',
    description: 'Vincula o cliente a um titular novo, transfere entre titulares ou remove o vínculo (informe parentClientId null).',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public setParent(@Param() params: Params, @Body() body: SetClientParentInputDto): Promise<SuccessMessage> {
    return this.setClientParent.execute(params.id, body);
  }

  @Patch(':id/attendance-maintenance')
  @RequiredClaims(Claim.CLIENT_WRITE)
  @Swagger({
    tags: ['Clientes'],
    summary: 'Vincular atendimento e chamado de manutenção ao cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public linkAttendanceMaintenance(@Param() params: Params, @Body() body: LinkClientAttendanceAndMaintenanceInputDto): Promise<SuccessMessage> {
    return this.linkClientAttendanceAndMaintenance.execute(params.id, body);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_WRITE)
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
