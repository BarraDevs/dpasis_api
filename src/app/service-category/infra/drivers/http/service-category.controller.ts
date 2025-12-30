import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceCategoryDto } from 'src/app/service-category/application/dtos/service-category.dto';
import { CreateServiceCategory } from 'src/app/service-category/application/usecases/create-service-category/create-service-category.service';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from 'src/app/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { DeleteServiceCategory } from 'src/app/service-category/application/usecases/delete-service-category/delete-service-category.service';
import { EditServiceCategoryInputDto } from 'src/app/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { EditServiceCategory } from 'src/app/service-category/application/usecases/edit-service-category/edit-service-category.service';
import { FindAllServiceCategoryQueryDto } from 'src/app/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { FindAllServiceCategory } from 'src/app/service-category/application/usecases/find-all-service-category/find-all-service-category.service';
import { FindServiceCategoryById } from 'src/app/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { UpdateServiceCategoryStatus } from 'src/app/service-category/application/usecases/update-service-category-status/update-service-category-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('service-category')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceCategoryController {
  constructor(
    private readonly createServiceCategoryService: CreateServiceCategory,
    private readonly findAllServiceCategoryService: FindAllServiceCategory,
    private readonly findServiceCategoryByIdService: FindServiceCategoryById,
    private readonly editServiceCategoryService: EditServiceCategory,
    private readonly deleteServiceCategoryService: DeleteServiceCategory,
    private readonly updateServiceCategoryStatusService: UpdateServiceCategoryStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Categorias de Serviço'],
    summary: 'Rota para criar uma categoria de serviço',
    applyBadRequest: true,
    createdResponse: CreateServiceCategoryOutputDto,
  })
  public create(@Body() body: CreateServiceCategoryInputDto): Promise<CreateServiceCategoryOutputDto> {
    return this.createServiceCategoryService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Categorias de Serviço'],
    summary: 'Rota para listar categorias de serviço',
    applyBadRequest: true,
    okPaginatedResponse: ServiceCategoryDto,
  })
  public findAll(@Query() queries: FindAllServiceCategoryQueryDto): Promise<IPagination<ServiceCategoryDto>> {
    return this.findAllServiceCategoryService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Categorias de Serviço'],
    summary: 'Rota para buscar uma categoria de serviço por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceCategoryDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceCategoryDto> {
    return this.findServiceCategoryByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Categorias de Serviço'],
    summary: 'Rota para editar uma categoria de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceCategoryInputDto): Promise<SuccessMessage> {
    return this.editServiceCategoryService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Categorias de Serviço'],
    summary: 'Rota para atualizar o status de uma categoria de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceCategoryStatusService.execute(params.id);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Categorias de Serviço'],
    summary: 'Rota para deletar uma categoria de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceCategoryService.execute(params.id);
  }
}
