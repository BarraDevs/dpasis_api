import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { DepartmentDto } from 'src/app/global/department/application/dtos/department.dto';
import { CreateDepartment } from 'src/app/global/department/application/usecases/create-department/create-department.service';
import { CreateDepartmentInputDto, CreateDepartmentOutputDto } from 'src/app/global/department/application/usecases/create-department/dtos/create-department.dto';
import { DeleteDepartment } from 'src/app/global/department/application/usecases/delete-department/delete-department.service';
import { EditDepartmentInputDto } from 'src/app/global/department/application/usecases/edit-department/dtos/edit-department.dto';
import { EditDepartment } from 'src/app/global/department/application/usecases/edit-department/edit-department.service';
import { FindAllDepartmentQueryDto } from 'src/app/global/department/application/usecases/find-all-department/dtos/find-all-department.dto';
import { FindAllDepartment } from 'src/app/global/department/application/usecases/find-all-department/find-all-department.service';
import { FindDepartmentById } from 'src/app/global/department/application/usecases/find-department-by-id/find-department-by-id.service';
import { UpdateDepartmentStatus } from 'src/app/global/department/application/usecases/update-department-status/update-department-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/department')
@RequiredRoles(AccountRole.ADMIN)
export class DepartmentAdminController {
  constructor(
    private readonly createDepartment: CreateDepartment,
    private readonly findAllDepartment: FindAllDepartment,
    private readonly findDepartmentById: FindDepartmentById,
    private readonly editDepartment: EditDepartment,
    private readonly updateDepartmentStatus: UpdateDepartmentStatus,
    private readonly deleteDepartment: DeleteDepartment,
  ) {}

  @Post()
  @RequiredClaims(Claim.DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Departamentos'],
    summary: 'Criar departamento',
    applyBadRequest: true,
    createdResponse: CreateDepartmentOutputDto,
  })
  public create(@Body() body: CreateDepartmentInputDto): Promise<CreateDepartmentOutputDto> {
    return this.createDepartment.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.DEPARTMENT_READ)
  @Swagger({
    tags: ['Departamentos'],
    summary: 'Listar departamentos com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: DepartmentDto,
  })
  public findAll(@Query() queries: FindAllDepartmentQueryDto): Promise<IPagination<DepartmentDto>> {
    return this.findAllDepartment.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.DEPARTMENT_READ)
  @Swagger({
    tags: ['Departamentos'],
    summary: 'Buscar departamento por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: DepartmentDto,
  })
  public findOne(@Param() params: Params): Promise<DepartmentDto> {
    return this.findDepartmentById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Departamentos'],
    summary: 'Inverter status ativo do departamento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateDepartmentStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Departamentos'],
    summary: 'Editar departamento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditDepartmentInputDto): Promise<SuccessMessage> {
    return this.editDepartment.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Departamentos'],
    summary: 'Deletar departamento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteDepartment.execute(params.id);
  }
}
