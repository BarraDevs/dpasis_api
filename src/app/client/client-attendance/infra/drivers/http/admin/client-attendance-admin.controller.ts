import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientAttendanceDto } from 'src/app/client/client-attendance/application/dtos/client-attendance.dto';
import { CreateClientAttendance } from 'src/app/client/client-attendance/application/usecases/create-client-attendance/create-client-attendance.service';
import { CreateClientAttendanceInputDto, CreateClientAttendanceOutputDto } from 'src/app/client/client-attendance/application/usecases/create-client-attendance/dtos/create-client-attendance.dto';
import { DeleteClientAttendance } from 'src/app/client/client-attendance/application/usecases/delete-client-attendance/delete-client-attendance.service';
import { EditClientAttendanceInputDto } from 'src/app/client/client-attendance/application/usecases/edit-client-attendance/dtos/edit-client-attendance.dto';
import { EditClientAttendance } from 'src/app/client/client-attendance/application/usecases/edit-client-attendance/edit-client-attendance.service';
import { FindAllClientAttendanceQueryDto } from 'src/app/client/client-attendance/application/usecases/find-all-client-attendance/dtos/find-all-client-attendance.dto';
import { FindAllClientAttendance } from 'src/app/client/client-attendance/application/usecases/find-all-client-attendance/find-all-client-attendance.service';
import { FindClientAttendanceById } from 'src/app/client/client-attendance/application/usecases/find-client-attendance-by-id/find-client-attendance-by-id.service';
import { UpdateClientAttendanceStatus } from 'src/app/client/client-attendance/application/usecases/update-client-attendance-status/update-client-attendance-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-attendance')
@RequiredRoles(AccountRole.ADMIN)
export class ClientAttendanceAdminController {
  constructor(
    private readonly createClientAttendance: CreateClientAttendance,
    private readonly findAllClientAttendance: FindAllClientAttendance,
    private readonly findClientAttendanceById: FindClientAttendanceById,
    private readonly editClientAttendance: EditClientAttendance,
    private readonly updateClientAttendanceStatus: UpdateClientAttendanceStatus,
    private readonly deleteClientAttendance: DeleteClientAttendance,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Atendimento'],
    summary: 'Criar novo atendimento de cliente',
    applyBadRequest: true,
    createdResponse: CreateClientAttendanceOutputDto,
  })
  public create(@Body() body: CreateClientAttendanceInputDto): Promise<CreateClientAttendanceOutputDto> {
    return this.createClientAttendance.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Atendimento'],
    summary: 'Listar atendimentos de cliente com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ClientAttendanceDto,
  })
  public findAll(@Query() queries: FindAllClientAttendanceQueryDto): Promise<IPagination<ClientAttendanceDto>> {
    return this.findAllClientAttendance.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_READ)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Atendimento'],
    summary: 'Buscar atendimento de cliente por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientAttendanceDto,
  })
  public findOne(@Param() params: Params): Promise<ClientAttendanceDto> {
    return this.findClientAttendanceById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Atendimento'],
    summary: 'Inverter status ativo do atendimento de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateClientAttendanceStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Atendimento'],
    summary: 'Editar atendimento de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientAttendanceInputDto): Promise<SuccessMessage> {
    return this.editClientAttendance.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_ATTENDANCE_WRITE)
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Atendimento'],
    summary: 'Deletar atendimento de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientAttendance.execute(params.id);
  }
}
