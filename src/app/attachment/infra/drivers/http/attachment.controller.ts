import { Body, Controller, Post } from '@nestjs/common';
import { CreateAttachment } from 'src/app/attachment/application/usecases/create-attachment/create-attachment.service';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from 'src/app/attachment/application/usecases/create-attachment/dtos/create-attachment.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('attachment')
export class AttachmentController {
  constructor(
    private readonly createAttachmentService: CreateAttachment,
    // private readonly findAllAttachmentService: FindAllAttachment,
    // private readonly findAttachmentByIdService: FindAttachmentById,
    // private readonly editAttachmentService: EditAttachment,
    // private readonly deleteAttachmentService: DeleteAttachment,
  ) {}

  @Post()
  @Swagger({
    tags: ['TAG_AQUI'],
    summary: 'Rota para criar NOME_AQUI',
    applyBadRequest: true,
    createdResponse: CreateAttachmentOutputDto,
  })
  public create(@Body() body: CreateAttachmentInputDto): Promise<CreateAttachmentOutputDto> {
    return this.createAttachmentService.execute(body);
  }

//  @Get()
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para listar NOME_AQUI',
//    applyBadRequest: true,
//    okPaginatedResponse: AttachmentDto,
//  })
//  public findAll(@Query() queries: FindAllAttachmentQueryDto): Promise<IPagination<AttachmentDto>> {
//    return this.findAllAttachmentService.execute(queries);
//  }
//
//  @Get(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para buscar NOME_AQUI por ID',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: AttachmentDto,
//  })
//  public findOne(@Param() params: Params): Promise<AttachmentDto> {
//    return this.findAttachmentByIdService.execute(params.id);
//  }
//
//  @Patch(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para editar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public update(@Param() params: Params, @Body() body: EditAttachmentInputDto): Promise<SuccessMessage> {
//    return this.editAttachmentService.execute(params.id, body);
//  }
//
//  @Delete(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para deletar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public remove(@Param() params: Params): Promise<SuccessMessage> {
//    return this.deleteAttachmentService.execute(params.id);
//  }
}
