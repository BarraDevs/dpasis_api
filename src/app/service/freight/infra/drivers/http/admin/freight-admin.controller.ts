import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { FreightDto } from 'src/app/service/freight/application/dtos/freight.dto';
import { CreateFreight } from 'src/app/service/freight/application/usecases/create-freight/create-freight.service';
import { CreateFreightInputDto, CreateFreightOutputDto } from 'src/app/service/freight/application/usecases/create-freight/dtos/create-freight.dto';
import { DeleteFreight } from 'src/app/service/freight/application/usecases/delete-freight/delete-freight.service';
import { EditFreightInputDto } from 'src/app/service/freight/application/usecases/edit-freight/dtos/edit-freight.dto';
import { EditFreight } from 'src/app/service/freight/application/usecases/edit-freight/edit-freight.service';
import { FindAllFreightQueryDto } from 'src/app/service/freight/application/usecases/find-all-freight/dtos/find-all-freight.dto';
import { FindAllFreight } from 'src/app/service/freight/application/usecases/find-all-freight/find-all-freight.service';
import { FindFreightById } from 'src/app/service/freight/application/usecases/find-freight-by-id/find-freight-by-id.service';
import { UpdateFreightStatus } from 'src/app/service/freight/application/usecases/update-freight-status/update-freight-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/freight')
@RequiredRoles(AccountRole.ADMIN)
export class FreightAdminController {
  constructor(
    private readonly createFreight: CreateFreight,
    private readonly findAllFreight: FindAllFreight,
    private readonly findFreightById: FindFreightById,
    private readonly editFreight: EditFreight,
    private readonly updateFreightStatus: UpdateFreightStatus,
    private readonly deleteFreight: DeleteFreight,
  ) {}

  @Post()
  @RequiredClaims(Claim.FREIGHT_WRITE)
  @Swagger({
    tags: ['Fretes'],
    summary: 'Criar frete',
    applyBadRequest: true,
    createdResponse: CreateFreightOutputDto,
  })
  public create(@Body() body: CreateFreightInputDto): Promise<CreateFreightOutputDto> {
    return this.createFreight.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.FREIGHT_READ)
  @Swagger({
    tags: ['Fretes'],
    summary: 'Listar fretes com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FreightDto,
  })
  public findAll(@Query() queries: FindAllFreightQueryDto): Promise<IPagination<FreightDto>> {
    return this.findAllFreight.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.FREIGHT_READ)
  @Swagger({
    tags: ['Fretes'],
    summary: 'Buscar frete por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: FreightDto,
  })
  public findOne(@Param() params: Params): Promise<FreightDto> {
    return this.findFreightById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.FREIGHT_WRITE)
  @Swagger({
    tags: ['Fretes'],
    summary: 'Inverter status ativo do frete',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateFreightStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.FREIGHT_WRITE)
  @Swagger({
    tags: ['Fretes'],
    summary: 'Editar frete',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditFreightInputDto): Promise<SuccessMessage> {
    return this.editFreight.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.FREIGHT_WRITE)
  @Swagger({
    tags: ['Fretes'],
    summary: 'Deletar frete',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteFreight.execute(params.id);
  }
}
