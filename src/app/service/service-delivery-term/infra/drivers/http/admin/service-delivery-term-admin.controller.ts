import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceDeliveryTermDto } from 'src/app/service/service-delivery-term/application/dtos/service-delivery-term.dto';
import { CreateServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/create-service-delivery-term/create-service-delivery-term.service';
import { CreateServiceDeliveryTermInputDto, CreateServiceDeliveryTermOutputDto } from 'src/app/service/service-delivery-term/application/usecases/create-service-delivery-term/dtos/create-service-delivery-term.dto';
import { DeleteServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/delete-service-delivery-term/delete-service-delivery-term.service';
import { EditServiceDeliveryTermInputDto } from 'src/app/service/service-delivery-term/application/usecases/edit-service-delivery-term/dtos/edit-service-delivery-term.dto';
import { EditServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/edit-service-delivery-term/edit-service-delivery-term.service';
import { FindAllServiceDeliveryTermQueryDto } from 'src/app/service/service-delivery-term/application/usecases/find-all-service-delivery-term/dtos/find-all-service-delivery-term.dto';
import { FindAllServiceDeliveryTerm } from 'src/app/service/service-delivery-term/application/usecases/find-all-service-delivery-term/find-all-service-delivery-term.service';
import { FindServiceDeliveryTermById } from 'src/app/service/service-delivery-term/application/usecases/find-service-delivery-term-by-id/find-service-delivery-term-by-id.service';
import { UpdateServiceDeliveryTermStatus } from 'src/app/service/service-delivery-term/application/usecases/update-service-delivery-term-status/update-service-delivery-term-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-delivery-term')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceDeliveryTermAdminController {
  constructor(
    private readonly createServiceDeliveryTerm: CreateServiceDeliveryTerm,
    private readonly findAllServiceDeliveryTerm: FindAllServiceDeliveryTerm,
    private readonly findServiceDeliveryTermById: FindServiceDeliveryTermById,
    private readonly editServiceDeliveryTerm: EditServiceDeliveryTerm,
    private readonly updateServiceDeliveryTermStatus: UpdateServiceDeliveryTermStatus,
    private readonly deleteServiceDeliveryTerm: DeleteServiceDeliveryTerm,
  ) {}

  @Post()
  @RequiredClaims(Claim.SERVICE_DELIVERY_TERM_CREATE)
  @Swagger({
    tags: ['Serviços - Prazo de entrega'],
    summary: 'Criar novo prazo de entrega',
    applyBadRequest: true,
    createdResponse: CreateServiceDeliveryTermOutputDto,
  })
  public create(@Body() body: CreateServiceDeliveryTermInputDto): Promise<CreateServiceDeliveryTermOutputDto> {
    return this.createServiceDeliveryTerm.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.SERVICE_DELIVERY_TERM_LIST)
  @Swagger({
    tags: ['Serviços - Prazo de entrega'],
    summary: 'Listar prazos de entrega com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceDeliveryTermDto,
  })
  public findAll(@Query() queries: FindAllServiceDeliveryTermQueryDto): Promise<IPagination<ServiceDeliveryTermDto>> {
    return this.findAllServiceDeliveryTerm.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.SERVICE_DELIVERY_TERM_DETAIL)
  @Swagger({
    tags: ['Serviços - Prazo de entrega'],
    summary: 'Buscar prazo de entrega por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceDeliveryTermDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceDeliveryTermDto> {
    return this.findServiceDeliveryTermById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.SERVICE_DELIVERY_TERM_UPDATE_STATUS)
  @Swagger({
    tags: ['Serviços - Prazo de entrega'],
    summary: 'Inverter status ativo do prazo de entrega',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceDeliveryTermStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.SERVICE_DELIVERY_TERM_UPDATE)
  @Swagger({
    tags: ['Serviços - Prazo de entrega'],
    summary: 'Editar prazo de entrega',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceDeliveryTermInputDto): Promise<SuccessMessage> {
    return this.editServiceDeliveryTerm.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.SERVICE_DELIVERY_TERM_DELETE)
  @Swagger({
    tags: ['Serviços - Prazo de entrega'],
    summary: 'Deletar prazo de entrega',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceDeliveryTerm.execute(params.id);
  }
}
