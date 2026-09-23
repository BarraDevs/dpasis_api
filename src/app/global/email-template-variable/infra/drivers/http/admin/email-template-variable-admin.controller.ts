import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { EmailTemplateVariableDto } from 'src/app/global/email-template-variable/application/dtos/email-template-variable.dto';
import { CreateEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/create-email-template-variable/create-email-template-variable.service';
import { CreateEmailTemplateVariableInputDto, CreateEmailTemplateVariableOutputDto } from 'src/app/global/email-template-variable/application/usecases/create-email-template-variable/dtos/create-email-template-variable.dto';
import { DeleteEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/delete-email-template-variable/delete-email-template-variable.service';
import { EditEmailTemplateVariableInputDto } from 'src/app/global/email-template-variable/application/usecases/edit-email-template-variable/dtos/edit-email-template-variable.dto';
import { EditEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/edit-email-template-variable/edit-email-template-variable.service';
import { FindAllEmailTemplateVariableQueryDto } from 'src/app/global/email-template-variable/application/usecases/find-all-email-template-variable/dtos/find-all-email-template-variable.dto';
import { FindAllEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/find-all-email-template-variable/find-all-email-template-variable.service';
import { FindEmailTemplateVariableById } from 'src/app/global/email-template-variable/application/usecases/find-email-template-variable-by-id/find-email-template-variable-by-id.service';
import { UpdateEmailTemplateVariableStatus } from 'src/app/global/email-template-variable/application/usecases/update-email-template-variable-status/update-email-template-variable-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/email-template-variable')
@RequiredRoles(AccountRole.ADMIN)
export class EmailTemplateVariableAdminController {
  constructor(
    private readonly createEmailTemplateVariable: CreateEmailTemplateVariable,
    private readonly findAllEmailTemplateVariable: FindAllEmailTemplateVariable,
    private readonly findEmailTemplateVariableById: FindEmailTemplateVariableById,
    private readonly editEmailTemplateVariable: EditEmailTemplateVariable,
    private readonly updateEmailTemplateVariableStatus: UpdateEmailTemplateVariableStatus,
    private readonly deleteEmailTemplateVariable: DeleteEmailTemplateVariable,
  ) {}

  @Post()
  @RequiredClaims(Claim.EMAIL_TEMPLATE_VARIABLE_WRITE)
  @Swagger({
    tags: ['Variáveis de template de e-mail'],
    summary: 'Criar variável de template de e-mail',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateEmailTemplateVariableOutputDto,
  })
  public create(@Body() body: CreateEmailTemplateVariableInputDto): Promise<CreateEmailTemplateVariableOutputDto> {
    return this.createEmailTemplateVariable.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.EMAIL_TEMPLATE_VARIABLE_READ)
  @Swagger({
    tags: ['Variáveis de template de e-mail'],
    summary: 'Listar variáveis de template de e-mail com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: EmailTemplateVariableDto,
  })
  public findAll(@Query() queries: FindAllEmailTemplateVariableQueryDto): Promise<IPagination<EmailTemplateVariableDto>> {
    return this.findAllEmailTemplateVariable.execute(queries);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_VARIABLE_WRITE)
  @Swagger({
    tags: ['Variáveis de template de e-mail'],
    summary: 'Inverter status ativo da variável de template de e-mail',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateEmailTemplateVariableStatus.execute(params.id);
  }

  @Get(':id')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_VARIABLE_READ)
  @Swagger({
    tags: ['Variáveis de template de e-mail'],
    summary: 'Buscar variável de template de e-mail por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: EmailTemplateVariableDto,
  })
  public findOne(@Param() params: Params): Promise<EmailTemplateVariableDto> {
    return this.findEmailTemplateVariableById.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_VARIABLE_WRITE)
  @Swagger({
    tags: ['Variáveis de template de e-mail'],
    summary: 'Editar variável de template de e-mail',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditEmailTemplateVariableInputDto): Promise<SuccessMessage> {
    return this.editEmailTemplateVariable.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.EMAIL_TEMPLATE_VARIABLE_WRITE)
  @Swagger({
    tags: ['Variáveis de template de e-mail'],
    summary: 'Deletar variável de template de e-mail',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteEmailTemplateVariable.execute(params.id);
  }
}
