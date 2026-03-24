import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceFreightDto } from 'src/app/service/service-freight/application/dtos/service-freight.dto';
import { CreateServiceFreight } from 'src/app/service/service-freight/application/usecases/create-service-freight/create-service-freight.service';
import { CreateServiceFreightInputDto, CreateServiceFreightOutputDto } from 'src/app/service/service-freight/application/usecases/create-service-freight/dtos/create-service-freight.dto';
import { DeleteServiceFreight } from 'src/app/service/service-freight/application/usecases/delete-service-freight/delete-service-freight.service';
import { EditServiceFreightInputDto } from 'src/app/service/service-freight/application/usecases/edit-service-freight/dtos/edit-service-freight.dto';
import { EditServiceFreight } from 'src/app/service/service-freight/application/usecases/edit-service-freight/edit-service-freight.service';
import { FindAllServiceFreightQueryDto } from 'src/app/service/service-freight/application/usecases/find-all-service-freight/dtos/find-all-service-freight.dto';
import { FindAllServiceFreight } from 'src/app/service/service-freight/application/usecases/find-all-service-freight/find-all-service-freight.service';
import { FindServiceFreightById } from 'src/app/service/service-freight/application/usecases/find-service-freight-by-id/find-service-freight-by-id.service';
import { UpdateServiceFreightStatus } from 'src/app/service/service-freight/application/usecases/update-service-freight-status/update-service-freight-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-freight')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceFreightAdminController {
  constructor(
    private readonly createServiceFreight: CreateServiceFreight,
    private readonly findAllServiceFreight: FindAllServiceFreight,
    private readonly findServiceFreightById: FindServiceFreightById,
    private readonly editServiceFreight: EditServiceFreight,
    private readonly updateServiceFreightStatus: UpdateServiceFreightStatus,
    private readonly deleteServiceFreight: DeleteServiceFreight,
  ) {}

  @Post()
  @Swagger({
    tags: ['Serviços - Frete'],
    summary: 'Criar novo frete de serviço',
    applyBadRequest: true,
    createdResponse: CreateServiceFreightOutputDto,
  })
  public create(@Body() body: CreateServiceFreightInputDto): Promise<CreateServiceFreightOutputDto> {
    return this.createServiceFreight.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Serviços - Frete'],
    summary: 'Listar fretes de serviço com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceFreightDto,
  })
  public findAll(@Query() queries: FindAllServiceFreightQueryDto): Promise<IPagination<ServiceFreightDto>> {
    return this.findAllServiceFreight.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Serviços - Frete'],
    summary: 'Buscar frete de serviço por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceFreightDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceFreightDto> {
    return this.findServiceFreightById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Serviços - Frete'],
    summary: 'Inverter status ativo do frete de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceFreightStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Serviços - Frete'],
    summary: 'Editar frete de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceFreightInputDto): Promise<SuccessMessage> {
    return this.editServiceFreight.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Serviços - Frete'],
    summary: 'Deletar frete de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceFreight.execute(params.id);
  }
}
