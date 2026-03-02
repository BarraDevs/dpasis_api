import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientAddressDto } from 'src/app/client-address/application/dtos/client-address.dto';
import { CreateClientAddress } from 'src/app/client-address/application/usecases/create-client-address/create-client-address.service';
import { CreateClientAddressInputDto, CreateClientAddressOutputDto } from 'src/app/client-address/application/usecases/create-client-address/dtos/create-client-address.dto';
import { DeleteClientAddress } from 'src/app/client-address/application/usecases/delete-client-address/delete-client-address.service';
import { EditClientAddressInputDto } from 'src/app/client-address/application/usecases/edit-client-address/dtos/edit-client-address.dto';
import { EditClientAddress } from 'src/app/client-address/application/usecases/edit-client-address/edit-client-address.service';
import { FindAllClientAddressQueryDto } from 'src/app/client-address/application/usecases/find-all-client-address/dtos/find-all-client-address.dto';
import { FindAllClientAddress } from 'src/app/client-address/application/usecases/find-all-client-address/find-all-client-address.service';
import { FindClientAddressById } from 'src/app/client-address/application/usecases/find-client-address-by-id/find-client-address-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-address')
@RequiredRoles(AccountRole.ADMIN)
export class ClientAddressAdminController {
  constructor(
    private readonly createClientAddress: CreateClientAddress,
    private readonly findAllClientAddress: FindAllClientAddress,
    private readonly findClientAddressById: FindClientAddressById,
    private readonly editClientAddress: EditClientAddress,
    private readonly deleteClientAddress: DeleteClientAddress,
  ) {}

  @Post()
  @Swagger({
    tags: ['Endereços de Clientes'],
    summary: 'Criar novo endereço de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientAddressOutputDto,
  })
  public create(@Body() body: CreateClientAddressInputDto): Promise<CreateClientAddressOutputDto> {
    return this.createClientAddress.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Endereços de Clientes'],
    summary: 'Listar endereços de clientes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientAddressDto,
  })
  public findAll(@Query() queries: FindAllClientAddressQueryDto): Promise<IPagination<ClientAddressDto>> {
    return this.findAllClientAddress.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Endereços de Clientes'],
    summary: 'Buscar endereço de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientAddressDto,
  })
  public findOne(@Param() params: Params): Promise<ClientAddressDto> {
    return this.findClientAddressById.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Endereços de Clientes'],
    summary: 'Editar endereço de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientAddressInputDto): Promise<SuccessMessage> {
    return this.editClientAddress.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Endereços de Clientes'],
    summary: 'Deletar endereço de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientAddress.execute(params.id);
  }
}
