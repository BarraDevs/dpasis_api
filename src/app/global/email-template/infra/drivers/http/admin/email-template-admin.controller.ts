import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { EmailTemplateDto } from 'src/app/global/email-template/application/dtos/email-template.dto';
import { CreateEmailTemplate } from 'src/app/global/email-template/application/usecases/create-email-template/create-email-template.service';
import { CreateEmailTemplateInputDto, CreateEmailTemplateOutputDto } from 'src/app/global/email-template/application/usecases/create-email-template/dtos/create-email-template.dto';
import { DeleteEmailTemplate } from 'src/app/global/email-template/application/usecases/delete-email-template/delete-email-template.service';
import { EditEmailTemplateInputDto } from 'src/app/global/email-template/application/usecases/edit-email-template/dtos/edit-email-template.dto';
import { EditEmailTemplate } from 'src/app/global/email-template/application/usecases/edit-email-template/edit-email-template.service';
import { FindAllEmailTemplateQueryDto } from 'src/app/global/email-template/application/usecases/find-all-email-template/dtos/find-all-email-template.dto';
import { FindAllEmailTemplate } from 'src/app/global/email-template/application/usecases/find-all-email-template/find-all-email-template.service';
import { FindEmailTemplateById } from 'src/app/global/email-template/application/usecases/find-email-template-by-id/find-email-template-by-id.service';
import { RenderEmailTemplateInputDto, RenderEmailTemplateOutputDto } from 'src/app/global/email-template/application/usecases/render-email-template/dtos/render-email-template.dto';
import { RenderEmailTemplate } from 'src/app/global/email-template/application/usecases/render-email-template/render-email-template.service';
import { UpdateEmailTemplateStatus } from 'src/app/global/email-template/application/usecases/update-email-template-status/update-email-template-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/email-template')
@RequiredRoles(AccountRole.ADMIN)
export class EmailTemplateAdminController {
  constructor(
    private readonly createEmailTemplate: CreateEmailTemplate,
    private readonly findAllEmailTemplate: FindAllEmailTemplate,
    private readonly findEmailTemplateById: FindEmailTemplateById,
    private readonly renderEmailTemplate: RenderEmailTemplate,
    private readonly editEmailTemplate: EditEmailTemplate,
    private readonly updateEmailTemplateStatus: UpdateEmailTemplateStatus,
    private readonly deleteEmailTemplate: DeleteEmailTemplate,
  ) {}

  @Post()
  @RequiredClaims(Claim.EMAIL_TEMPLATE_WRITE)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Criar template de e-mail',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateEmailTemplateOutputDto,
  })
  public create(@Body() body: CreateEmailTemplateInputDto): Promise<CreateEmailTemplateOutputDto> {
    return this.createEmailTemplate.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.EMAIL_TEMPLATE_READ)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Listar templates de e-mail com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: EmailTemplateDto,
  })
  public findAll(@Query() queries: FindAllEmailTemplateQueryDto): Promise<IPagination<EmailTemplateDto>> {
    return this.findAllEmailTemplate.execute(queries);
  }

  @Post(':id/render')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_READ)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Renderizar template de e-mail com as variáveis informadas',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: RenderEmailTemplateOutputDto,
  })
  public render(@Param() params: Params, @Body() body: RenderEmailTemplateInputDto): Promise<RenderEmailTemplateOutputDto> {
    return this.renderEmailTemplate.execute(params.id, body);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_WRITE)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Inverter status ativo do template de e-mail',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateEmailTemplateStatus.execute(params.id);
  }

  @Get(':id')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_READ)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Buscar template de e-mail por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: EmailTemplateDto,
  })
  public findOne(@Param() params: Params): Promise<EmailTemplateDto> {
    return this.findEmailTemplateById.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_WRITE)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Editar template de e-mail',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditEmailTemplateInputDto): Promise<SuccessMessage> {
    return this.editEmailTemplate.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_WRITE)
  @Swagger({
    tags: ['Templates de e-mail'],
    summary: 'Deletar template de e-mail',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteEmailTemplate.execute(params.id);
  }
}
