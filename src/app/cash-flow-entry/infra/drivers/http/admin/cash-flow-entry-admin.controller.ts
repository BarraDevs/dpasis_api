import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CashFlowEntryDto } from 'src/app/cash-flow-entry/application/dtos/cash-flow-entry.dto';
import { CreateCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/create-cash-flow-entry/create-cash-flow-entry.service';
import {
  CreateCashFlowEntryInputDto,
  CreateCashFlowEntryOutputDto,
} from 'src/app/cash-flow-entry/application/usecases/create-cash-flow-entry/dtos/create-cash-flow-entry.dto';
import { DeleteCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/delete-cash-flow-entry/delete-cash-flow-entry.service';
import { EditCashFlowEntryInputDto } from 'src/app/cash-flow-entry/application/usecases/edit-cash-flow-entry/dtos/edit-cash-flow-entry.dto';
import { EditCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/edit-cash-flow-entry/edit-cash-flow-entry.service';
import { FindAllCashFlowEntryQueryDto } from 'src/app/cash-flow-entry/application/usecases/find-all-cash-flow-entry/dtos/find-all-cash-flow-entry.dto';
import { FindAllCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/find-all-cash-flow-entry/find-all-cash-flow-entry.service';
import { FindCashFlowEntryById } from 'src/app/cash-flow-entry/application/usecases/find-cash-flow-entry-by-id/find-cash-flow-entry-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/cash-flow-entry')
@RequiredRoles(AccountRole.ADMIN)
export class CashFlowEntryAdminController {
  constructor(
    private readonly createCashFlowEntry: CreateCashFlowEntry,
    private readonly findAllCashFlowEntry: FindAllCashFlowEntry,
    private readonly findCashFlowEntryById: FindCashFlowEntryById,
    private readonly editCashFlowEntry: EditCashFlowEntry,
    private readonly deleteCashFlowEntry: DeleteCashFlowEntry,
  ) {}

  @Post()
  @RequiredClaims(Claim.CASH_FLOW_ENTRY_WRITE)
  @Swagger({
    tags: ['Fluxo de caixa'],
    summary: 'Criar lançamento manual no fluxo de caixa',
    applyBadRequest: true,
    applyNotFound: true,
    createdResponse: CreateCashFlowEntryOutputDto,
  })
  public create(@Body() body: CreateCashFlowEntryInputDto): Promise<CreateCashFlowEntryOutputDto> {
    return this.createCashFlowEntry.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CASH_FLOW_ENTRY_READ)
  @Swagger({
    tags: ['Fluxo de caixa'],
    summary: 'Listar lançamentos do fluxo de caixa por empresa e período',
    applyBadRequest: true,
    okPaginatedResponse: CashFlowEntryDto,
  })
  public findAll(@Query() queries: FindAllCashFlowEntryQueryDto): Promise<IPagination<CashFlowEntryDto>> {
    return this.findAllCashFlowEntry.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CASH_FLOW_ENTRY_READ)
  @Swagger({
    tags: ['Fluxo de caixa'],
    summary: 'Buscar lançamento de fluxo de caixa por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CashFlowEntryDto,
  })
  public findOne(@Param() params: Params): Promise<CashFlowEntryDto> {
    return this.findCashFlowEntryById.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CASH_FLOW_ENTRY_WRITE)
  @Swagger({
    tags: ['Fluxo de caixa'],
    summary: 'Editar lançamento do fluxo de caixa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(
    @Param() params: Params,
    @Body() body: EditCashFlowEntryInputDto,
  ): Promise<SuccessMessage> {
    return this.editCashFlowEntry.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CASH_FLOW_ENTRY_WRITE)
  @Swagger({
    tags: ['Fluxo de caixa'],
    summary: 'Excluir lançamento do fluxo de caixa',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteCashFlowEntry.execute(params.id);
  }
}
