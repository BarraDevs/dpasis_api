import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDepartmentDto } from 'src/app/client/client-department/application/dtos/client-department.dto';
import { CreateClientDepartment } from 'src/app/client/client-department/application/usecases/create-client-department/create-client-department.service';
import { CreateClientDepartmentInputDto, CreateClientDepartmentOutputDto } from 'src/app/client/client-department/application/usecases/create-client-department/dtos/create-client-department.dto';
import { DeleteClientDepartment } from 'src/app/client/client-department/application/usecases/delete-client-department/delete-client-department.service';
import { EditClientDepartmentInputDto } from 'src/app/client/client-department/application/usecases/edit-client-department/dtos/edit-client-department.dto';
import { EditClientDepartment } from 'src/app/client/client-department/application/usecases/edit-client-department/edit-client-department.service';
import { FindAllClientDepartmentQueryDto } from 'src/app/client/client-department/application/usecases/find-all-client-department/dtos/find-all-client-department.dto';
import { FindAllClientDepartment } from 'src/app/client/client-department/application/usecases/find-all-client-department/find-all-client-department.service';
import { FindClientDepartmentById } from 'src/app/client/client-department/application/usecases/find-client-department-by-id/find-client-department-by-id.service';
import { UpdateClientDepartmentStatus } from 'src/app/client/client-department/application/usecases/update-client-department-status/update-client-department-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-department')
@RequiredRoles(AccountRole.ADMIN)
export class ClientDepartmentAdminController {
  constructor(
    private readonly createClientDepartment: CreateClientDepartment,
    private readonly findAllClientDepartment: FindAllClientDepartment,
    private readonly findClientDepartmentById: FindClientDepartmentById,
    private readonly editClientDepartment: EditClientDepartment,
    private readonly updateClientDepartmentStatus: UpdateClientDepartmentStatus,
    private readonly deleteClientDepartment: DeleteClientDepartment,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Clientes - Departamentos'],
    summary: 'Criar novo departamento de clientes',
    applyBadRequest: true,
    createdResponse: CreateClientDepartmentOutputDto,
  })
  public create(@Body() body: CreateClientDepartmentInputDto): Promise<CreateClientDepartmentOutputDto> {
    return this.createClientDepartment.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_DEPARTMENT_READ)
  @Swagger({
    tags: ['Clientes - Departamentos'],
    summary: 'Listar departamentos de clientes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientDepartmentDto,
  })
  public findAll(@Query() queries: FindAllClientDepartmentQueryDto): Promise<IPagination<ClientDepartmentDto>> {
    return this.findAllClientDepartment.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_DEPARTMENT_READ)
  @Swagger({
    tags: ['Clientes - Departamentos'],
    summary: 'Buscar departamento de clientes por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientDepartmentDto,
  })
  public findOne(@Param() params: Params): Promise<ClientDepartmentDto> {
    return this.findClientDepartmentById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Clientes - Departamentos'],
    summary: 'Inverter status ativo do departamento de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientDepartmentStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Clientes - Departamentos'],
    summary: 'Editar departamento de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientDepartmentInputDto): Promise<SuccessMessage> {
    return this.editClientDepartment.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_DEPARTMENT_WRITE)
  @Swagger({
    tags: ['Clientes - Departamentos'],
    summary: 'Deletar departamento de clientes',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientDepartment.execute(params.id);
  }
}
