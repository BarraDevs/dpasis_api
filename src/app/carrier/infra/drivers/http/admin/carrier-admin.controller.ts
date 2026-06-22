import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CarrierDto } from 'src/app/carrier/application/dtos/carrier.dto';
import { ActivateCarrier } from 'src/app/carrier/application/usecases/activate-carrier/activate-carrier.service';
import { CreateCarrier } from 'src/app/carrier/application/usecases/create-carrier/create-carrier.service';
import { CreateCarrierInputDto, CreateCarrierOutputDto } from 'src/app/carrier/application/usecases/create-carrier/dtos/create-carrier.dto';
import { DeactivateCarrier } from 'src/app/carrier/application/usecases/deactivate-carrier/deactivate-carrier.service';
import { DeleteCarrier } from 'src/app/carrier/application/usecases/delete-carrier/delete-carrier.service';
import { EditCarrierInputDto } from 'src/app/carrier/application/usecases/edit-carrier/dtos/edit-carrier.dto';
import { EditCarrier } from 'src/app/carrier/application/usecases/edit-carrier/edit-carrier.service';
import { FindAllCarrierQueryDto } from 'src/app/carrier/application/usecases/find-all-carrier/dtos/find-all-carrier.dto';
import { FindAllCarrier } from 'src/app/carrier/application/usecases/find-all-carrier/find-all-carrier.service';
import { FindCarrierById } from 'src/app/carrier/application/usecases/find-carrier-by-id/find-carrier-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/carrier')
@RequiredRoles(AccountRole.ADMIN)
export class CarrierAdminController {
  constructor(
    private readonly activateCarrier: ActivateCarrier,
    private readonly createCarrier: CreateCarrier,
    private readonly deactivateCarrier: DeactivateCarrier,
    private readonly deleteCarrier: DeleteCarrier,
    private readonly findAllCarrier: FindAllCarrier,
    private readonly findCarrierById: FindCarrierById,
    private readonly editCarrier: EditCarrier,
  ) {}

  @Post()
  @RequiredClaims(Claim.CARRIER_WRITE)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Criar nova transportadora',
    applyBadRequest: true,
    createdResponse: CreateCarrierOutputDto,
  })
  public create(@Body() body: CreateCarrierInputDto): Promise<CreateCarrierOutputDto> {
    return this.createCarrier.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CARRIER_READ)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Listar transportadoras com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: CarrierDto,
  })
  public findAll(@Query() queries: FindAllCarrierQueryDto): Promise<IPagination<CarrierDto>> {
    return this.findAllCarrier.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CARRIER_READ)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Buscar transportadora por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CarrierDto,
  })
  public findOne(@Param() params: Params): Promise<CarrierDto> {
    return this.findCarrierById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.CARRIER_WRITE)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Ativar transportadora',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateCarrier.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.CARRIER_WRITE)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Desativar transportadora',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateCarrier.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CARRIER_WRITE)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Editar transportadora',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditCarrierInputDto): Promise<SuccessMessage> {
    return this.editCarrier.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CARRIER_WRITE)
  @Swagger({
    tags: ['Transportadoras'],
    summary: 'Excluir transportadora',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteCarrier.execute(params.id);
  }
}
