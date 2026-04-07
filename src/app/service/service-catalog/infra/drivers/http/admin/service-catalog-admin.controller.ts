import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceCatalogDto } from 'src/app/service/service-catalog/application/dtos/service-catalog.dto';
import { ActivateServiceCatalog } from 'src/app/service/service-catalog/application/usecases/activate-service-catalog/activate-service-catalog.service';
import { CreateServiceCatalog } from 'src/app/service/service-catalog/application/usecases/create-service-catalog/create-service-catalog.service';
import { CreateServiceCatalogInputDto, CreateServiceCatalogOutputDto } from 'src/app/service/service-catalog/application/usecases/create-service-catalog/dtos/create-service-catalog.dto';
import { DeactivateServiceCatalog } from 'src/app/service/service-catalog/application/usecases/deactivate-service-catalog/deactivate-service-catalog.service';
import { DeleteServiceCatalog } from 'src/app/service/service-catalog/application/usecases/delete-service-catalog/delete-service-catalog.service';
import { EditServiceCatalogInputDto } from 'src/app/service/service-catalog/application/usecases/edit-service-catalog/dtos/edit-service-catalog.dto';
import { EditServiceCatalog } from 'src/app/service/service-catalog/application/usecases/edit-service-catalog/edit-service-catalog.service';
import { FindAllServiceCatalogQueryDto } from 'src/app/service/service-catalog/application/usecases/find-all-service-catalog/dtos/find-all-service-catalog.dto';
import { FindAllServiceCatalog } from 'src/app/service/service-catalog/application/usecases/find-all-service-catalog/find-all-service-catalog.service';
import { FindServiceCatalogById } from 'src/app/service/service-catalog/application/usecases/find-service-catalog-by-id/find-service-catalog-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-catalog')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceCatalogAdminController {
  constructor(
    private readonly activateServiceCatalog: ActivateServiceCatalog,
    private readonly createServiceCatalog: CreateServiceCatalog,
    private readonly deactivateServiceCatalog: DeactivateServiceCatalog,
    private readonly deleteServiceCatalog: DeleteServiceCatalog,
    private readonly findAllServiceCatalog: FindAllServiceCatalog,
    private readonly findServiceCatalogById: FindServiceCatalogById,
    private readonly editServiceCatalog: EditServiceCatalog,
  ) {}

  @Post()
  @RequiredClaims(Claim.SERVICE_CATALOG_CREATE)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Criar serviço no catálogo',
    applyBadRequest: true,
    createdResponse: CreateServiceCatalogOutputDto,
  })
  public create(@Body() body: CreateServiceCatalogInputDto): Promise<CreateServiceCatalogOutputDto> {
    return this.createServiceCatalog.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.SERVICE_CATALOG_LIST)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Listar serviços do catálogo com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceCatalogDto,
  })
  public findAll(@Query() queries: FindAllServiceCatalogQueryDto): Promise<IPagination<ServiceCatalogDto>> {
    return this.findAllServiceCatalog.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.SERVICE_CATALOG_READ)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Buscar serviço do catálogo por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceCatalogDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceCatalogDto> {
    return this.findServiceCatalogById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.SERVICE_CATALOG_ACTIVATE)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Ativar serviço do catálogo',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateServiceCatalog.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.SERVICE_CATALOG_DEACTIVATE)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Desativar serviço do catálogo',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateServiceCatalog.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.SERVICE_CATALOG_UPDATE)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Editar serviço do catálogo',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceCatalogInputDto): Promise<SuccessMessage> {
    return this.editServiceCatalog.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.SERVICE_CATALOG_DELETE)
  @Swagger({
    tags: ['Serviços - Serviços'],
    summary: 'Excluir serviço do catálogo',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceCatalog.execute(params.id);
  }
}
