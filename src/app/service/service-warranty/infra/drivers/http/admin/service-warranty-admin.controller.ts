import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceWarrantyDto } from 'src/app/service/service-warranty/application/dtos/service-warranty.dto';
import { CreateServiceWarranty } from 'src/app/service/service-warranty/application/usecases/create-service-warranty/create-service-warranty.service';
import { CreateServiceWarrantyInputDto, CreateServiceWarrantyOutputDto } from 'src/app/service/service-warranty/application/usecases/create-service-warranty/dtos/create-service-warranty.dto';
import { DeleteServiceWarranty } from 'src/app/service/service-warranty/application/usecases/delete-service-warranty/delete-service-warranty.service';
import { EditServiceWarrantyInputDto } from 'src/app/service/service-warranty/application/usecases/edit-service-warranty/dtos/edit-service-warranty.dto';
import { EditServiceWarranty } from 'src/app/service/service-warranty/application/usecases/edit-service-warranty/edit-service-warranty.service';
import { FindAllServiceWarrantyQueryDto } from 'src/app/service/service-warranty/application/usecases/find-all-service-warranty/dtos/find-all-service-warranty.dto';
import { FindAllServiceWarranty } from 'src/app/service/service-warranty/application/usecases/find-all-service-warranty/find-all-service-warranty.service';
import { FindServiceWarrantyById } from 'src/app/service/service-warranty/application/usecases/find-service-warranty-by-id/find-service-warranty-by-id.service';
import { UpdateServiceWarrantyStatus } from 'src/app/service/service-warranty/application/usecases/update-service-warranty-status/update-service-warranty-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-warranty')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceWarrantyAdminController {
  constructor(
    private readonly createServiceWarranty: CreateServiceWarranty,
    private readonly findAllServiceWarranty: FindAllServiceWarranty,
    private readonly findServiceWarrantyById: FindServiceWarrantyById,
    private readonly editServiceWarranty: EditServiceWarranty,
    private readonly updateServiceWarrantyStatus: UpdateServiceWarrantyStatus,
    private readonly deleteServiceWarranty: DeleteServiceWarranty,
  ) {}

  @Post()
  @Swagger({
    tags: ['Garantia de Serviço'],
    summary: 'Criar nova garantia de serviço',
    applyBadRequest: true,
    createdResponse: CreateServiceWarrantyOutputDto,
  })
  public create(@Body() body: CreateServiceWarrantyInputDto): Promise<CreateServiceWarrantyOutputDto> {
    return this.createServiceWarranty.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Garantia de Serviço'],
    summary: 'Listar garantias de serviço com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceWarrantyDto,
  })
  public findAll(@Query() queries: FindAllServiceWarrantyQueryDto): Promise<IPagination<ServiceWarrantyDto>> {
    return this.findAllServiceWarranty.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Garantia de Serviço'],
    summary: 'Buscar garantia de serviço por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceWarrantyDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceWarrantyDto> {
    return this.findServiceWarrantyById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Garantia de Serviço'],
    summary: 'Inverter status ativo da garantia de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceWarrantyStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Garantia de Serviço'],
    summary: 'Editar garantia de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceWarrantyInputDto): Promise<SuccessMessage> {
    return this.editServiceWarranty.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Garantia de Serviço'],
    summary: 'Deletar garantia de serviço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceWarranty.execute(params.id);
  }
}
