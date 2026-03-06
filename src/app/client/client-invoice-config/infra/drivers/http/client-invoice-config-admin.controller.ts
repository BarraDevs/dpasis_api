import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { CreateClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/create-client-invoice-config/create-client-invoice-config.service';
import { CreateClientInvoiceConfigInputDto, CreateClientInvoiceConfigOutputDto } from 'src/app/client/client-invoice-config/application/usecases/create-client-invoice-config/dtos/create-client-invoice-config.dto';
import { DeleteClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/delete-client-invoice-config/delete-client-invoice-config.service';
import { EditClientInvoiceConfigInputDto } from 'src/app/client/client-invoice-config/application/usecases/edit-client-invoice-config/dtos/edit-client-invoice-config.dto';
import { EditClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/edit-client-invoice-config/edit-client-invoice-config.service';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { ParamsClientId } from 'src/infra/validators/class/dtos/params/params-client-id.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';

@Controller('admin/client-invoice-config')
@RequiredRoles(AccountRole.ADMIN)
export class ClientInvoiceConfigAdminController {
  constructor(
    private readonly createClientInvoiceConfig: CreateClientInvoiceConfig,
    private readonly editClientInvoiceConfig: EditClientInvoiceConfig,
    private readonly findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId,
    private readonly deleteClientInvoiceConfig: DeleteClientInvoiceConfig,
  ) {}

  @Post()
  @Swagger({
    tags: ['Configuração NF e Boleto'],
    summary: 'Criar configuração de NF e boleto para cliente',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateClientInvoiceConfigOutputDto,
  })
  public create(@Body() body: CreateClientInvoiceConfigInputDto): Promise<CreateClientInvoiceConfigOutputDto> {
    return this.createClientInvoiceConfig.execute(body);
  }

  @Get('client/:clientId')
  @Swagger({
    tags: ['Configuração NF e Boleto'],
    summary: 'Buscar configuração por ID do cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientInvoiceConfigDto,
  })
  public findByClientId(@Param() params: ParamsClientId): Promise<ClientInvoiceConfigDto> {
    return this.findClientInvoiceConfigByClientId.execute(params.clientId);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Configuração NF e Boleto'],
    summary: 'Editar configuração de NF e boleto',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientInvoiceConfigInputDto): Promise<SuccessMessage> {
    return this.editClientInvoiceConfig.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Configuração NF e Boleto'],
    summary: 'Excluir configuração de NF e boleto',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientInvoiceConfig.execute(params.id);
  }
}
