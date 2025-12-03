import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ShipperDto } from 'src/app/shipper/application/dtos/shipper.dto';
import { CreateShipper } from 'src/app/shipper/application/usecases/create-shipper/create-shipper.service';
import { CreateShipperInputDto, CreateShipperOutputDto } from 'src/app/shipper/application/usecases/create-shipper/dtos/create-shipper.dto';
import { EditShipperInputDto } from 'src/app/shipper/application/usecases/edit-shipper/dtos/edit-shipper.dto';
import { EditShipper } from 'src/app/shipper/application/usecases/edit-shipper/edit-shipper.service';
import { FindAllShipperQueryDto } from 'src/app/shipper/application/usecases/find-all-shipper/dtos/find-all-shipper.dto';
import { FindAllShipper } from 'src/app/shipper/application/usecases/find-all-shipper/find-all-shipper.service';
import { FindShipperById } from 'src/app/shipper/application/usecases/find-shipper-by-id/find-shipper-by-id.service';
import { UpdateShipperStatus } from 'src/app/shipper/application/usecases/update-shipper-status/update-shipper-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('shipper')
@RequiredRoles(AccountRole.ADMIN)
export class ShipperController {
  constructor(
    private readonly createShipperService: CreateShipper,
    private readonly findAllShipperService: FindAllShipper,
    private readonly findShipperByIdService: FindShipperById,
    private readonly editShipperService: EditShipper,
    private readonly updateShipperStatusService: UpdateShipperStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Transportadora'],
    summary: 'Cria uma nova transportadora',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateShipperOutputDto,
  })
  public create(@Body() body: CreateShipperInputDto): Promise<CreateShipperOutputDto> {
    return this.createShipperService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Transportadora'],
    summary: 'Lista todas as transportadoras',
    applyBadRequest: true,
    okPaginatedResponse: ShipperDto,
  })
  public findAll(@Query() queries: FindAllShipperQueryDto): Promise<IPagination<ShipperDto>> {
    return this.findAllShipperService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Transportadora'],
    summary: 'Busca uma transportadora por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ShipperDto,
  })
  public findOne(@Param() params: Params): Promise<ShipperDto> {
    return this.findShipperByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Transportadora'],
    summary: 'Edita uma transportadora',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditShipperInputDto): Promise<SuccessMessage> {
    return this.editShipperService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Transportadora'],
    summary: 'Ativa ou desativa uma transportadora',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateShipperStatusService.execute(params.id);
  }
}
