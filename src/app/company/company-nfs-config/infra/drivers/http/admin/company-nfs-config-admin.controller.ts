import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { CreateCompanyNfsConfig } from 'src/app/company/company-nfs-config/application/usecases/create-company-nfs-config/create-company-nfs-config.service';
import { CreateCompanyNfsConfigInputDto, CreateCompanyNfsConfigOutputDto } from 'src/app/company/company-nfs-config/application/usecases/create-company-nfs-config/dtos/create-company-nfs-config.dto';
import { EditCompanyNfsConfigInputDto } from 'src/app/company/company-nfs-config/application/usecases/edit-company-nfs-config/dtos/edit-company-nfs-config.dto';
import { EditCompanyNfsConfig } from 'src/app/company/company-nfs-config/application/usecases/edit-company-nfs-config/edit-company-nfs-config.service';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params, ParamsCompanyId } from 'src/infra/validators/class/dtos/params';

@Controller('admin/company-nfs-config')
@RequiredRoles(AccountRole.ADMIN)
export class CompanyNfsConfigAdminController {
  constructor(
    private readonly createCompanyNfsConfig: CreateCompanyNfsConfig,
    private readonly editCompanyNfsConfig: EditCompanyNfsConfig,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  @Post()
  @RequiredClaims(Claim.COMPANY_NFS_CONFIG_WRITE)
  @Swagger({
    tags: ['Empresas - Config NFS-e'],
    summary: 'Criar configuração de NFS-e para empresa',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateCompanyNfsConfigOutputDto,
  })
  public create(@Body() body: CreateCompanyNfsConfigInputDto): Promise<CreateCompanyNfsConfigOutputDto> {
    return this.createCompanyNfsConfig.execute(body);
  }

  @Get('company/:companyId')
  @RequiredClaims(Claim.COMPANY_NFS_CONFIG_READ)
  @Swagger({
    tags: ['Empresas - Config NFS-e'],
    summary: 'Buscar configuração de NFS-e por ID da empresa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CompanyNfsConfigDto,
  })
  public findByCompanyId(@Param() params: ParamsCompanyId): Promise<CompanyNfsConfigDto> {
    return this.findCompanyNfsConfigByCompanyId.execute(params.companyId);
  }

  @Patch(':id')
  @RequiredClaims(Claim.COMPANY_NFS_CONFIG_WRITE)
  @Swagger({
    tags: ['Empresas - Config NFS-e'],
    summary: 'Editar configuração de NFS-e',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditCompanyNfsConfigInputDto): Promise<SuccessMessage> {
    return this.editCompanyNfsConfig.execute(params.id, body);
  }
}
