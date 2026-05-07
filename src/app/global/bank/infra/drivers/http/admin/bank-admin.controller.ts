import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { CreateBank } from 'src/app/global/bank/application/usecases/create-bank/create-bank.service';
import { CreateBankInputDto, CreateBankOutputDto } from 'src/app/global/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { DeleteBank } from 'src/app/global/bank/application/usecases/delete-bank/delete-bank.service';
import { EditBankInputDto } from 'src/app/global/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { EditBank } from 'src/app/global/bank/application/usecases/edit-bank/edit-bank.service';
import { FindAllBankQueryDto } from 'src/app/global/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { FindAllBank } from 'src/app/global/bank/application/usecases/find-all-bank/find-all-bank.service';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { UpdateBankStatus } from 'src/app/global/bank/application/usecases/update-bank-status/update-bank-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/bank')
@RequiredRoles(AccountRole.ADMIN)
export class BankAdminController {
  constructor(
    private readonly createBank: CreateBank,
    private readonly findAllBank: FindAllBank,
    private readonly findBankById: FindBankById,
    private readonly editBank: EditBank,
    private readonly updateBankStatus: UpdateBankStatus,
    private readonly deleteBank: DeleteBank,
  ) {}

  @Post()
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Criar novo banco',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateBankOutputDto,
  })
  public create(@Body() body: CreateBankInputDto): Promise<CreateBankOutputDto> {
    return this.createBank.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.BANK_READ)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Listar bancos com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: BankDto,
  })
  public findAll(@Query() queries: FindAllBankQueryDto): Promise<IPagination<BankDto>> {
    return this.findAllBank.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.BANK_READ)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Buscar banco por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: BankDto,
  })
  public findOne(@Param() params: Params): Promise<BankDto> {
    return this.findBankById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Inverter status ativo do banco',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateBankStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Editar banco',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditBankInputDto): Promise<SuccessMessage> {
    return this.editBank.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Excluir banco',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteBank.execute(params.id);
  }
}
