import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceCategoryDto } from 'src/app/service/service-category/application/dtos/service-category.dto';
import { CreateServiceCategory } from 'src/app/service/service-category/application/usecases/create-service-category/create-service-category.service';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from 'src/app/service/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { DeleteServiceCategory } from 'src/app/service/service-category/application/usecases/delete-service-category/delete-service-category.service';
import { EditServiceCategoryInputDto } from 'src/app/service/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { EditServiceCategory } from 'src/app/service/service-category/application/usecases/edit-service-category/edit-service-category.service';
import { FindAllServiceCategoryQueryDto } from 'src/app/service/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { FindAllServiceCategory } from 'src/app/service/service-category/application/usecases/find-all-service-category/find-all-service-category.service';
import { FindServiceCategoryById } from 'src/app/service/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { UpdateServiceCategoryStatus } from 'src/app/service/service-category/application/usecases/update-service-category-status/update-service-category-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-category')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceCategoryAdminController {
  constructor(
    private readonly createServiceCategory: CreateServiceCategory,
    private readonly findAllServiceCategory: FindAllServiceCategory,
    private readonly findServiceCategoryById: FindServiceCategoryById,
    private readonly editServiceCategory: EditServiceCategory,
    private readonly updateServiceCategoryStatus: UpdateServiceCategoryStatus,
    private readonly deleteServiceCategory: DeleteServiceCategory,
  ) {}

  @Post()
  @RequiredClaims(Claim.SERVICE_CATEGORY_WRITE)
  @Swagger({
    tags: ['Serviços - Categorias'],
    summary: 'Criar nova categoria de serviço',
    applyBadRequest: true,
    createdResponse: CreateServiceCategoryOutputDto,
  })
  public create(@Body() body: CreateServiceCategoryInputDto): Promise<CreateServiceCategoryOutputDto> {
    return this.createServiceCategory.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.SERVICE_CATEGORY_READ)
  @Swagger({
    tags: ['Serviços - Categorias'],
    summary: 'Listar categorias de serviço com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceCategoryDto,
  })
  public findAll(@Query() queries: FindAllServiceCategoryQueryDto): Promise<IPagination<ServiceCategoryDto>> {
    return this.findAllServiceCategory.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.SERVICE_CATEGORY_READ)
  @Swagger({
    tags: ['Serviços - Categorias'],
    summary: 'Buscar categoria de serviço por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceCategoryDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceCategoryDto> {
    return this.findServiceCategoryById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.SERVICE_CATEGORY_WRITE)
  @Swagger({
    tags: ['Serviços - Categorias'],
    summary: 'Inverter status ativo da categoria de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceCategoryStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.SERVICE_CATEGORY_WRITE)
  @Swagger({
    tags: ['Serviços - Categorias'],
    summary: 'Editar categoria de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceCategoryInputDto): Promise<SuccessMessage> {
    return this.editServiceCategory.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.SERVICE_CATEGORY_WRITE)
  @Swagger({
    tags: ['Serviços - Categorias'],
    summary: 'Deletar categoria de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceCategory.execute(params.id);
  }
}
