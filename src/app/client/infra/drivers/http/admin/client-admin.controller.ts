import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/application/usecases/create-client/dtos/create-client.dto';
import { DeleteClient } from 'src/app/client/application/usecases/delete-client/delete-client.service';
import { EditClientInputDto } from 'src/app/client/application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from 'src/app/client/application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from 'src/app/client/application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client')
@RequiredRoles(AccountRole.ADMIN)
export class ClientAdminController {
  constructor(
    private readonly createClient: CreateClient,
    private readonly findAllClient: FindAllClient,
    private readonly findClientById: FindClientById,
    private readonly editClient: EditClient,
    private readonly deleteClient: DeleteClient,
  ) {}

  @Post()
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

  @Patch(':id')
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

  @Delete(':id')
  @Swagger({
    tags: ['Clientes'],
    summary: 'Deletar cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClient.execute(params.id);
  }
}
