import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import type { Payload } from 'src/app/authentication/domain/types/payload.type';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { User } from 'src/app/authentication/infra/decorators/user.decorator';
import { BudgetDto } from 'src/app/budget/application/dtos/budget.dto';
import { ApproveBudget } from 'src/app/budget/application/usecases/approve-budget/approve-budget.service';
import { CancelBudget } from 'src/app/budget/application/usecases/cancel-budget/cancel-budget.service';
import { CreateBudget } from 'src/app/budget/application/usecases/create-budget/create-budget.service';
import { CreateBudgetInputDto, CreateBudgetOutputDto } from 'src/app/budget/application/usecases/create-budget/dtos/create-budget.dto';
import { DeleteBudget } from 'src/app/budget/application/usecases/delete-budget/delete-budget.service';
import { EditBudgetInputDto } from 'src/app/budget/application/usecases/edit-budget/dtos/edit-budget.dto';
import { EditBudget } from 'src/app/budget/application/usecases/edit-budget/edit-budget.service';
import { FindAllBudgetQueryDto } from 'src/app/budget/application/usecases/find-all-budget/dtos/find-all-budget.dto';
import { FindAllBudget } from 'src/app/budget/application/usecases/find-all-budget/find-all-budget.service';
import { FindBudgetById } from 'src/app/budget/application/usecases/find-budget-by-id/find-budget-by-id.service';
import { RejectBudgetInputDto } from 'src/app/budget/application/usecases/reject-budget/dtos/reject-budget.dto';
import { RejectBudget } from 'src/app/budget/application/usecases/reject-budget/reject-budget.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('budget')
@RequiredRoles(AccountRole.ADMIN)
export class BudgetController {
  constructor(
    private readonly createBudgetService: CreateBudget,
    private readonly findAllBudgetService: FindAllBudget,
    private readonly findBudgetByIdService: FindBudgetById,
    private readonly editBudgetService: EditBudget,
    private readonly deleteBudgetService: DeleteBudget,
    private readonly approveBudgetService: ApproveBudget,
    private readonly rejectBudgetService: RejectBudget,
    private readonly cancelBudgetService: CancelBudget,
  ) {}

  @Post()
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Cria um novo orçamento',
    applyBadRequest: true,
    applyNotFound: true,
    createdResponse: CreateBudgetOutputDto,
  })
  public create(@Body() body: CreateBudgetInputDto): Promise<CreateBudgetOutputDto> {
    return this.createBudgetService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Lista orçamentos com filtros e paginação',
    applyBadRequest: true,
    okPaginatedResponse: BudgetDto,
  })
  public findAll(@Query() queries: FindAllBudgetQueryDto): Promise<IPagination<BudgetDto>> {
    return this.findAllBudgetService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Busca orçamento por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: BudgetDto,
  })
  public findOne(@Param() params: Params): Promise<BudgetDto> {
    return this.findBudgetByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Edita um orçamento (apenas se status for PENDING)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditBudgetInputDto): Promise<SuccessMessage> {
    return this.editBudgetService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Deleta um orçamento (apenas se status for PENDING)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteBudgetService.execute(params.id);
  }

  @Patch(':id/approve')
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Aprova um orçamento (verifica estoque de produtos)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public approve(@Param() params: Params, @User() user: Payload): Promise<SuccessMessage> {
    return this.approveBudgetService.execute(params.id, user.sub);
  }

  @Patch(':id/reject')
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Rejeita um orçamento (requer motivo)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public reject(@Param() params: Params, @Body() body: RejectBudgetInputDto, @User() user: Payload): Promise<SuccessMessage> {
    return this.rejectBudgetService.execute(params.id, { accountId: user.sub, reason: body.reason });
  }

  @Patch(':id/cancel')
  @Swagger({
    tags: ['Orçamentos'],
    summary: 'Cancela um orçamento (pode ser PENDING, APPROVED ou REJECTED)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public cancel(@Param() params: Params): Promise<SuccessMessage> {
    return this.cancelBudgetService.execute(params.id);
  }
}
