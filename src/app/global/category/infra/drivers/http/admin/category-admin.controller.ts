import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CategoryDto } from 'src/app/global/category/application/dtos/category.dto';
import { CreateCategory } from 'src/app/global/category/application/usecases/create-category/create-category.service';
import { CreateCategoryInputDto, CreateCategoryOutputDto } from 'src/app/global/category/application/usecases/create-category/dtos/create-category.dto';
import { DeleteCategory } from 'src/app/global/category/application/usecases/delete-category/delete-category.service';
import { EditCategoryInputDto } from 'src/app/global/category/application/usecases/edit-category/dtos/edit-category.dto';
import { EditCategory } from 'src/app/global/category/application/usecases/edit-category/edit-category.service';
import { FindAllCategoryQueryDto } from 'src/app/global/category/application/usecases/find-all-category/dtos/find-all-category.dto';
import { FindAllCategory } from 'src/app/global/category/application/usecases/find-all-category/find-all-category.service';
import { FindCategoryById } from 'src/app/global/category/application/usecases/find-category-by-id/find-category-by-id.service';
import { UpdateCategoryStatus } from 'src/app/global/category/application/usecases/update-category-status/update-category-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/category')
@RequiredRoles(AccountRole.ADMIN)
export class CategoryAdminController {
  constructor(
    private readonly createCategory: CreateCategory,
    private readonly findAllCategory: FindAllCategory,
    private readonly findCategoryById: FindCategoryById,
    private readonly editCategory: EditCategory,
    private readonly updateCategoryStatus: UpdateCategoryStatus,
    private readonly deleteCategory: DeleteCategory,
  ) {}

  @Post()
  @RequiredClaims(Claim.CATEGORY_WRITE)
  @Swagger({
    tags: ['Categorias'],
    summary: 'Criar categoria',
    applyBadRequest: true,
    createdResponse: CreateCategoryOutputDto,
  })
  public create(@Body() body: CreateCategoryInputDto): Promise<CreateCategoryOutputDto> {
    return this.createCategory.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CATEGORY_READ)
  @Swagger({
    tags: ['Categorias'],
    summary: 'Listar categorias com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: CategoryDto,
  })
  public findAll(@Query() queries: FindAllCategoryQueryDto): Promise<IPagination<CategoryDto>> {
    return this.findAllCategory.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CATEGORY_READ)
  @Swagger({
    tags: ['Categorias'],
    summary: 'Buscar categoria por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CategoryDto,
  })
  public findOne(@Param() params: Params): Promise<CategoryDto> {
    return this.findCategoryById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CATEGORY_WRITE)
  @Swagger({
    tags: ['Categorias'],
    summary: 'Inverter status ativo da categoria',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateCategoryStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CATEGORY_WRITE)
  @Swagger({
    tags: ['Categorias'],
    summary: 'Editar categoria',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditCategoryInputDto): Promise<SuccessMessage> {
    return this.editCategory.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CATEGORY_WRITE)
  @Swagger({
    tags: ['Categorias'],
    summary: 'Deletar categoria',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteCategory.execute(params.id);
  }
}
