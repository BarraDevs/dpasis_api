import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceAttendanceValueDto } from 'src/app/service/service-attendance-value/application/dtos/service-attendance-value.dto';
import { CreateServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/create-service-attendance-value/create-service-attendance-value.service';
import {
  CreateServiceAttendanceValueInputDto,
  CreateServiceAttendanceValueOutputDto,
} from 'src/app/service/service-attendance-value/application/usecases/create-service-attendance-value/dtos/create-service-attendance-value.dto';
import { DeleteServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/delete-service-attendance-value/delete-service-attendance-value.service';
import { EditServiceAttendanceValueInputDto } from 'src/app/service/service-attendance-value/application/usecases/edit-service-attendance-value/dtos/edit-service-attendance-value.dto';
import { EditServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/edit-service-attendance-value/edit-service-attendance-value.service';
import { FindAllServiceAttendanceValueQueryDto } from 'src/app/service/service-attendance-value/application/usecases/find-all-service-attendance-value/dtos/find-all-service-attendance-value.dto';
import { FindAllServiceAttendanceValue } from 'src/app/service/service-attendance-value/application/usecases/find-all-service-attendance-value/find-all-service-attendance-value.service';
import { FindServiceAttendanceValueById } from 'src/app/service/service-attendance-value/application/usecases/find-service-attendance-value-by-id/find-service-attendance-value-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-attendance-values')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceAttendanceValueAdminController {
  constructor(
    private readonly createServiceAttendanceValue: CreateServiceAttendanceValue,
    private readonly findAllServiceAttendanceValue: FindAllServiceAttendanceValue,
    private readonly findServiceAttendanceValueById: FindServiceAttendanceValueById,
    private readonly editServiceAttendanceValue: EditServiceAttendanceValue,
    private readonly deleteServiceAttendanceValue: DeleteServiceAttendanceValue,
  ) {}

  @Post()
  @Swagger({
    tags: ['Serviços - Valores de atendimento'],
    summary: 'Criar valores de atendimento de serviço',
    applyBadRequest: true,
    createdResponse: CreateServiceAttendanceValueOutputDto,
  })
  public create(@Body() body: CreateServiceAttendanceValueInputDto): Promise<CreateServiceAttendanceValueOutputDto> {
    return this.createServiceAttendanceValue.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Serviços - Valores de atendimento'],
    summary: 'Listar valores de atendimento por serviço (paginação)',
    applyBadRequest: true,
    okPaginatedResponse: ServiceAttendanceValueDto,
  })
  public findAll(@Query() queries: FindAllServiceAttendanceValueQueryDto): Promise<IPagination<ServiceAttendanceValueDto>> {
    return this.findAllServiceAttendanceValue.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Serviços - Valores de atendimento'],
    summary: 'Buscar valores de atendimento por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceAttendanceValueDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceAttendanceValueDto> {
    return this.findServiceAttendanceValueById.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Serviços - Valores de atendimento'],
    summary: 'Editar valores de atendimento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceAttendanceValueInputDto): Promise<SuccessMessage> {
    return this.editServiceAttendanceValue.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Serviços - Valores de atendimento'],
    summary: 'Excluir valores de atendimento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceAttendanceValue.execute(params.id);
  }
}
