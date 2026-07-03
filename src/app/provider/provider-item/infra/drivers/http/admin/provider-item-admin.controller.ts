import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ProviderItemDto } from 'src/app/provider/provider-item/application/dtos/provider-item.dto';
import { ActivateProviderItem } from 'src/app/provider/provider-item/application/usecases/activate-provider-item/activate-provider-item.service';
import { CreateProviderItem } from 'src/app/provider/provider-item/application/usecases/create-provider-item/create-provider-item.service';
import {
  CreateProviderItemInputDto,
  CreateProviderItemOutputDto,
} from 'src/app/provider/provider-item/application/usecases/create-provider-item/dtos/create-provider-item.dto';
import { DeactivateProviderItem } from 'src/app/provider/provider-item/application/usecases/deactivate-provider-item/deactivate-provider-item.service';
import { DeleteProviderItem } from 'src/app/provider/provider-item/application/usecases/delete-provider-item/delete-provider-item.service';
import { EditProviderItemInputDto } from 'src/app/provider/provider-item/application/usecases/edit-provider-item/dtos/edit-provider-item.dto';
import { EditProviderItem } from 'src/app/provider/provider-item/application/usecases/edit-provider-item/edit-provider-item.service';
import { FindAllProviderItemQueryDto } from 'src/app/provider/provider-item/application/usecases/find-all-provider-item/dtos/find-all-provider-item.dto';
import { FindAllProviderItem } from 'src/app/provider/provider-item/application/usecases/find-all-provider-item/find-all-provider-item.service';
import { FindProviderItemById } from 'src/app/provider/provider-item/application/usecases/find-provider-item-by-id/find-provider-item-by-id.service';
import { PayProviderItemInstallment } from 'src/app/provider/provider-item/application/usecases/pay-provider-item-installment/pay-provider-item-installment.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { ParamsProviderItemInstallmentId } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/provider-item')
@RequiredRoles(AccountRole.ADMIN)
export class ProviderItemAdminController {
  constructor(
    private readonly createProviderItem: CreateProviderItem,
    private readonly findAllProviderItem: FindAllProviderItem,
    private readonly findProviderItemById: FindProviderItemById,
    private readonly editProviderItem: EditProviderItem,
    private readonly payProviderItemInstallment: PayProviderItemInstallment,
    private readonly activateProviderItem: ActivateProviderItem,
    private readonly deactivateProviderItem: DeactivateProviderItem,
    private readonly deleteProviderItem: DeleteProviderItem,
  ) {}

  @Post()
  @RequiredClaims(Claim.PROVIDER_ITEM_WRITE)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Criar novo item do prestador',
    applyBadRequest: true,
    createdResponse: CreateProviderItemOutputDto,
  })
  public create(@Body() body: CreateProviderItemInputDto): Promise<CreateProviderItemOutputDto> {
    return this.createProviderItem.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.PROVIDER_ITEM_READ)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Listar itens do prestador com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ProviderItemDto,
  })
  public findAll(@Query() queries: FindAllProviderItemQueryDto): Promise<IPagination<ProviderItemDto>> {
    return this.findAllProviderItem.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.PROVIDER_ITEM_READ)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Buscar item do prestador por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ProviderItemDto,
  })
  public findOne(@Param() params: Params): Promise<ProviderItemDto> {
    return this.findProviderItemById.execute(params.id);
  }

  @Patch(':id/installments/:installmentId/pay')
  @RequiredClaims(Claim.PROVIDER_ITEM_WRITE)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Marcar parcela do item como paga',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public payInstallment(@Param() params: ParamsProviderItemInstallmentId): Promise<SuccessMessage> {
    return this.payProviderItemInstallment.execute(params.id, params.installmentId);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.PROVIDER_ITEM_WRITE)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Ativar item do prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateProviderItem.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.PROVIDER_ITEM_WRITE)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Desativar item do prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateProviderItem.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.PROVIDER_ITEM_WRITE)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Editar item do prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditProviderItemInputDto): Promise<SuccessMessage> {
    return this.editProviderItem.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.PROVIDER_ITEM_WRITE)
  @Swagger({
    tags: ['Prestadores - Itens'],
    summary: 'Deletar item do prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteProviderItem.execute(params.id);
  }
}
