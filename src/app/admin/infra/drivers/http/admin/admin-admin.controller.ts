import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { PermissionSubjectCatalogItemDto } from 'src/app/admin/application/dtos/admin-subject-permission.dto';
import { AdminDetailDto, AdminListDto } from 'src/app/admin/application/dtos/admin.dto';
import { ActivateAdmin } from 'src/app/admin/application/usecases/activate-admin/activate-admin.service';
import { CreateAdmin } from 'src/app/admin/application/usecases/create-admin/create-admin.service';
import { CreateAdminInputDto, CreateAdminOutputDto } from 'src/app/admin/application/usecases/create-admin/dtos/create-admin.dto';
import { EditAdminInputDto } from 'src/app/admin/application/usecases/edit-admin/dtos/edit-admin.dto';
import { EditAdmin } from 'src/app/admin/application/usecases/edit-admin/edit-admin.service';
import { FindAdminById } from 'src/app/admin/application/usecases/find-admin-by-id/find-admin-by-id.service';
import { FindAllAdminQueryDto } from 'src/app/admin/application/usecases/find-all-admin/dtos/find-all-admin.dto';
import { FindAllAdmin } from 'src/app/admin/application/usecases/find-all-admin/find-all-admin.service';
import { FindPermissionSubjects } from 'src/app/admin/application/usecases/find-permission-subjects/find-permission-subjects.service';
import { InactivateAdmin } from 'src/app/admin/application/usecases/inactivate-admin/inactivate-admin.service';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/admins')
@RequiredRoles(AccountRole.ADMIN)
export class AdminAdminController {
  constructor(
    private readonly activateAdmin: ActivateAdmin,
    private readonly createAdmin: CreateAdmin,
    private readonly editAdmin: EditAdmin,
    private readonly findAllAdmin: FindAllAdmin,
    private readonly findAdminById: FindAdminById,
    private readonly findPermissionSubjects: FindPermissionSubjects,
    private readonly inactivateAdmin: InactivateAdmin,
  ) {}

  @Post()
  @RequiredClaims(Claim.ADMIN_WRITE)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Criar novo administrador',
    applyBadRequest: true,
    createdResponse: CreateAdminOutputDto,
  })
  public create(@Body() body: CreateAdminInputDto): Promise<CreateAdminOutputDto> {
    return this.createAdmin.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.ADMIN_READ)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Listar administradores com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: AdminListDto,
  })
  public findAll(@Query() queries: FindAllAdminQueryDto): Promise<IPagination<AdminListDto>> {
    return this.findAllAdmin.execute(queries);
  }

  @Get('permission-subjects')
  @RequiredClaims(Claim.ADMIN_READ)
  // @ApiOkResponse({ type: PermissionSubjectCatalogItemDto, isArray: true })
  @Swagger({
    tags: ['Administradores'],
    summary: 'Listar permissões agrupadas por assunto',
    okResponse: [PermissionSubjectCatalogItemDto],
  })
  public findPermissions(): PermissionSubjectCatalogItemDto[] {
    return this.findPermissionSubjects.execute();
  }

  @Get(':id')
  @RequiredClaims(Claim.ADMIN_READ)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Buscar administrador por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: AdminDetailDto,
  })
  public findOne(@Param() params: Params): Promise<AdminDetailDto> {
    return this.findAdminById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.ADMIN_WRITE)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Ativar administrador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateAdmin.execute(params.id);
  }

  @Patch(':id/inactivate')
  @RequiredClaims(Claim.ADMIN_WRITE)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Inativar administrador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public inactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.inactivateAdmin.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.ADMIN_WRITE)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Editar administrador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditAdminInputDto): Promise<SuccessMessage> {
    return this.editAdmin.execute(params.id, body);
  }
}
