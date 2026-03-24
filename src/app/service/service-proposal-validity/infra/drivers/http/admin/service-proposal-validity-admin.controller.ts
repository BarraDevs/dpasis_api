import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ServiceProposalValidityDto } from 'src/app/service/service-proposal-validity/application/dtos/service-proposal-validity.dto';
import { CreateServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/create-service-proposal-validity/create-service-proposal-validity.service';
import { CreateServiceProposalValidityInputDto, CreateServiceProposalValidityOutputDto } from 'src/app/service/service-proposal-validity/application/usecases/create-service-proposal-validity/dtos/create-service-proposal-validity.dto';
import { DeleteServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/delete-service-proposal-validity/delete-service-proposal-validity.service';
import { EditServiceProposalValidityInputDto } from 'src/app/service/service-proposal-validity/application/usecases/edit-service-proposal-validity/dtos/edit-service-proposal-validity.dto';
import { EditServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/edit-service-proposal-validity/edit-service-proposal-validity.service';
import { FindAllServiceProposalValidityQueryDto } from 'src/app/service/service-proposal-validity/application/usecases/find-all-service-proposal-validity/dtos/find-all-service-proposal-validity.dto';
import { FindAllServiceProposalValidity } from 'src/app/service/service-proposal-validity/application/usecases/find-all-service-proposal-validity/find-all-service-proposal-validity.service';
import { FindServiceProposalValidityById } from 'src/app/service/service-proposal-validity/application/usecases/find-service-proposal-validity-by-id/find-service-proposal-validity-by-id.service';
import { UpdateServiceProposalValidityStatus } from 'src/app/service/service-proposal-validity/application/usecases/update-service-proposal-validity-status/update-service-proposal-validity-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/service-proposal-validity')
@RequiredRoles(AccountRole.ADMIN)
export class ServiceProposalValidityAdminController {
  constructor(
    private readonly createServiceProposalValidity: CreateServiceProposalValidity,
    private readonly findAllServiceProposalValidity: FindAllServiceProposalValidity,
    private readonly findServiceProposalValidityById: FindServiceProposalValidityById,
    private readonly editServiceProposalValidity: EditServiceProposalValidity,
    private readonly updateServiceProposalValidityStatus: UpdateServiceProposalValidityStatus,
    private readonly deleteServiceProposalValidity: DeleteServiceProposalValidity,
  ) {}

  @Post()
  @Swagger({
    tags: ['Serviços - Validade de proposta'],
    summary: 'Criar nova validade de proposta',
    applyBadRequest: true,
    createdResponse: CreateServiceProposalValidityOutputDto,
  })
  public create(@Body() body: CreateServiceProposalValidityInputDto): Promise<CreateServiceProposalValidityOutputDto> {
    return this.createServiceProposalValidity.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Serviços - Validade de proposta'],
    summary: 'Listar validades de proposta com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ServiceProposalValidityDto,
  })
  public findAll(@Query() queries: FindAllServiceProposalValidityQueryDto): Promise<IPagination<ServiceProposalValidityDto>> {
    return this.findAllServiceProposalValidity.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Serviços - Validade de proposta'],
    summary: 'Buscar validade de proposta por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ServiceProposalValidityDto,
  })
  public findOne(@Param() params: Params): Promise<ServiceProposalValidityDto> {
    return this.findServiceProposalValidityById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Serviços - Validade de proposta'],
    summary: 'Inverter status ativo da validade de proposta',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateServiceProposalValidityStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Serviços - Validade de proposta'],
    summary: 'Editar validade de proposta',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditServiceProposalValidityInputDto): Promise<SuccessMessage> {
    return this.editServiceProposalValidity.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Serviços - Validade de proposta'],
    summary: 'Deletar validade de proposta',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteServiceProposalValidity.execute(params.id);
  }
}
