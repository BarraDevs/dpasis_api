import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientContactDto } from 'src/app/client/client-contact/application/dtos/client-contact.dto';
import { ActivateClientContact } from 'src/app/client/client-contact/application/usecases/activate-client-contact/activate-client-contact.service';
import { CreateClientContact } from 'src/app/client/client-contact/application/usecases/create-client-contact/create-client-contact.service';
import {
    CreateClientContactInputDto,
    CreateClientContactOutputDto,
} from 'src/app/client/client-contact/application/usecases/create-client-contact/dtos/create-client-contact.dto';
import { DeactivateClientContact } from 'src/app/client/client-contact/application/usecases/deactivate-client-contact/deactivate-client-contact.service';
import { DeleteClientContact } from 'src/app/client/client-contact/application/usecases/delete-client-contact/delete-client-contact.service';
import { EditClientContactInputDto } from 'src/app/client/client-contact/application/usecases/edit-client-contact/dtos/edit-client-contact.dto';
import { EditClientContact } from 'src/app/client/client-contact/application/usecases/edit-client-contact/edit-client-contact.service';
import { FindAllClientContactQueryDto } from 'src/app/client/client-contact/application/usecases/find-all-client-contact/dtos/find-all-client-contact.dto';
import { FindAllClientContact } from 'src/app/client/client-contact/application/usecases/find-all-client-contact/find-all-client-contact.service';
import { FindClientContactById } from 'src/app/client/client-contact/application/usecases/find-client-contact-by-id/find-client-contact-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-contact')
@RequiredRoles(AccountRole.ADMIN)
export class ClientContactAdminController {
  constructor(
    private readonly createClientContact: CreateClientContact,
    private readonly findAllClientContact: FindAllClientContact,
    private readonly findClientContactById: FindClientContactById,
    private readonly editClientContact: EditClientContact,
    private readonly activateClientContact: ActivateClientContact,
    private readonly deactivateClientContact: DeactivateClientContact,
    private readonly deleteClientContact: DeleteClientContact,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_CONTACT_CREATE)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Criar novo contato de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientContactOutputDto,
  })
  public create(
    @Body() body: CreateClientContactInputDto,
  ): Promise<CreateClientContactOutputDto> {
    return this.createClientContact.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_CONTACT_LIST)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Listar contatos de cliente com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ClientContactDto,
  })
  public findAll(@Query() queries: FindAllClientContactQueryDto): Promise<IPagination<ClientContactDto>> {
    return this.findAllClientContact.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_CONTACT_DETAIL)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Buscar contato de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientContactDto,
  })
  public findOne(@Param() params: Params): Promise<ClientContactDto> {
    return this.findClientContactById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.CLIENT_CONTACT_ACTIVATE)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Ativar contato de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateClientContact.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.CLIENT_CONTACT_DEACTIVATE)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Desativar contato de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateClientContact.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_CONTACT_UPDATE)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Editar contato de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientContactInputDto): Promise<SuccessMessage> {
    return this.editClientContact.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_CONTACT_DELETE)
  @Swagger({
    tags: ['Clientes - Contatos'],
    summary: 'Deletar contato de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientContact.execute(params.id);
  }
}
