import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { DeliveryTermDto } from 'src/app/global/delivery-term/application/dtos/delivery-term.dto';
import { CreateDeliveryTerm } from 'src/app/global/delivery-term/application/usecases/create-delivery-term/create-delivery-term.service';
import { CreateDeliveryTermInputDto, CreateDeliveryTermOutputDto } from 'src/app/global/delivery-term/application/usecases/create-delivery-term/dtos/create-delivery-term.dto';
import { DeleteDeliveryTerm } from 'src/app/global/delivery-term/application/usecases/delete-delivery-term/delete-delivery-term.service';
import { EditDeliveryTermInputDto } from 'src/app/global/delivery-term/application/usecases/edit-delivery-term/dtos/edit-delivery-term.dto';
import { EditDeliveryTerm } from 'src/app/global/delivery-term/application/usecases/edit-delivery-term/edit-delivery-term.service';
import { FindAllDeliveryTermQueryDto } from 'src/app/global/delivery-term/application/usecases/find-all-delivery-term/dtos/find-all-delivery-term.dto';
import { FindAllDeliveryTerm } from 'src/app/global/delivery-term/application/usecases/find-all-delivery-term/find-all-delivery-term.service';
import { FindDeliveryTermById } from 'src/app/global/delivery-term/application/usecases/find-delivery-term-by-id/find-delivery-term-by-id.service';
import { UpdateDeliveryTermStatus } from 'src/app/global/delivery-term/application/usecases/update-delivery-term-status/update-delivery-term-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/delivery-term')
@RequiredRoles(AccountRole.ADMIN)
export class DeliveryTermAdminController {
  constructor(
    private readonly createDeliveryTerm: CreateDeliveryTerm,
    private readonly findAllDeliveryTerm: FindAllDeliveryTerm,
    private readonly findDeliveryTermById: FindDeliveryTermById,
    private readonly editDeliveryTerm: EditDeliveryTerm,
    private readonly updateDeliveryTermStatus: UpdateDeliveryTermStatus,
    private readonly deleteDeliveryTerm: DeleteDeliveryTerm,
  ) {}

  @Post()
  @RequiredClaims(Claim.DELIVERY_TERM_WRITE)
  @Swagger({
    tags: ['Prazos de entrega'],
    summary: 'Criar prazo de entrega',
    applyBadRequest: true,
    createdResponse: CreateDeliveryTermOutputDto,
  })
  public create(@Body() body: CreateDeliveryTermInputDto): Promise<CreateDeliveryTermOutputDto> {
    return this.createDeliveryTerm.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.DELIVERY_TERM_READ)
  @Swagger({
    tags: ['Prazos de entrega'],
    summary: 'Listar prazos de entrega com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: DeliveryTermDto,
  })
  public findAll(@Query() queries: FindAllDeliveryTermQueryDto): Promise<IPagination<DeliveryTermDto>> {
    return this.findAllDeliveryTerm.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.DELIVERY_TERM_READ)
  @Swagger({
    tags: ['Prazos de entrega'],
    summary: 'Buscar prazo de entrega por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: DeliveryTermDto,
  })
  public findOne(@Param() params: Params): Promise<DeliveryTermDto> {
    return this.findDeliveryTermById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.DELIVERY_TERM_WRITE)
  @Swagger({
    tags: ['Prazos de entrega'],
    summary: 'Inverter status ativo do prazo de entrega',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateDeliveryTermStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.DELIVERY_TERM_WRITE)
  @Swagger({
    tags: ['Prazos de entrega'],
    summary: 'Editar prazo de entrega',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditDeliveryTermInputDto): Promise<SuccessMessage> {
    return this.editDeliveryTerm.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.DELIVERY_TERM_WRITE)
  @Swagger({
    tags: ['Prazos de entrega'],
    summary: 'Deletar prazo de entrega',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteDeliveryTerm.execute(params.id);
  }
}
