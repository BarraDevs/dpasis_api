import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceBilledDto } from 'src/app/service/service-billed/application/dtos/service-billed.dto';
import { ActivateServiceBilled } from 'src/app/service/service-billed/application/usecases/activate-service-billed/activate-service-billed.service';
import { CreateServiceBilled } from 'src/app/service/service-billed/application/usecases/create-service-billed/create-service-billed.service';
import { CreateServiceBilledInputDto, CreateServiceBilledOutputDto } from 'src/app/service/service-billed/application/usecases/create-service-billed/dtos/create-service-billed.dto';
import { DeactivateServiceBilled } from 'src/app/service/service-billed/application/usecases/deactivate-service-billed/deactivate-service-billed.service';
import { DeleteServiceBilled } from 'src/app/service/service-billed/application/usecases/delete-service-billed/delete-service-billed.service';
import { EditServiceBilledInputDto } from 'src/app/service/service-billed/application/usecases/edit-service-billed/dtos/edit-service-billed.dto';
import { EditServiceBilled } from 'src/app/service/service-billed/application/usecases/edit-service-billed/edit-service-billed.service';
import { FindAllServiceBilledQueryDto } from 'src/app/service/service-billed/application/usecases/find-all-service-billed/dtos/find-all-service-billed.dto';
import { FindAllServiceBilled } from 'src/app/service/service-billed/application/usecases/find-all-service-billed/find-all-service-billed.service';
import { FindServiceBilledById } from 'src/app/service/service-billed/application/usecases/find-service-billed-by-id/find-service-billed-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-billed')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceBilledAdminController {
  constructor(
    private readonly activateServiceBilled: ActivateServiceBilled,
    private readonly createServiceBilled: CreateServiceBilled,
    private readonly deactivateServiceBilled: DeactivateServiceBilled,
    private readonly findAllServiceBilled: FindAllServiceBilled,
    private readonly findServiceBilledById: FindServiceBilledById,
    private readonly editServiceBilled: EditServiceBilled,
    private readonly deleteServiceBilled: DeleteServiceBilled,
  ) {}

  @Post()
  @RequiredClaims(Claim.SERVICE_BILLED_CREATE)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Criar novo serviço faturado',
    applyBadRequest: true,
    createdResponse: CreateServiceBilledOutputDto,
  })
  public create(@Body() body: CreateServiceBilledInputDto): Promise<CreateServiceBilledOutputDto> {
    return this.createServiceBilled.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.SERVICE_BILLED_LIST)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Listar serviços faturados com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceBilledDto,
  })
  public findAll(@Query() queries: FindAllServiceBilledQueryDto): Promise<IPagination<ServiceBilledDto>> {
    return this.findAllServiceBilled.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.SERVICE_BILLED_READ)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Buscar serviço faturado por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceBilledDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceBilledDto> {
    return this.findServiceBilledById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.SERVICE_BILLED_ACTIVATE)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Ativar serviço faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateServiceBilled.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.SERVICE_BILLED_DEACTIVATE)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Desativar serviço faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateServiceBilled.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.SERVICE_BILLED_UPDATE)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Editar serviço faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceBilledInputDto): Promise<SuccessMessage> {
    return this.editServiceBilled.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.SERVICE_BILLED_DELETE)
  @Swagger({
    tags: ['Serviços - Faturados'],
    summary: 'Deletar serviço faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceBilled.execute(params.id);
  }
}
