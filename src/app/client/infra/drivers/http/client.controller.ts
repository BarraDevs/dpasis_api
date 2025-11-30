import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/application/usecases/create-client/dtos/create-client.dto';
import { EditClientInputDto } from 'src/app/client/application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from 'src/app/client/application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from 'src/app/client/application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { UpdateClientStatus } from 'src/app/client/application/usecases/update-client-status/update-client-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('client')
@RequiredRoles(AccountRole.ADMIN)
export class ClientController {
  constructor(
    private readonly createClientService: CreateClient,
    private readonly findAllClientService: FindAllClient,
    private readonly findClientByIdService: FindClientById,
    private readonly editClientService: EditClient,
    private readonly updateClientStatusService: UpdateClientStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Clientes'],
    summary: 'Rota para criar um cliente',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateClientOutputDto,
  })
  public create(@Body() body: CreateClientInputDto): Promise<CreateClientOutputDto> {
    return this.createClientService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Clientes'],
    summary: 'Rota para listar todos os clientes',
    applyBadRequest: true,
    okPaginatedResponse: ClientDto,
  })
  public findAll(@Query() queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>> {
    return this.findAllClientService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Clientes'],
    summary: 'Rota para buscar cliente por ID',
    applyBadRequest: true,
    okResponse: ClientDto,
  })
  public findOne(@Param() params: Params): Promise<ClientDto | null> {
    return this.findClientByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Clientes'],
    summary: 'Rota para editar cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientInputDto): Promise<SuccessMessage> {
    return this.editClientService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Clientes'],
    summary: 'Rota para ativar/desativar cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientStatusService.execute(params.id);
  }
}
