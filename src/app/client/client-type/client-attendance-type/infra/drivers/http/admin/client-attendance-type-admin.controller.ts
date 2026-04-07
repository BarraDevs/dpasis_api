import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientAttendanceTypeDto } from 'src/app/client/client-type/client-attendance-type/application/dtos/client-attendance-type.dto';
import { CreateClientAttendanceType } from 'src/app/client/client-type/client-attendance-type/application/usecases/create-client-attendance-type/create-client-attendance-type.service';
import { CreateClientAttendanceTypeInputDto, CreateClientAttendanceTypeOutputDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/create-client-attendance-type/dtos/create-client-attendance-type.dto';
import { DeleteClientAttendanceType } from 'src/app/client/client-type/client-attendance-type/application/usecases/delete-client-attendance-type/delete-client-attendance-type.service';
import { EditClientAttendanceTypeInputDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/edit-client-attendance-type/dtos/edit-client-attendance-type.dto';
import { EditClientAttendanceType } from 'src/app/client/client-type/client-attendance-type/application/usecases/edit-client-attendance-type/edit-client-attendance-type.service';
import { FindAllClientAttendanceTypeQueryDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-all-client-attendance-type/dtos/find-all-client-attendance-type.dto';
import { FindAllClientAttendanceType } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-all-client-attendance-type/find-all-client-attendance-type.service';
import { FindClientAttendanceTypeById } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-client-attendance-type-by-id/find-client-attendance-type-by-id.service';
import { UpdateClientAttendanceTypeStatus } from 'src/app/client/client-type/client-attendance-type/application/usecases/update-client-attendance-type-status/update-client-attendance-type-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-attendance-type')
@RequiredRoles(AccountRole.ADMIN)
export class ClientAttendanceTypeAdminController {
  constructor(
    private readonly createClientAttendanceType: CreateClientAttendanceType,
    private readonly findAllClientAttendanceType: FindAllClientAttendanceType,
    private readonly findClientAttendanceTypeById: FindClientAttendanceTypeById,
    private readonly editClientAttendanceType: EditClientAttendanceType,
    private readonly updateClientAttendanceTypeStatus: UpdateClientAttendanceTypeStatus,
    private readonly deleteClientAttendanceType: DeleteClientAttendanceType,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_TYPE_CREATE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de atendimento'],
    summary: 'Criar novo tipo de atendimento de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientAttendanceTypeOutputDto,
  })
  public create(@Body() body: CreateClientAttendanceTypeInputDto): Promise<CreateClientAttendanceTypeOutputDto> {
    return this.createClientAttendanceType.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_TYPE_LIST)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de atendimento'],
    summary: 'Listar tipos de atendimento de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientAttendanceTypeDto,
  })
  public findAll(@Query() queries: FindAllClientAttendanceTypeQueryDto): Promise<IPagination<ClientAttendanceTypeDto>> {
    return this.findAllClientAttendanceType.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_TYPE_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de atendimento'],
    summary: 'Buscar tipo de atendimento de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientAttendanceTypeDto,
  })
  public findOne(@Param() params: Params): Promise<ClientAttendanceTypeDto> {
    return this.findClientAttendanceTypeById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_TYPE_UPDATE_STATUS)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de atendimento'],
    summary: 'Inverter status ativo do tipo de atendimento de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientAttendanceTypeStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_TYPE_UPDATE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de atendimento'],
    summary: 'Editar tipo de atendimento de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientAttendanceTypeInputDto): Promise<SuccessMessage> {
    return this.editClientAttendanceType.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_TYPE_DELETE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de atendimento'],
    summary: 'Deletar tipo de atendimento de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientAttendanceType.execute(params.id);
  }
}
