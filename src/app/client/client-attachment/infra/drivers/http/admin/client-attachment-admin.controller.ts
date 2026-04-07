import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
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
import { UploadSingleInputDto } from 'src/app/upload-file/application/usecases/upload-single/dtos/upload-single.dto';
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
  @RequiredClaims(Claim.CLIENT_ATTACHMENT_CREATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Clientes - Anexos'],
    summary: 'Criar novo anexo de cliente',
    applyBadRequest: true,
    mergeRequestBody: [CreateClientAttachmentInputDto, UploadSingleInputDto],
    createdResponse: CreateClientAttachmentOutputDto,
  })
  public create(@UploadedFile() file: Express.Multer.File, @Body() body: CreateClientAttachmentInputDto): Promise<CreateClientAttachmentOutputDto> {
    return this.createClientAttachment.execute(file, body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_ATTACHMENT_LIST)
  @Swagger({
    tags: ['Clientes - Anexos'],
    summary: 'Listar anexos de cliente com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ClientAttachmentDto,
  })
  public findAll(@Query() queries: FindAllClientAttachmentQueryDto): Promise<IPagination<ClientAttachmentDto>> {
    return this.findAllClientAttachment.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_ATTACHMENT_DETAIL)
  @Swagger({
    tags: ['Clientes - Anexos'],
    summary: 'Buscar anexo de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientAttachmentDto,
  })
  public findOne(@Param() params: Params): Promise<ClientAttachmentDto> {
    return this.findClientAttachmentById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_ATTACHMENT_UPDATE_STATUS)
  @Swagger({
    tags: ['Clientes - Anexos'],
    summary: 'Inverter status ativo do anexo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientAttachmentStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_ATTACHMENT_UPDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Clientes - Anexos'],
    summary: 'Editar anexo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    mergeRequestBody: [EditClientAttachmentInputDto, UploadSingleInputDto],
    okResponse: SuccessMessage,
  })
  public update(
    @Param() params: Params,
    @Body() body: EditClientAttachmentInputDto,
    @UploadedFile() file?: Express.Multer.File | undefined,
  ): Promise<SuccessMessage> {
    return this.editClientAttachment.execute(params.id, body, file);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_ATTACHMENT_DELETE)
  @Swagger({
    tags: ['Clientes - Anexos'],
    summary: 'Deletar anexo de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientAttachment.execute(params.id);
  }
}
