import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { ActivateCompany } from 'src/app/company/company/application/usecases/activate-company/activate-company.service';
import { CreateCompany } from 'src/app/company/company/application/usecases/create-company/create-company.service';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from 'src/app/company/company/application/usecases/create-company/dtos/create-company.dto';
import { DeactivateCompany } from 'src/app/company/company/application/usecases/deactivate-company/deactivate-company.service';
import { EditCompanyInputDto } from 'src/app/company/company/application/usecases/edit-company/dtos/edit-company.dto';
import { EditCompany } from 'src/app/company/company/application/usecases/edit-company/edit-company.service';
import { FindAllCompanyQueryDto } from 'src/app/company/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { FindAllCompany } from 'src/app/company/company/application/usecases/find-all-company/find-all-company.service';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/company')
@RequiredRoles(AccountRole.ADMIN)
export class CompanyAdminController {
  constructor(
    private readonly activateCompany: ActivateCompany,
    private readonly createCompany: CreateCompany,
    private readonly deactivateCompany: DeactivateCompany,
    private readonly findAllCompany: FindAllCompany,
    private readonly findCompanyById: FindCompanyById,
    private readonly editCompany: EditCompany,
  ) {}

  @Post()
  @Swagger({
    tags: ['Empresas'],
    summary: 'Criar nova empresa',
    applyBadRequest: true,
    createdResponse: CreateCompanyOutputDto,
  })
  public create(@Body() body: CreateCompanyInputDto): Promise<CreateCompanyOutputDto> {
    return this.createCompany.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Empresas'],
    summary: 'Listar empresas com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: CompanyDto,
  })
  public findAll(@Query() queries: FindAllCompanyQueryDto): Promise<IPagination<CompanyDto>> {
    return this.findAllCompany.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Empresas'],
    summary: 'Buscar empresa por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CompanyDto,
  })
  public findOne(@Param() params: Params): Promise<CompanyDto> {
    return this.findCompanyById.execute(params.id);
  }

  @Patch(':id/activate')
  @Swagger({
    tags: ['Empresas'],
    summary: 'Ativar empresa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateCompany.execute(params.id);
  }

  @Patch(':id/deactivate')
  @Swagger({
    tags: ['Empresas'],
    summary: 'Desativar empresa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateCompany.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Empresas'],
    summary: 'Editar empresa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditCompanyInputDto): Promise<SuccessMessage> {
    return this.editCompany.execute(params.id, body);
  }
}
