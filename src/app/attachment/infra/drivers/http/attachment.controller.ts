import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum'; // Decidir qual role, se houver
import { AttachmentDto } from 'src/app/attachment/application/dtos/attachment.dto';
import { CreateAttachment } from 'src/app/attachment/application/usecases/create-attachment/create-attachment.service';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from 'src/app/attachment/application/usecases/create-attachment/dtos/create-attachment.dto';
import { DeleteAttachment } from 'src/app/attachment/application/usecases/delete-attachment/delete-attachment.service';
import { EditAttachmentInputDto } from 'src/app/attachment/application/usecases/edit-attachment/dtos/edit-attachment.dto';
import { EditAttachment } from 'src/app/attachment/application/usecases/edit-attachment/edit-attachment.service';
import { FindAllAttachmentQueryDto } from 'src/app/attachment/application/usecases/find-all-attachment/dtos/find-all-attachment.dto';
import { FindAllAttachment } from 'src/app/attachment/application/usecases/find-all-attachment/find-all-attachment.service';
import { FindAttachmentById } from 'src/app/attachment/application/usecases/find-attachment-by-id/find-attachment-by-id.service';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('attachment')
@RequiredRoles(AccountRole.ADMIN)
export class AttachmentController {
  constructor(
    private readonly createAttachmentService: CreateAttachment,
    private readonly findAllAttachmentService: FindAllAttachment,
    private readonly findAttachmentByIdService: FindAttachmentById,
    private readonly editAttachmentService: EditAttachment,
    private readonly deleteAttachmentService: DeleteAttachment,
  ) {}

  @Post()
  @Swagger({
    tags: ['Anexos'],
    summary: 'Rota para criar um anexo (registrar link)',
    applyBadRequest: true,
    createdResponse: CreateAttachmentOutputDto,
  })
  public create(@Body() body: CreateAttachmentInputDto): Promise<CreateAttachmentOutputDto> {
    return this.createAttachmentService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Anexos'],
    summary: 'Rota para listar anexos por proprietário',
    applyBadRequest: true,
    okPaginatedResponse: AttachmentDto,
  })
  public findAll(@Query() queries: FindAllAttachmentQueryDto): Promise<IPagination<AttachmentDto>> {
    return this.findAllAttachmentService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Anexos'],
    summary: 'Rota para buscar um anexo por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: AttachmentDto,
  })
  public findOne(@Param() params: Params): Promise<AttachmentDto> {
    return this.findAttachmentByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Anexos'],
    summary: 'Rota para editar o link de um anexo',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditAttachmentInputDto): Promise<SuccessMessage> {
    return this.editAttachmentService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Anexos'],
    summary: 'Rota para deletar um anexo',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteAttachmentService.execute(params.id);
  }
}
