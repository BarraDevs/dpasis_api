import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientAttachmentDto } from 'src/app/client/client-attachment/application/dtos/client-attachment.dto';
import { CreateClientAttachment } from 'src/app/client/client-attachment/application/usecases/create-client-attachment/create-client-attachment.service';
import {
  CreateClientAttachmentInputDto,
  CreateClientAttachmentOutputDto,
} from 'src/app/client/client-attachment/application/usecases/create-client-attachment/dtos/create-client-attachment.dto';
import { DeleteClientAttachment } from 'src/app/client/client-attachment/application/usecases/delete-client-attachment/delete-client-attachment.service';
import { EditClientAttachmentInputDto } from 'src/app/client/client-attachment/application/usecases/edit-client-attachment/dtos/edit-client-attachment.dto';
import { EditClientAttachment } from 'src/app/client/client-attachment/application/usecases/edit-client-attachment/edit-client-attachment.service';
import { FindAllClientAttachmentQueryDto } from 'src/app/client/client-attachment/application/usecases/find-all-client-attachment/dtos/find-all-client-attachment.dto';
import { FindAllClientAttachment } from 'src/app/client/client-attachment/application/usecases/find-all-client-attachment/find-all-client-attachment.service';
import { FindClientAttachmentById } from 'src/app/client/client-attachment/application/usecases/find-client-attachment-by-id/find-client-attachment-by-id.service';
import { UpdateClientAttachmentStatus } from 'src/app/client/client-attachment/application/usecases/update-client-attachment-status/update-client-attachment-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-attachment')
@RequiredRoles(AccountRole.ADMIN)
export class ClientAttachmentAdminController {
  constructor(
    private readonly createClientAttachment: CreateClientAttachment,
    private readonly findAllClientAttachment: FindAllClientAttachment,
    private readonly findClientAttachmentById: FindClientAttachmentById,
    private readonly editClientAttachment: EditClientAttachment,
    private readonly updateClientAttachmentStatus: UpdateClientAttachmentStatus,
    private readonly deleteClientAttachment: DeleteClientAttachment,
  ) {}

  @Post()
  @Swagger({
    tags: ['Anexos de Clientes'],
    summary: 'Criar novo anexo de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientAttachmentOutputDto,
  })
  public create(@Body() body: CreateClientAttachmentInputDto): Promise<CreateClientAttachmentOutputDto> {
    return this.createClientAttachment.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Anexos de Clientes'],
    summary: 'Listar anexos de cliente com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ClientAttachmentDto,
  })
  public findAll(@Query() queries: FindAllClientAttachmentQueryDto): Promise<IPagination<ClientAttachmentDto>> {
    return this.findAllClientAttachment.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Anexos de Clientes'],
    summary: 'Buscar anexo de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientAttachmentDto,
  })
  public findOne(@Param() params: Params): Promise<ClientAttachmentDto> {
    return this.findClientAttachmentById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Anexos de Clientes'],
    summary: 'Inverter status ativo do anexo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientAttachmentStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Anexos de Clientes'],
    summary: 'Editar anexo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientAttachmentInputDto): Promise<SuccessMessage> {
    return this.editClientAttachment.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Anexos de Clientes'],
    summary: 'Deletar anexo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientAttachment.execute(params.id);
  }
}
