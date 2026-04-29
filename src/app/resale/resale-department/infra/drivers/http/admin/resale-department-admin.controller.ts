import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ResaleDepartmentDto } from 'src/app/resale/resale-department/application/dtos/resale-department.dto';
import { CreateResaleDepartment } from 'src/app/resale/resale-department/application/usecases/create-resale-department/create-resale-department.service';
import {
  CreateResaleDepartmentInputDto,
  CreateResaleDepartmentOutputDto,
} from 'src/app/resale/resale-department/application/usecases/create-resale-department/dtos/create-resale-department.dto';
import { DeleteResaleDepartment } from 'src/app/resale/resale-department/application/usecases/delete-resale-department/delete-resale-department.service';
import { EditResaleDepartmentInputDto } from 'src/app/resale/resale-department/application/usecases/edit-resale-department/dtos/edit-resale-department.dto';
import { EditResaleDepartment } from 'src/app/resale/resale-department/application/usecases/edit-resale-department/edit-resale-department.service';
import { FindAllResaleDepartmentQueryDto } from 'src/app/resale/resale-department/application/usecases/find-all-resale-department/dtos/find-all-resale-department.dto';
import { FindAllResaleDepartment } from 'src/app/resale/resale-department/application/usecases/find-all-resale-department/find-all-resale-department.service';
import { FindResaleDepartmentById } from 'src/app/resale/resale-department/application/usecases/find-resale-department-by-id/find-resale-department-by-id.service';
import { UpdateResaleDepartmentStatus } from 'src/app/resale/resale-department/application/usecases/update-resale-department-status/update-resale-department-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/resale-department')
@RequiredRoles(AccountRole.ADMIN)
export class ResaleDepartmentAdminController {
  constructor(
    private readonly createResaleDepartment: CreateResaleDepartment,
    private readonly findAllResaleDepartment: FindAllResaleDepartment,
    private readonly findResaleDepartmentById: FindResaleDepartmentById,
    private readonly editResaleDepartment: EditResaleDepartment,
    private readonly updateResaleDepartmentStatus: UpdateResaleDepartmentStatus,
    private readonly deleteResaleDepartment: DeleteResaleDepartment,
  ) {}

  @Post()
  @RequiredClaims(Claim.RESALE_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Revendas - Departamentos'],
    summary: 'Criar novo departamento de revenda',
    applyBadRequest: true,
    createdResponse: CreateResaleDepartmentOutputDto,
  })
  public create(@Body() body: CreateResaleDepartmentInputDto): Promise<CreateResaleDepartmentOutputDto> {
    return this.createResaleDepartment.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.RESALE_DEPARTMENT_READ)
  @Swagger({
    tags: ['Revendas - Departamentos'],
    summary: 'Listar departamentos de revenda com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ResaleDepartmentDto,
  })
  public findAll(@Query() queries: FindAllResaleDepartmentQueryDto): Promise<IPagination<ResaleDepartmentDto>> {
    return this.findAllResaleDepartment.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.RESALE_DEPARTMENT_READ)
  @Swagger({
    tags: ['Revendas - Departamentos'],
    summary: 'Buscar departamento de revenda por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ResaleDepartmentDto,
  })
  public findOne(@Param() params: Params): Promise<ResaleDepartmentDto> {
    return this.findResaleDepartmentById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.RESALE_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Revendas - Departamentos'],
    summary: 'Inverter status ativo do departamento de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateResaleDepartmentStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.RESALE_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Revendas - Departamentos'],
    summary: 'Editar departamento de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditResaleDepartmentInputDto): Promise<SuccessMessage> {
    return this.editResaleDepartment.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.RESALE_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Revendas - Departamentos'],
    summary: 'Deletar departamento de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteResaleDepartment.execute(params.id);
  }
}
