import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from 'src/app/company/application/usecases/create-company/dtos/create-company.dto';
import { EditCompanyInputDto } from 'src/app/company/application/usecases/edit-company/dtos/edit-company.dto';
import { EditCompany } from 'src/app/company/application/usecases/edit-company/edit-company.service';
import { FindAllCompanyQueryDto } from 'src/app/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { FindAllCompany } from 'src/app/company/application/usecases/find-all-company/find-all-company.service';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { UpdateCompanyStatus } from 'src/app/company/application/usecases/update-company-status/update-company-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('company')
@RequiredRoles(AccountRole.ADMIN)
export class CompanyController {
  constructor(
    private readonly createCompanyService: CreateCompany,
    private readonly findAllCompanyService: FindAllCompany,
    private readonly findCompanyByIdService: FindCompanyById,
    private readonly editCompanyService: EditCompany,
    private readonly updateCompanyStatusService: UpdateCompanyStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Empresa'],
    summary: 'Cria uma nova empresa',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateCompanyOutputDto,
  })
  public create(@Body() body: CreateCompanyInputDto): Promise<CreateCompanyOutputDto> {
    return this.createCompanyService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Empresa'],
    summary: 'Lista todas as empresas',
    applyBadRequest: true,
    okPaginatedResponse: CompanyDto,
  })
  public findAll(@Query() queries: FindAllCompanyQueryDto): Promise<IPagination<CompanyDto>> {
    return this.findAllCompanyService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Empresa'],
    summary: 'Busca uma empresa por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CompanyDto,
  })
  public findOne(@Param() params: Params): Promise<CompanyDto> {
    return this.findCompanyByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Empresa'],
    summary: 'Edita uma empresa',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditCompanyInputDto): Promise<SuccessMessage> {
    return this.editCompanyService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Empresa'],
    summary: 'Atualiza o status de uma empresa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateCompanyStatusService.execute(params.id);
  }
}
