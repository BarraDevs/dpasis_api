import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination';
import { ClientDto } from '../../application/dtos/client.dto';
import { CreateClient } from '../../application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from '../../application/usecases/create-client/dtos/create-client.dto';
import { EditClientInputDto } from '../../application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from '../../application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from '../../application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from '../../application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from '../../application/usecases/find-client-by-id/find-client-by-id.service';

@Controller('client')
@RequiredRoles()
export class ClientController {
  constructor(
    private readonly createClientService: CreateClient,
    private readonly findAllClientService: FindAllClient,
    private readonly findClientByIdService: FindClientById,
    private readonly editClientService: EditClient,
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
}
