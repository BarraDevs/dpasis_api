import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceDto } from 'src/app/service/application/dtos/service.dto';
import { CreateService } from 'src/app/service/application/usecases/create-service/create-service.service';
import { CreateServiceInputDto, CreateServiceOutputDto } from 'src/app/service/application/usecases/create-service/dtos/create-service.dto';
import { EditServiceInputDto } from 'src/app/service/application/usecases/edit-service/dtos/edit-service.dto';
import { EditService } from 'src/app/service/application/usecases/edit-service/edit-service.service';
import { FindAllServiceQueryDto } from 'src/app/service/application/usecases/find-all-service/dtos/find-all-service.dto';
import { FindAllService } from 'src/app/service/application/usecases/find-all-service/find-all-service.service';
import { FindServiceById } from 'src/app/service/application/usecases/find-service-by-id/find-service-by-id.service';
import { UpdateServiceStatus } from 'src/app/service/application/usecases/update-service-status/update-service-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('service')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceController {
  constructor(
    private readonly createServiceService: CreateService,
    private readonly findAllServiceService: FindAllService,
    private readonly findServiceByIdService: FindServiceById,
    private readonly editServiceService: EditService,
    private readonly updateServiceStatusService: UpdateServiceStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Serviços'],
    summary: 'Rota para criar um serviço',
    applyBadRequest: true,
    createdResponse: CreateServiceOutputDto,
  })
  public create(@Body() body: CreateServiceInputDto): Promise<CreateServiceOutputDto> {
    return this.createServiceService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Serviços'],
    summary: 'Rota para listar serviços',
    applyBadRequest: true,
    okPaginatedResponse: ServiceDto,
  })
  public findAll(@Query() queries: FindAllServiceQueryDto): Promise<IPagination<ServiceDto>> {
    return this.findAllServiceService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Serviços'],
    summary: 'Rota para buscar um serviço por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceDto> {
    return this.findServiceByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Serviços'],
    summary: 'Rota para editar um serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceInputDto): Promise<SuccessMessage> {
    return this.editServiceService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Serviços'],
    summary: 'Rota para atualizar o status de um serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceStatusService.execute(params.id);
  }
}
