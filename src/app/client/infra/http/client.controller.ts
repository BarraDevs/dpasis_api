import { Body, Controller, Post } from '@nestjs/common';
import { Swagger } from 'src/infra/openapi/swagger';
import { CreateClient } from '../../application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from '../../application/usecases/create-client/dtos/create-client.dto';

@Controller('client')
export class ClientController {
  constructor(
    private readonly createClientService: CreateClient,
    // private readonly findAllClientService: FindAllClient,
    // private readonly findClientByIdService: FindClientById,
    // private readonly editClientService: EditClient,
    // private readonly deleteClientService: DeleteClient,
  ) {}

  @Post()
  // @RequiredRoles()
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

  // @Get()
  // @Swagger({
  //   tags: ['TAG_AQUI'],
  //   summary: 'Rota para listar NOME_AQUI',
  //   applyBadRequest: true,
  //   okPaginatedResponse: ClientDto,
  // })
  // public findAll(@Query() queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>> {
  //   return this.findAllClientService.execute(queries);
  // }

  // @Get(':id')
  // @Swagger({
  //   tags: ['TAG_AQUI'],
  //   summary: 'Rota para buscar NOME_AQUI por ID',
  //   applyBadRequest: true,
  //   applyNotFound: true,
  //   okResponse: ClientDto,
  // })
  // public findOne(@Param() params: Params): Promise<ClientDto> {
  //   return this.findClientByIdService.execute(params.id);
  // }

  // @Patch(':id')
  // @Swagger({
  //   tags: ['TAG_AQUI'],
  //   summary: 'Rota para editar NOME_AQUI',
  //   applyBadRequest: true,
  //   applyNotFound: true,
  //   okResponse: SuccessMessage,
  // })
  // public update(@Param() params: Params, @Body() body: EditClientInputDto): Promise<SuccessMessage> {
  //   return this.editClientService.execute(params.id, body);
  // }

  // @Delete(':id')
  // @Swagger({
  //   tags: ['TAG_AQUI'],
  //   summary: 'Rota para deletar NOME_AQUI',
  //   applyBadRequest: true,
  //   applyNotFound: true,
  //   okResponse: SuccessMessage,
  // })
  // public remove(@Param() params: Params): Promise<SuccessMessage> {
  //   return this.deleteClientService.execute(params.id);
  // }
}
